const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;

// "Rozpakowywanie" przychodzacych zapytan
const urlencodedParser = bodyParser.urlencoded({ extended: false });
// Whitelist adresow
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
// Ogolna konfiguracja app
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(urlencodedParser);

// Polaczenie sie z baza z podanego pliku
let db = new sqlite3.Database("frontendDB.sqlite3", err => {
  if (err) {
    return console.error(err.message);
  }
});

// 'SELECT tasks.origin_id AS originId, SUM(tasks.expense) AS sumExpense, SUM(tasks.quantity) AS sumQuantity FROM tasks JOIN origin ON tasks.origin_id = origin.id WHERE tasks.task = "zakup" GROUP BY tasks.origin_id'
// 'SELECT origin_id AS originId, metal_type AS metalType, SUM(quantity) AS sumQuantity FROM tasks WHERE metal_type = "stalowy" GROUP BY origin_id UNION SELECT origin_id AS originId, metal_type AS metalType, SUM(quantity) AS sumQuantity FROM tasks WHERE metal_type = "kolorowy" GROUP BY origin_id'

// Przepisanie tabeli z bazy do tablicy
function dbTableToArray(rows) {
  const tasks = rows.map(row => {
    return {
      id: row.id,
      actionDate: row.action_date,
      createdAt: row.created_at,
      deletedAt: row.deleted_at,
      task: row.task,
      comment: row.comment,
      expense: row.expense,
      quantity: row.quantity,
      metalType: row.metal_type,
      originId: row.origin_id
    };
  });
  return tasks;
}

function sendError(res, err) {
  console.error(err.message);
  console.trace();
  // Przeslanie informacji o bledzie
  res.status(500).end(err.message);
}

// Sprawdzenie poprawnosci daty
function isValidDate(dateString) {
  // Validates that the input string is a valid date formatted as "mm.dd.yyyy"
  // First check for the pattern
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return false;
  // Parse the date parts to integers
  var parts = dateString.split(".");
  var day = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[2], 10);
  // Check the ranges of month and year
  if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;
  var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Adjust for leap years
  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0))
    monthLength[1] = 29;
  // Check the range of the day
  return day > 0 && day <= monthLength[month - 1];
}

// Sprawdzenie poprawnosci przychodzacego POST
function isValidInsert(insertObject) {
  // Mozliwe do wyboru tasks/metalTypes
  const possibleTasks = ["zakup", "odbior", "zaliczka", "wplywy", "wydatki"];
  const disabledFieldsIf = ["zaliczka", "wplywy", "wydatki"];
  const possibleMetalTypes = ["stalowy", "kolorowy"];
  const possibleOrigin = ["1", "2", "3"];
  let valid = true;
  let err;

  for (let [key, v] of Object.entries(insertObject)) {
    if (valid) {
      switch (key) {
        case "actionDate":
          if (!(typeof v === "string" && isValidDate(v))) {
            valid = false;
            err = "Invalif actionDate";
          }
          break;
        case "task":
          if (!(typeof v === "string" && possibleTasks.includes(v))) {
            valid = false;
            err = "Invalif task";
          }
          break;
        case "comment":
          if (!(typeof v === "string")) {
            valid = false;
            err = "Invalif comment";
          }
          break;
        case "expense":
          if (!(typeof v === "string" && v !== "" && !isNaN(v) && v >= 0)) {
            valid = false;
            err = "Invalif expense";
          }
          break;
        case "quantity":
          if (!(typeof v === "string" && !isNaN(v) && v >= 0)) {
            valid = false;
            err = "Invalif quantity";
          }
          break;
        case "metalType":
          // metalType musi byc typu string i zawierac sie w possibleMetalTypes
          // lub zadanie (insertObject.task) musi zawierac sie w disabledFieldsIf i jednoczenie metalType musi byc ""
          if (
            !(
              typeof v === "string" &&
              (possibleMetalTypes.includes(v) ||
                (disabledFieldsIf.includes(insertObject.task) && v === ""))
            )
          ) {
            valid = false;
            err = "Invalif metalType";
          }
          break;
        case "originId":
          if (!(typeof v === "string" && possibleOrigin.includes(v))) {
            valid = false;
            err = "Invalif origin";
          }
          break;
        default:
          valid = false;
          err = "Invalif input";
      }
    } else {
      // Zatrzymanie walidacji po stwierdzeniu jednego bledu
      break;
    }
  }
  return { ifValid: valid, message: err };
}

