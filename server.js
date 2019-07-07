const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;

const sampleAllTasks = [
  {
    id: 1,
    actionDate: "01.01.1000",
    createdAt: "",
    deletedAt: "",
    task: "zakup",
    comment: "",
    expense: 0,
    quantity: 0,
    metalType: "stalowy"
  },
  {
    id: 2,
    actionDate: "01.01.1000",
    createdAt: "[data dodana przez zapytanie POST]",
    deletedAt: "",
    task: "zakup",
    comment: "",
    expense: 0,
    quantity: 0,
    metalType: "stalowy"
  }
];

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
    // Przepisanie tabeli do tablicy
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject();
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
    .catch(() => {
      res.status(400);
      res.send();
    });
});

app.post("/tasks", (req, res) => {
  new Promise(resolve => {
    // Dodac walidacje do req.body (dodatkowo zaokraglac do dwoch miejsc)!
    const rb = req.body;
    const createdAt = new Date();
    const sql = `INSERT INTO tasks (action_date, created_at, task, comment, expense, quantity, metal_type, origin) VALUES ('${
      rb.actionDate
    }', '${createdAt}', '${rb.task}', '${rb.comment}', '${rb.expense}', '${
      rb.quantity
    }', '${rb.metalType}', "Sklep 1")`;
    // Dodanie do bazy rekordu
    db.run(sql, function(err) {
      // Zwrocenie id z ostatnio dodanego rekordu
      if (err === null) {
        resolve(this.lastID);
      } else {
        console.log("Error");
      }
    });
  }).then(lastRowId => {
    const sql = `SELECT * FROM tasks WHERE id = '${lastRowId}'`;

    // Pobranie z bazy calej tabeli
    new Promise(resolve => {
      // Przepisanie tabeli do tablicy
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject();
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
      .catch(() => {
        res.status(400);
        res.send();
      });
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
