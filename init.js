// // Tworzenie bazy danych
// const sqlite3 = require("sqlite3");
// filename = "frontendDB.sqlite3";
// new sqlite3.Database(filename);

// Wpisanie do bazy danych
const sqlite3 = require("sqlite3");
let db = new sqlite3.Database("frontendDB.sqlite3");
const createdAt = new Date();
db.run(
  `INSERT INTO tasks (action_date, created_at, task, comment, expense, quantity, metal_type, origin) VALUES ("01.07.2018", "${createdAt}", "odbior", "", 1129, 300, "kolorowy", "Sklep 1")`
);

db.close();
