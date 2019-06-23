// Tworzenie bazy danych
const sqlite3 = require("sqlite3");
filename = "frontendDB.sqlite3";
new sqlite3.Database(filename);
