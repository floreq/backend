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
app.use(bodyParser());

// Zapytania
app.get("/tasks", (req, res) => {
  const tasks = [];

  // Podlaczenie bazy
  let db = new sqlite3.Database("frontendDB.sqlite3", err => {
    if (err) {
      return console.error("err.message");
    }
  });

  const sql = "SELECT * FROM tasks ORDER BY id DESC";

  const retrunAllRows = new Promise((resolve, reject) => {
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
  // Dodac walidacje
  // Dodac w obiekcie created_at
  console.log(req.body);

  // Tutaj powinien po odebraniu zapytania odsylac juz poprawnie zapisanego jsona (z dodanym polem id, itp.)
  const tasks = [];

  // Podlaczenie bazy
  let db = new sqlite3.Database("frontendDB.sqlite3", err => {
    if (err) {
      return console.error("err.message");
    }
  });

  const rb = req.body;
  const createdAt = new Date();

  db.run(
    `INSERT INTO tasks (action_date, created_at, task, comment, expense, quantity, metal_type, origin) VALUES ('${
      rb.actionDate
    }', '${createdAt}', '${rb.task}', '${rb.comment}', '${rb.expense}', '${
      rb.quantity
    }', '${rb.metalType}', "Sklep 1")`
  );

  const sql = "SELECT * FROM tasks ORDER BY id DESC";

  const retrunAllRows = new Promise((resolve, reject) => {
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
