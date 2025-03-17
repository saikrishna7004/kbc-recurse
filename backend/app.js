const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let currentQuestion = null;
let timerValue = 30;

io.on("connection", (socket) => {
    socket.emit("display-question", currentQuestion);

    socket.on("question-update", (data) => {
        currentQuestion = { ...data, correctIndex: null, wrongIndex: null, selected: null };
        io.emit("display-question", currentQuestion);
    });

    socket.on("pick-answer", (index) => {
        if (currentQuestion) {
            currentQuestion.selected = index;
            io.emit("highlight-answer", index);
            io.emit("trigger-audio", "lock");
            io.emit("freeze-timer");
        }
    });

    socket.on("mark-correct", (index) => {
        if (currentQuestion) {
            currentQuestion.correctIndex = index;
            io.emit("mark-correct", index);
            io.emit("trigger-audio", "correct");
        }
    });

    socket.on("mark-wrong", (index) => {
        if (currentQuestion) {
            currentQuestion.wrongIndex = index;
            io.emit("mark-wrong", index);
            io.emit("trigger-audio", "wrong");
        }
    });

    socket.on("reset-timer", () => {
        io.emit("update-timer", timerValue);
        io.emit("trigger-audio", "timer", timerValue);
    });

    socket.on("change-timer", (value) => {
        timerValue = value;
        io.emit("update-timer", timerValue);
    });

    socket.on("freeze-timer", () => {
        io.emit("freeze-timer");
    })

    socket.on("remove-question", () => {
        currentQuestion = null;
        io.emit("clear-question");
    });

    socket.on("play-audio", (type) => {
        io.emit("trigger-audio", type);
    });
});

module.exports = server;
