import express from "express";
import axios from "axios";
import { Redis } from "ioredis";
import http from "http";
import { Server } from "socket.io";


const app = express(); // express server

const state = new Array(100).fill(false);

const httpServer = http.createServer(app); // http server (mounting http server on the express server)
const io = new Server() // socket server

io.attach(httpServer);

io.on("connection", (socket) => {
    console.log("socket connected", socket.id);
    socket.on("message", (msg) => {
        io.emit("server-message", msg); // broadcast to all the connected clients
    });

    socket.on("checkbox-update", (data) => {
        state[data.index] = data.value
        io.emit("checkbox-update", data);
    });
});

const port = process.env.PORT || 8000;


const redis = new Redis({ host: "localhost", port: Number(6379) });

app.use(express.static("./public"));


// basic rate limit middleware
app.use(async function(req, res, next) {
    const key = "rate-limit"; // and for rate limit per user we do `rate-limit:${ _id }`
    const value = await redis.get(key);

    if(value === null){
        await redis.set(key, 0);
        await redis.expire(key, 60); // 60seconds it is
    }

    if(Number(value) > 100){ // up to 100 requests in a minute
        return res.status(429).json({ message: "too many requests" });
    }

    redis.incr(key);
    next();
});


app.get("/state", (req, res) => {
    return res.json({ state });
});


app.get("/", (req, res) => {
    return res.json({
        status: "success"
    });
});

app.get("/books", async (req, res) => {
    const response = await axios.get("https://api.freeapi.app/api/v1/public/books");
    return res.json(response.data);
});

let count = 0;
app.get("/books/total", async (req, res) => {

    // checking cache
    const cachedValue = await redis.get("totalPageValue");
    if(cachedValue){
        count+=1;
        console.log(`cache hit ${count}`);
        return res.json({ totalPageCount: Number(cachedValue) });
    }

    const response = await axios.get("https://api.freeapi.app/api/v1/public/books");

    const totalPageCount = response?.data?.data?.data?.reduce((acc: number, curr: { volumeInfo?: { pageCount?: number } }) => !curr.volumeInfo?.pageCount ? 0 : curr.volumeInfo?.pageCount + acc, 0);


    // setting the cache
    await redis.set("totalPageValue", totalPageCount);

    console.log("cache miss");
    return res.json({ totalPageCount });
});

httpServer.listen(port, () => console.log("http server is running on port: ", port));
