const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;

const db = new sqlite3.Database("frontendDB.sqlite3");

// Whitelist adresow
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(bodyParser());

app.get("/api/tasks", (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  const tasks = [
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
      actionDate: "22.06.2019",
      createdAt: "",
      deletedAt: "",
      task: "odbior",
      comment: "",
      expense: "1201",
      quantity: "51",
      metalType: "stalowy",
      origin: "Sklep 1"
    }
  ];
  res.end(JSON.stringify(tasks));
});

// app.post("/api/tasks", (req, res) => {
//   res.writeHead(200, { "Content-Type": "application/json" });
//   // Walidacja potrzebna
//   console.log(req.body);

//   db.run(`INSERT INTO a (b) VALUES ("${req.body.hello}")`);

//   const x = { id: 1, name: "abc" };
//   res.end(JSON.stringify(x));
// });

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// test