function selectQueries(reqId) {
  // Stan kasy
  const cashStatusSql =
    'SELECT ROUND(IFNULL(SUM(tasks.expense), 0)-(SELECT IFNULL(SUM(tasks.expense), 0) FROM tasks WHERE origin_id = ? AND deleted_at IS NULL AND(task = "zakup" OR task = "wydatki")), 0) as cashStatus FROM tasks WHERE origin_id = ? AND deleted_at IS NULL AND task != "zakup" AND task != "wydatki"';
  const cashStatus = new Promise((resolve, reject) => {
    db.get(cashStatusSql, [reqId, reqId], (err, row) => {
      if (err === null) {
        row.originId = reqId;
        resolve(row);
      } else {
        reject(err);
      }
    });
  });

  // Wydatki z ostatnich 7 dni
  const expenseLast7DaysSql =
    'SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correct_date_format, ROUND(IFNULL(SUM(tasks.expense), 0), 0) as sumExpenseLast7Days FROM tasks WHERE origin_id = ? AND deleted_at IS NULL AND(task = "zakup" OR task = "wydatki") AND correct_date_format BETWEEN DATE("now", "-7 day") AND DATE("now")';
  const sumExpenseLast7Days = new Promise((resolve, reject) => {
    db.get(expenseLast7DaysSql, reqId, (err, row) => {
      if (err === null) {
        delete row.correct_date_format;
        row.originId = reqId;
        row.sumExpense === null ? (row.sumExpense = 0) : null;
        resolve(row);
      } else {
        reject(err);
      }
    });
  });

  // Ile jest metalu
  const metalInStockSql =
    'SELECT IFNULL(metal_type, "stalowy") as metalTypeName, ROUND(IFNULL(SUM(quantity), 0)-(SELECT IFNULL(SUM(quantity), 0) FROM tasks WHERE origin_id = ? AND task = "odbior" AND deleted_at IS NULL AND metal_type = "stalowy"), 0) as sumMetalIncome FROM tasks WHERE origin_id = ? AND task = "zakup" AND deleted_at IS NULL AND metal_type = "stalowy" UNION SELECT IFNULL(metal_type, "kolorowy") as metalTypeName, ROUND(IFNULL(SUM(quantity), 0)-(SELECT IFNULL(SUM(quantity), 0) FROM tasks WHERE origin_id = ? AND task = "odbior" AND deleted_at IS NULL AND metal_type = "kolorowy"), 0) as sumMetalIncome FROM tasks WHERE origin_id = ? AND task = "zakup" AND deleted_at IS NULL AND metal_type = "kolorowy"';
  const sumMetalInStock = new Promise((resolve, reject) => {
    db.all(metalInStockSql, [reqId, reqId, reqId, reqId], (err, rows) => {
      if (err === null) {
        const metalInStock = {
          metalInStock: rows,
          originId: reqId
        };
        resolve(metalInStock);
      } else {
        reject(err);
      }
    });
  });

  // Suma metalu zgrupowana dniami rozdzielona na rozdaj kolorowy i stalowy
  // Wartosc na minusie to odbior
  // Wiecej komentarzy w cashStatusGroupByDay, podobne dzialanie
  const metalInStockSqlGroupByDay =
    'SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correctDateFormat, tasks.action_date as actionDate, tasks.metal_type as metalTypeName, ROUND(SUM(tasks.quantity), 0) as sumMetalInStock FROM tasks WHERE tasks.origin_id = ? and tasks.task = "zakup" AND deleted_at IS NULL AND metal_type = "stalowy" GROUP BY action_date UNION SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correctDateFornat, tasks.action_date as actionDate, tasks.metal_type as metalTypeName, ROUND(SUM(tasks.quantity)*(-1), 0) as sumMetalInStock FROM tasks WHERE tasks.origin_id = ? and tasks.task = "odbior" AND deleted_at IS NULL AND metal_type = "stalowy" GROUP BY action_date UNION SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correctDateFormat, tasks.action_date as actionDate, tasks.metal_type as metalTypeName, ROUND(SUM(tasks.quantity), 0) as sumMetalInStock FROM tasks WHERE tasks.origin_id = ? and tasks.task = "zakup" AND deleted_at IS NULL AND metal_type = "kolorowy" GROUP BY action_date UNION SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correctDateFornat, tasks.action_date as actionDate, tasks.metal_type as metalTypeName, ROUND(SUM(tasks.quantity)*(-1), 0) as sumMetalInStock FROM tasks WHERE tasks.origin_id = ? and tasks.task = "odbior" AND deleted_at IS NULL AND metal_type = "kolorowy" GROUP BY action_date';
  const sumMetalInStockGroupByDay = new Promise((resolve, reject) => {
    db.all(
      metalInStockSqlGroupByDay,
      [reqId, reqId, reqId, reqId],
      (err, rows) => {
        if (err === null) {
          let prevRow = {};
          const metalInStockGroupByDay = {
            metalInStockGroupByDay: [],
            originId: reqId
          };
          for (let i = 0; i < rows.length; i++) {
            if (
              rows[i].actionDate === prevRow.actionDate &&
              rows[i].metalTypeName === prevRow.metalTypeName
            ) {
              prevRow.sumMetalInStock += rows[i].sumMetalInStock;
              metalInStockGroupByDay.metalInStockGroupByDay.pop();
              metalInStockGroupByDay.metalInStockGroupByDay.push(prevRow);
              prevRow = rows[i];
            } else {
              prevRow = rows[i];
              metalInStockGroupByDay.metalInStockGroupByDay.push(prevRow);
            }
          }
          resolve(metalInStockGroupByDay);
        } else {
          reject(err);
        }
      }
    );
  });

  // Suma wydatkow zgrupowana dniami
  const expensesSqlGroupByDay =
    'SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correctDateFormat, tasks.action_date as actionDate, ROUND(IFNULL(SUM(tasks.expense), 0), 0) as sumExpenses FROM tasks WHERE origin_id = ? AND deleted_at IS NULL AND(task = "zakup" OR task = "wydatki") GROUP BY action_date';
  const sumExpensesGroupByDay = new Promise((resolve, reject) => {
    db.all(expensesSqlGroupByDay, reqId, (err, rows) => {
      if (err === null) {
        const expensesGroupByDay = {
          expensesGroupByDay: rows,
          originId: reqId
        };
        resolve(expensesGroupByDay);
      } else {
        reject(err);
      }
    });
  });

  // Suma wplywow zgrupowana dniami
  const incomeSqlGroupByDay =
    'SELECT tasks.action_date as actionDate, ROUND(IFNULL(SUM(tasks.expense), 0), 0) as sumIncome FROM tasks WHERE origin_id = ? AND deleted_at IS NULL AND task = "wplywy" GROUP BY action_date';
  const sumIncomeGroupByDay = new Promise((resolve, reject) => {
    db.all(incomeSqlGroupByDay, reqId, (err, rows) => {
      if (err === null) {
        const sumIncomeGroupByDay = {
          sumIncomeGroupByDay: rows,
          originId: reqId
        };
        resolve(sumIncomeGroupByDay);
      } else {
        reject(err);
      }
    });
  });

  // Suma stanu kasy zgrupowa dniami
  const cashStatusSqlGroupByDay =
    'SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correctDateFormat, tasks.action_date as actionDate, ROUND(SUM(tasks.expense), 0) as cashStatus FROM tasks WHERE tasks.origin_id = ? AND (tasks.task != "zakup" AND tasks.task != "wydatki") AND deleted_at IS NULL GROUP BY action_date UNION SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) || "-" || substr(action_date, 1, 2) as correctDateFornat, tasks.action_date as actionDate, ROUND(SUM(tasks.expense)*(-1), 0) as cashStatus FROM tasks WHERE tasks.origin_id = ? AND (tasks.task = "zakup" OR tasks.task = "wydatki") AND deleted_at IS NULL GROUP BY action_date';
  // Zapytanie pobiera z bazy stan kasy zgrupowany dniami
  // Zapytanie nie jest idealny poniewaz zwraca, np. 21.07.2019, stan: 70 (przychod) i np. 21.07.2019, stan: -20 (wydatki, sa minusowe!), a nie juz gotowy stan kasy
  const sumCashStatusGroupByDay = new Promise((resolve, reject) => {
    db.all(cashStatusSqlGroupByDay, [reqId, reqId], (err, rows) => {
      if (err === null) {
        let prevRow = {}; // Przechowywanie porzedniego wiersza
        // Przechowywanie przetworzonych danych
        const sumCashStatusGroupByDay = {
          sumCashStatusGroupByDay: [],
          originId: reqId
        };
        // Operacje na elementach tablicy (rows - wynik zapytania)
        for (let i = 0; i < rows.length; i++) {
          // Szukanie pokrywajacych sie dni, czyli przychod lub wydatki i dodanie ich do siebie (wykozystanie, ze wydatki sa zwracane jak wartosc ujemna)
          if (rows[i].actionDate === prevRow.actionDate) {
            prevRow.cashStatus += rows[i].cashStatus; // Dodanie
            sumCashStatusGroupByDay.sumCashStatusGroupByDay.pop(); // Usuniecie pokrywajacej sie wartosci
            sumCashStatusGroupByDay.sumCashStatusGroupByDay.push(prevRow); // Zapisanie wlasciwej wartosci
            prevRow = rows[i];
          } else {
            prevRow = rows[i];
            sumCashStatusGroupByDay.sumCashStatusGroupByDay.push(prevRow);
          }
        }
        resolve(sumCashStatusGroupByDay);
      } else {
        reject(err);
      }
    });
  });
  // Suma z zaliczki zgrupowana dniami
  const advancePaymentSqlGroupByDay =
    'SELECT tasks.action_date as actionDate, ROUND(IFNULL(SUM(tasks.expense), 0), 0) as sumAdvancePayment FROM tasks WHERE origin_id = ? AND deleted_at IS NULL AND task = "zaliczka" GROUP BY action_date';
  const sumAdvancePaymentGroupByDay = new Promise((resolve, reject) => {
    db.all(advancePaymentSqlGroupByDay, reqId, (err, rows) => {
      if (err === null) {
        const sumAdvancePaymentGroupByDay = {
          sumAdvancePaymentGroupByDay: rows,
          originId: reqId
        };
        resolve(sumAdvancePaymentGroupByDay);
      } else {
        reject(err);
      }
    });
  });

  // Srednia
  const averageSqlGroupByDay =
    'SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) as correctDateFormat, substr(action_date, 4, 2) || "." || substr(action_date, 7,4) as actionDate, tasks.metal_type as metalTypeName, ROUND((SUM(tasks.expense)*1.0)/(SUM(tasks.quantity)*1.0), 1) as average FROM tasks WHERE tasks.origin_id = ? AND tasks.task = "zakup" AND metal_type = "stalowy" AND tasks.deleted_at IS NULL GROUP BY correctDateFormat UNION SELECT substr(action_date, 7,4) || "-" || substr(action_date, 4, 2) as correctDateFormat, substr(action_date, 4, 2) || "." || substr(action_date, 7,4) as actionDate, tasks.metal_type as metalTypeName,ROUND((SUM(tasks.expense)*1.0)/(SUM(tasks.quantity)*1.0), 1) as average FROM tasks WHERE tasks.origin_id = ? AND tasks.task = "zakup" AND metal_type = "kolorowy" AND tasks.deleted_at IS NULL GROUP BY correctDateFormat';
  const sumAverageGroupByDay = new Promise((resolve, reject) => {
    db.all(averageSqlGroupByDay, [reqId, reqId], (err, rows) => {
      if (err === null) {
        const sumAverageGroupByDay = {
          sumAverageGroupByDay: rows,
          originId: reqId
        };
        resolve(sumAverageGroupByDay);
      } else {
        reject(err);
      }
    });
  });

  // Sklejenie wszystkich zapytan do bazy w jeden obiekt
  return Promise.all([
    cashStatus,
    sumExpenseLast7Days,
    sumMetalInStock,
    sumExpensesGroupByDay,
    sumAdvancePaymentGroupByDay,
    sumMetalInStockGroupByDay,
    sumIncomeGroupByDay,
    sumCashStatusGroupByDay,
    sumAverageGroupByDay
  ])
    .then(value => {
      return Object.assign({}, ...value);
      // res.writeHead(200, { "Content-Type": "application/json" });
      // res.end(JSON.stringify(response));
    })
    .catch(err => {
      throw err;
      //sendError(res, err);
    });
}

