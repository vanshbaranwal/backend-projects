import express from "express";


const app = express();

const port = 8000;


app.get("/", (req, res) => {
    return res.json({ message: "hello from server" })
});


app.listen(port, () => {
    console.log("server is runnning on port : ", port);
});