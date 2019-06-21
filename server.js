const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;

// Whitelist adresow
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.get("/api/tasks", cors(corsOptions), (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  const x = { id: 1, name: "test" };
  res.end(JSON.stringify(x));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
