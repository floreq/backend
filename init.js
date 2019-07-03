// // Tworzenie bazy danych
// const sqlite3 = require("sqlite3");
// filename = "frontendDB.sqlite3";
// new sqlite3.Database(filename);

// // Wpisanie do bazy danych
// const sqlite3 = require("sqlite3");
// let db = new sqlite3.Database("frontendDB.sqlite3");
// const createdAt = new Date();
// db.run(
//   `INSERT INTO tasks (action_date, created_at, task, comment, expense, quantity, metal_type, origin) VALUES ("01.07.2018", "${createdAt}", "odbior", "", 1129, 300, "kolorowy", "Sklep 1")`
// );

// db.close();

// const mojTest = new Promise((resolve, reject) => {
//   const sqlite3 = require("sqlite3");

//   // Podlaczenie bazy
//   let db = new sqlite3.Database("frontendDB.sqlite3", err => {
//     if (err) {
//       return console.error("err.message");
//     }
//   });

//   const sql = "SELECT * FROM tasks ORDER BY id DESC";
//   let tasks = [];

// const retrunAllRows = new Promise((resolve, reject) => {
//   db.all(sql, [], (err, rows) => {
//     if (err) {
//       throw err;
//     }
//     rows.forEach(row => {
//       tasks.push({
//         id: row.id,
//         actionDate: row.action_date,
//         createdAt: row.created_at,
//         deletedAt: row.deleted_at,
//         task: row.task,
//         comment: row.comment,
//         expense: row.expense,
//         quantity: row.quantity,
//         metalType: row.metal_type
//       });
//     });
//     resolve(tasks);
//   });
// });

//   // Close the database connection
//   db.close(err => {
//     if (err) {
//       return console.error(err.message);
//     }
//   });

//   retrunAllRows.then(value => {
//     return tasks.concat(value);
//   });

//   resolve(() => {
//     retrunAllRows.then(value => {
//       return tasks.concat(value);
//     });
//   });
// });

// mojTest.then(value => {
//   console.log(value);
// });

// const retunrAllRows = new Promise((resolve, reject) => {
//   const sqlite3 = require("sqlite3");
//   resolve("Success!");
// });

// retunrAllRows.then(value => {
//   console.log(value);
// });

// var promise1 = new Promise(function(resolve, reject) {
//   resolve('Success!');
// });

// promise1.then(function(value) {
//   console.log(value);
//   // expected output: "Success!"
// });

// function Manager() {
//   this.db = null;
//   // Allow a callback function to be passed to getAll
//   this.getAll = function(callback) {
//     this.db.all(queryGetAll, function(err, rows) {
//       if (err) {
//         // call your callback with the error
//         callback(err);
//         return;
//       }
//       // call your callback with the data
//       callback(null, rows);
//       return;
//     });
//   };
// }

// function test() {
//   const sqlite3 = require("sqlite3");

//   // Podlaczenie bazy
//   let db = new sqlite3.Database("frontendDB.sqlite3", err => {
//     if (err) {
//       return console.error("err.message");
//     }
//   });

//   const sql = "SELECT * FROM tasks ORDER BY id DESC";
//   let tasks = [];

//   const retrunAllRows = new Promise((resolve, reject) => {
//     db.all(sql, [], (err, rows) => {
//       if (err) {
//         throw err;
//       }
//       rows.forEach(row => {
//         tasks.push({
//           id: row.id,
//           actionDate: row.action_date,
//           createdAt: row.created_at,
//           deletedAt: row.deleted_at,
//           task: row.task,
//           comment: row.comment,
//           expense: row.expense,
//           quantity: row.quantity,
//           metalType: row.metal_type
//         });
//       });
//       resolve(tasks);
//     });
//   });

//   // Close the database connection
//   db.close(err => {
//     if (err) {
//       return console.error(err.message);
//     }
//   });

//   return abc => {
//     retrunAllRows.then(value => {
//       abc = tasks.concat(value);
//     });
//   };
// }

// console.log(test().abc);
