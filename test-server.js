import express from "express";

const app = express();

app.get("/", (req, res) => {
    res.send("TEST SERVER IS WORKING!");
});

app.listen(3001, () => {
    console.log("TEST SERVER RUNNING ON PORT 3001");
});