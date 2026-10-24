import express from "express";

const app = express();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
    return res.json({
        status: "success"
    });
});

app.listen(port, () => {
    console.log("server is running on port: ", port);
});
