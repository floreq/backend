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

// Podlaczenie bazy
let db = new sqlite3.Database("frontendDB.sqlite3", err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the in-memory SQlite database.");
});

const sql = "SELECT * FROM tasks ORDER BY id DESC";
const tasks = [];

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
});

// close the database connection
db.close(err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Close the database connection.");
});

const tasks1 = [
  {
    id: 1,
    actionDate: "21.06.2019",
    createdAt: "",
    deletedAt: "",
    task: "zakup",
    comment: "",
    expense: "2251",
    quantity: "151",
    metalType: "stalowy",
    origin: "Sklep 1"
  },
  {
    id: 2,
    actionDate: "21.06.2019",
    createdAt: "",
    deletedAt: "",
    task: "odbior",
    comment: "",
    expense: "1201",
    quantity: "51",
    metalType: "stalowy",
    origin: "Sklep 1"
  },
  {
    id: 3,
    actionDate: "21.06.2019",
    createdAt: "",
    deletedAt: "",
    task: "odbior",
    comment: "",
    expense: "3000",
    quantity: "3000",
    metalType: "stalowy",
    origin: "Sklep 1"
  }
];

// Zapytania
app.get("/tasks", (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(tasks));
});

app.post("/tasks", urlencodedParser, (req, res) => {
  // Dodac walidacje
  // Dodac w obiekcie created_at
  console.log(req.body);

  // Tutaj powinien po odebraniu zapytania odsylac juz poprawnie zapisanego jsona (z dodanym polem id, itp.)
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(tasks1));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