// Zapytanie wyslajace cala liste tasks
app.get("/tasks", (req, res) => {
  const sql = "SELECT * FROM tasks ORDER BY id DESC";
  // Pobranie z bazy calej tabeli
  new Promise((resolve, reject) => {
    // Wykonanie operacji na tabeili
    db.all(sql, [], (err, rows) => {
      if (err === null) {
        resolve(dbTableToArray(rows));
      } else {
        reject(err);
      }
    });
  })
    .then(value => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    })
    .catch(err => {
      sendError(res, err);
    });
});

app.get("/workplaces/:id", (req, res) => {
  // Dodac walidacje :id!
  // Pobranie wartosci /:id
  const reqId = Number(req.params.id);
  selectQueries(reqId)
    .then(response => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));
    })
    .catch(err => {
      sendError(res, err);
    });
});

// app.get("/workplaces/", (req, res) => {
//   selectQueries(1)
//     .then(response => {
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify(response));
//     })
//     .catch(err => {
//       sendError(res, err);
//     });
// });

// Zapytanie dopisujace dane do bazy
// Dopisuje nowy rekord z dodaniem created_at
app.post("/tasks/:id", (req, res) => {
  new Promise((resolve, reject) => {
    const rb = req.body;
    rb.originId = req.params.id; // Dodanie originId (pochodzenia) do otrzymanego obiektu
    // Walidacja otrzymanych danych
    const validInfo = isValidInsert(rb);
    if (validInfo.ifValid) {
      const newInsertRow = [
        rb.actionDate,
        new Date().toString(),
        rb.task,
        rb.comment,
        rb.expense,
        rb.quantity,
        rb.metalType,
        rb.originId
      ];
      // W miejscu ?-ikow wpisywane sa elementy tablicy newInsertRow w funcki db.run
      const sql =
        "INSERT INTO tasks (action_date, created_at, task, comment, expense, quantity, metal_type, origin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      // Dodanie do bazy rekordu
      // Music tutaj byc function(err) {...}, a nie (err) => {...}, poniewaz w drugim przypadku this.lsatID jest undefined
      db.run(sql, newInsertRow, function(err) {
        // Zwrocenie id z ostatnio dodanego rekordu
        if (err === null) {
          resolve(this.lastID);
        } else {
          reject(err);
        }
      });
    } else {
      reject(validInfo);
    }
  })
    .then(lastRowId => {
      // Pobranie z bazy calej tabeli
      new Promise((resolve, reject) => {
        // W miejscu ? wpisywana jest wartosc lastRowId w funckji db.all
        const sql = "SELECT * FROM tasks WHERE id = ?";
        // Przepisanie tabeli do tablicy
        db.all(sql, lastRowId, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(dbTableToArray(rows));
          }
        });
      })
        .then(value => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(value));
        })
        .catch(err => {
          sendError(res, err);
        });
    })
    .catch(err => {
      sendError(res, err);
    });
});

