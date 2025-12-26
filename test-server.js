const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Server is alive!");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Test server listening at http://0.0.0.0:${port}`);
});
