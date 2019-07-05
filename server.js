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

// Zapytania
app.get("/tasks", (req, res) => {
  // Podlaczenie bazy
  let db = new sqlite3.Database("frontendDB.sqlite3", err => {
    if (err) {
      return console.error("err.message");
    }
  });

  const sql = "SELECT * FROM tasks ORDER BY id DESC";
  // Pobranie z bazy calej tabeli
  const retrunAllRows = new Promise(resolve => {
    const tasks = [];
    // Przepisanie tabeli do tablicy
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach(row => {
        tasks.push({
          id: row.id,
          actionDate: row.action_date,
          createdAt: row.created_at,
          deletedAt: row.deleted_at,
          task: row.task,
          comment: row.comment,
          expense: row.expense,
          quantity: row.quantity,
          metalType: row.metal_type
        });
      });
      resolve(tasks);
    });
  });

  // Close the database connection
  db.close(err => {
    if (err) {
      return console.error(err.message);
    }
  });

  retrunAllRows.then(value => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(value));
  });
});

app.post("/tasks", urlencodedParser, (req, res) => {
  const connection = new Promise(resolve => {
    // Podlaczenie sie do bazy
    let db = new sqlite3.Database("frontendDB.sqlite3", err => {
      if (err) {
        return console.error("err.message");
      }
    });

    // Dodac walidacje do req.body (dodatkowo zaokraglac do dwoch miejsc)!
    const rb = req.body;
    // Dodanie do bazy rekordu
    db.run(
      `INSERT INTO tasks (action_date, created_at, task, comment, expense, quantity, metal_type, origin) VALUES ('${
        rb.actionDate
      }', '${new Date()}', '${rb.task}', '${rb.comment}', '${rb.expense}', '${
        rb.quantity
      }', '${rb.metalType}', "Sklep 1")`
    );
    resolve(db);
  }).then(db => {
    const sql = "SELECT * FROM tasks ORDER BY id DESC";

    // Pobranie z bazy calej tabeli
    const returnAllRows = new Promise(resolve => {
      const tasks = [];
      // Przepisanie tabeli do tablicy
      db.all(sql, [], (err, rows) => {
        if (err) {
          throw err;
        }
        rows.forEach(row => {
          tasks.push({
            id: row.id,
            actionDate: row.action_date,
            createdAt: row.created_at,
            deletedAt: row.deleted_at,
            task: row.task,
            comment: row.comment,
            expense: row.expense,
            quantity: row.quantity,
            metalType: row.metal_type
          });
        });
        resolve(tasks);
      });
    }).then(tasks => {
      // Close the database connection
      db.close(err => {
        if (err) {
          return console.error(err.message);
        }
      });

      // Odeslanie zaktualizowanych danych
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tasks));
    });
  });
});

app.delete("/tasks/:id", urlencodedParser, (req, res) => {
  // Odczytanie z zapytania /:id
  const reqId = req.params.id;

  const connection = new Promise(resolve => {
    // Podlaczenie sie do bazy
    let db = new sqlite3.Database("frontendDB.sqlite3", err => {
      if (err) {
        return console.error("err.message");
      }
    });

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
    const returnAllRows = new Promise(resolve => {
      const tasks = [];
      // Przepisanie tabeli do tablicy
      db.all(sql, [], (err, rows) => {
        if (err) {
          throw err;
        }
        rows.forEach(row => {
          tasks.push({
            id: row.id,
            actionDate: row.action_date,
            createdAt: row.created_at,
            deletedAt: row.deleted_at,
            task: row.task,
            comment: row.comment,
            expense: row.expense,
            quantity: row.quantity,
            metalType: row.metal_type
          });
        });
        resolve(tasks);
      });
    }).then(tasks => {
      // Close the database connection
      db.close(err => {
        if (err) {
          return console.error(err.message);
        }
      });

      // Odeslanie zaktualizowanych danych
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tasks));
    });
  });
  console.log(reqId);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