// Zapytanie modyfikujace dane w bazie
// Dodaje deleted_at
app.delete("/tasks/:id", (req, res) => {
  new Promise((resolve, reject) => {
    // Odczytanie z zapytania /:id
    const reqId = req.params.id;
    const sql = "SELECT deleted_at FROM tasks WHERE id = ?";

    // Sprawdzenie czy nie dodano wczesniej deleted_at
    db.get(sql, reqId, (err, row) => {
      if (err) {
        reject(err);
      } else if (row.deleted_at === null) {
        const updatedRow = [new Date().toString(), reqId];

        // Dodanie deleted_at
        db.run(
          "UPDATE tasks SET deleted_at = ? WHERE id = ?",
          updatedRow,
          function(err) {
            // Zwrocenie id, wartosc jest juz znana. Poniewaz pole aktualizuje sie juz po id
            // W tym wypadku reqId === id rekordu zmodyfikowanego
            if (err === null) {
              resolve(reqId);
            } else {
              reject(err);
            }
          }
        );
      }
    });
  })
    .then(reqId => {
      const sql = "SELECT * FROM tasks WHERE id=?";

      // Pobranie z bazy zmodyfikowanego rekrodu
      new Promise((resolve, reject) => {
        // Przepisanie tabeli do tablicy
        db.get(sql, reqId, (err, row) => {
          if (err === null) {
            resolve(dbTableToArray([row]));
          } else {
            reject(err);
          }
        });
      }).then(tasks => {
        // Odeslanie zaktualizowanych danych
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tasks));
      });
    })
    .catch(err => {
      sendError(res, err);
    });
});

const server = app.listen(port, () =>
  console.log(`Backend server listening on port ${port}!`)
);

process.on("SIGINT", () => {
  db.close();
  server.close();
});
