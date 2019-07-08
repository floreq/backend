const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;

function sendError(res, err) {
  console.error(err.message);
  console.trace();
  // Przeslanie informacji o bledzie
  res.status(500).end(err.message);
}

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
    return console.error("err.message");
  }
});

// Zapytania
app.get("/tasks", (req, res) => {
  const sql = "SELECT * FROM tasks ORDER BY id DESC";
  // Pobranie z bazy calej tabeli
  new Promise((resolve, reject) => {
    // Wykonanie operacji na tabeili
    db.all(sql, [], (err, rows) => {
      if (err === null) {
        // Przepisanie tabeli do tablicy
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
            metalType: row.metal_type
          };
        });
        resolve(tasks);
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
app.post("/tasks", (req, res) => {
  new Promise((resolve, reject) => {
    // Dodac walidacje do req.body (dodatkowo zaokraglac do dwoch miejsc)!
    const rb = req.body;
    const newInsertData = [
      rb.actionDate,
      new Date(),
      rb.task,
      rb.comment,
      rb.expense,
      rb.quantity,
      rb.metalType,
      "Sklep 1"
    ];
    // W miejscu ?-ikow wpisywane sa elementy tablicy newInsertData w funcki db.run
    const sql =
      "INSERT INTO tasks (action_date, created_at, task, comment, expense, quantity, metal_type, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    // Dodanie do bazy rekordu
    // Music tutaj byc function(err) {...}, a nie (err) => {...}, poniewaz w drugim przypadku this.lsatID jest undefined
    db.run(sql, newInsertData, function(err) {
      // Zwrocenie id z ostatnio dodanego rekordu
      if (err === null) {
        resolve(this.lastID);
      } else {
        reject(err);
      }
    });
  })
    .then(lastRowId => {
      // Pobranie z bazy calej tabeli
      new Promise(resolve => {
        // W miejscu ? wpisywana jest wartosc lastRowId w funckji db.all
        const sql = "SELECT * FROM tasks WHERE id = ?";
        // Przepisanie tabeli do tablicy
        db.all(sql, lastRowId, (err, rows) => {
          if (err) {
            reject(err);
          } else {
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
                metalType: row.metal_type
              };
            });
            resolve(tasks);
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

app.delete("/tasks/:id", (req, res) => {
  // Odczytanie z zapytania /:id
  const reqId = req.params.id;

  new Promise(resolve => {
    const sql = `SELECT deleted_at FROM tasks WHERE id = '${reqId}'`;

    // Sprawdzenie czy nie dodano wczesniej deleted_at
    db.get(sql, [], (err, row) => {
      if (err) {
        return console.error(err.message);
      } else if (row.deleted_at === null) {
        // Dodanie deleted_at
        db.run(
          `UPDATE tasks SET deleted_at = '${new Date()}' WHERE id = '${reqId}'`
        );
        resolve(db);
      } else {
        resolve(db);
      }
    });
  }).then(db => {
    const sql = "SELECT * FROM tasks ORDER BY id DESC";

    // Pobranie z bazy calej tabeli
    new Promise(resolve => {
      // Przepisanie tabeli do tablicy
      db.all(sql, [], (err, rows) => {
        if (err) {
          throw err;
        }
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
            metalType: row.metal_type
          };
        });
        resolve(tasks);
      });
    }).then(tasks => {
      // Odeslanie zaktualizowanych danych
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tasks));
    });
  });
  console.log(reqId);
});

const server = app.listen(port, () =>
  console.log(`Backend server listening on port ${port}!`)
);

process.on("SIGINT", () => {
  db.close();
  server.close();
});
