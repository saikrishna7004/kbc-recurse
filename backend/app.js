const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let currentQuestion = {
    text: "",
    options: ["", "", "", ""],
};
let timerValue = 30;
let currentTimerValue = null;
let timerStartTime = null;
let timerPaused = true;
let timerPausedAt = null;
let timerMaxValue = 30;
let timerStarted = false;
let highlightedOption = { index: null, type: null };
let correctAnswer = null;
let currentScreen = "logo";
let questionNumber = 1;

let lifelines = {
    "50-50": false,
    "Audience Poll": false,
    "Phone a friend": false
};

let fiftyFiftyOptionsToHide = [];
let activeLifeline = null;

app.get("/", (req, res) => {
    res.send("Server is running");
});

io.on("connection", (socket) => {
    if (currentQuestion) {
        socket.emit("display-question", currentQuestion);
        if (currentQuestion.showOptions) {
            socket.emit("show-options");
            updateTimerForClient(socket, false);
        }

        if (highlightedOption.index !== null) {
            if (highlightedOption.type === "selected") {
                socket.emit("highlight-answer", highlightedOption.index);
            } else if (highlightedOption.type === "correct") {
                socket.emit("mark-correct", highlightedOption.index);
            } else if (highlightedOption.type === "wrong") {
                socket.emit("mark-wrong", highlightedOption.index);
            }
        }
        
        if (correctAnswer !== null && highlightedOption.index !== null && highlightedOption.index !== correctAnswer) {
            socket.emit("show-correct-answer", {
                selectedIndex: highlightedOption.index,
                correctIndex: correctAnswer
            });
        }
    }

    socket.emit("change-screen", currentScreen);
    socket.emit("update-question-number", { questionNumber });

    socket.emit("timer-state", {
        state: timerStarted ? (timerPaused ? "paused" : "running") : "stopped"
    });

    socket.emit("update-lifelines", lifelines);
    
    if (activeLifeline) {
        socket.emit("set-active-lifeline", activeLifeline);
    }
    
    if (fiftyFiftyOptionsToHide.length > 0) {
        socket.emit("apply-5050", fiftyFiftyOptionsToHide);
    }

    socket.on("question-update", (data) => {
        if (!data.text || !data.text.trim() ||
            !data.options || data.options.some(opt => !opt || !opt.trim())) {
            return;
        }

        timerMaxValue = timerValue;
        currentTimerValue = timerValue;
        
        highlightedOption = { index: null, type: null };
        correctAnswer = null;
        timerPaused = true;
        timerPausedAt = null;
        timerStartTime = null;
        timerStarted = false;
        
        currentQuestion = {
            ...data,
            timer: timerValue,
            maxTimer: timerMaxValue,
            showOptions: false
        };

        io.emit("display-question", currentQuestion);
        io.emit("reset-highlights");
        io.emit("timer-state", { state: "stopped" });
        io.emit("change-screen", "question");
        io.emit("update-question-number", { questionNumber });
        
        fiftyFiftyOptionsToHide = [];
        io.emit("apply-5050", []);
        
        activeLifeline = null;
        io.emit("set-active-lifeline", null);
    });

    socket.on("increment-question", () => {
        if (questionNumber < 11) {
            questionNumber++;
            io.emit("update-question-number", { questionNumber });
        }
    });

    socket.on("decrement-question", () => {
        if (questionNumber > 1) {
            questionNumber--;
            io.emit("update-question-number", { questionNumber });
        }
    });

    socket.on("set-prize-tier", (tier) => {
        if (tier >= 1 && tier <= 11) {
            io.emit("update-question-number", { questionNumber });
        }
    });

    socket.on("reset-question-number", () => {
        questionNumber = 1;
        io.emit("update-question-number", { questionNumber });
    });

    socket.on("show-options", () => {
        if (!currentQuestion || timerStarted) return;

        currentQuestion.showOptions = true;
        timerPaused = false;
        timerStartTime = Date.now();
        currentTimerValue = timerValue;
        timerStarted = true;

        io.emit("show-options");
        io.emit("update-timer", {
            current: currentTimerValue,
            max: timerMaxValue,
            audioTrigger: true,
            startPosition: 59 - timerValue
        });
        io.emit("timer-state", { state: "running" });

        updateTimerForAllClients(true, 59 - timerValue);
    });

    socket.on("pick-answer", (index) => {
        if (currentQuestion && index >= 0 && index < currentQuestion.options.length) {
            if (!fiftyFiftyOptionsToHide.includes(index)) {
                highlightedOption = { index, type: "selected" };
                correctAnswer = null;
                
                io.emit("reset-highlights");
                io.emit("highlight-answer", index);
                io.emit("trigger-audio", "lock");
                pauseTimer(false);
            }
        }
    });

    socket.on("mark-correct", (index) => {
        if (currentQuestion && index >= 0 && index < currentQuestion.options.length) {
            if (!fiftyFiftyOptionsToHide.includes(index)) {
                correctAnswer = index;
                
                if (highlightedOption.index !== null && highlightedOption.type === "selected") {
                    if (highlightedOption.index === index) {
                        highlightedOption = { index, type: "correct" };
                        io.emit("reset-highlights");
                        io.emit("mark-correct", index);
                        io.emit("trigger-audio", "correct");
                    } else {
                        io.emit("reset-highlights");
                        io.emit("show-correct-answer", {
                            selectedIndex: highlightedOption.index,
                            correctIndex: index
                        });
                        io.emit("trigger-audio", "wrong");
                    }
                } else {
                    highlightedOption = { index, type: "correct" };
                    io.emit("reset-highlights");
                    io.emit("mark-correct", index);
                    io.emit("trigger-audio", "correct");
                }
            }
        }
    });

    socket.on("mark-wrong", (index) => {
        if (currentQuestion && index >= 0 && index < currentQuestion.options.length) {
            if (!fiftyFiftyOptionsToHide.includes(index) && correctAnswer === null) {
                highlightedOption = { index, type: "wrong" };
                io.emit("reset-highlights");
                io.emit("mark-wrong", index);
                io.emit("trigger-audio", "wrong");
            }
        }
    });

    socket.on("reset-timer", () => {
        if (timerStarted) return;

        currentTimerValue = timerValue;
        io.emit("update-timer", {
            current: currentTimerValue,
            max: timerMaxValue,
            audioTrigger: false
        });
        
        updateTimerForAllClients(false);
    });

    socket.on("change-timer", (value) => {
        if (timerStarted) return;

        timerValue = value;
        timerMaxValue = value;
        currentTimerValue = value;
        io.emit("update-timer", {
            current: currentTimerValue,
            max: timerMaxValue,
            audioTrigger: false
        });
        io.emit("timer-state", { state: timerStarted ? (timerPaused ? "paused" : "running") : "stopped" });
        updateTimerForAllClients(false);
    });

    socket.on("freeze-timer", () => {
        pauseTimer(false);
    });

    socket.on("use-lifeline", (lifeline) => {
        if (lifelines[lifeline] === false) {
            activeLifeline = lifeline;
            io.emit("set-active-lifeline", lifeline);
            
            currentScreen = "lifeline";
            io.emit("change-screen", "lifeline");
            io.emit("show-specific-lifeline", lifeline);
            
            if (lifeline === "50-50") {
                io.emit("prepare-fifty-fifty", Array.from(Array(4).keys()));
            } else {
                lifelines[lifeline] = true;
                io.emit("update-lifelines", lifelines);
                io.emit("trigger-audio", "lifeline");
            }
        }
    });
    
    socket.on("select-fifty-fifty-options", (optionsToHide) => {
        if (optionsToHide.length === 2 && activeLifeline === "50-50") {
            fiftyFiftyOptionsToHide = optionsToHide;
            lifelines["50-50"] = true;
            
            io.emit("update-lifelines", lifelines);
            io.emit("apply-5050", fiftyFiftyOptionsToHide);
            io.emit("trigger-audio", "lifeline");
            
            currentScreen = "question";
            io.emit("change-screen", "question");
            
            activeLifeline = null;
            io.emit("set-active-lifeline", null);
        }
    });
    
    socket.on("cancel-lifeline", () => {
        activeLifeline = null;
        io.emit("set-active-lifeline", null);
        
        if (currentScreen === "lifeline") {
            currentScreen = "question";
            io.emit("change-screen", "question");
        }
    });
    
    socket.on("reset-lifelines", () => {
        lifelines = {
            "50-50": false,
            "Audience Poll": false,
            "Phone a friend": false
        };
        fiftyFiftyOptionsToHide = [];
        activeLifeline = null;
        io.emit("update-lifelines", lifelines);
        io.emit("apply-5050", []);
        io.emit("set-active-lifeline", null);
    });

    socket.on("remove-question", () => {
        currentQuestion = {
            text: "",
            options: ["", "", "", ""],
        };
        timerPaused = true;
        timerStartTime = null;
        timerPausedAt = null;
        timerStarted = false;
        highlightedOption = { index: null, type: null };
        correctAnswer = null;
        io.emit("clear-question");
        io.emit("reset-highlights");
        io.emit("timer-state", { state: "stopped" });
        fiftyFiftyOptionsToHide = [];
        activeLifeline = null;
        io.emit("apply-5050", []);
        io.emit("set-active-lifeline", null);
        io.emit("change-screen", "logo");
        io.emit("update-question-number", { questionNumber });
    });

    socket.on("play-audio", (type) => {
        io.emit("trigger-audio", type);
    });

    socket.on("get-timer", () => {
        updateTimerForClient(socket, false);
        socket.emit("timer-state", {
            state: timerStarted ? (timerPaused ? "paused" : "running") : "stopped"
        });
    });

    socket.on("pause-timer", () => {
        if (!timerStarted || timerPaused) return;
        pauseTimer(true);
    });

    socket.on("continue-timer", () => {
        if (!timerStarted || !timerPaused) return;

        if (timerPausedAt !== null) {
            timerStartTime = Date.now() - (timerPausedAt - (timerStartTime || 0));
            timerPaused = false;
            timerPausedAt = null;

            const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
            const remainingTime = Math.max(0, timerValue - elapsedSeconds);
            const audioOffset = 59 - remainingTime;

            io.emit("unfreeze-timer", true, audioOffset);
            updateTimerForAllClients(true, audioOffset);
            io.emit("timer-state", { state: "running" });
        }
    });

    socket.on("set-screen", (screen) => {
        currentScreen = screen;
        io.emit("change-screen", screen);
        
        if (activeLifeline && screen !== "lifeline") {
            activeLifeline = null;
            io.emit("set-active-lifeline", null);
        }
    });
});

function pauseTimer(triggerAudio = false) {
    if (!timerPaused && timerStarted) {
        timerPausedAt = Date.now();
        timerPaused = true;
        if (timerStartTime) {
            currentTimerValue = Math.max(0, timerValue - Math.floor((timerPausedAt - timerStartTime) / 1000));
        }
        io.emit("freeze-timer", triggerAudio);
        io.emit("timer-state", { state: "paused" });
        updateTimerForAllClients(false);
    }
}

function updateTimerForClient(socket, triggerAudio = false, audioOffset = 0) {
    if (currentTimerValue === "unlimited") {
        socket.emit("update-timer", {
            current: "unlimited",
            max: "unlimited",
            audioTrigger: triggerAudio
        });
        socket.emit("current-timer", {
            current: "unlimited",
            max: "unlimited"
        });
        return;
    }

    if (timerPaused) {
        socket.emit("update-timer", {
            current: currentTimerValue,
            max: timerMaxValue,
            audioTrigger: triggerAudio,
            startPosition: audioOffset
        });
        socket.emit("current-timer", {
            current: currentTimerValue,
            max: timerMaxValue
        });
        socket.emit("freeze-timer", false);
    }
    else if (currentTimerValue === null) {
        socket.emit("update-timer", {
            current: timerValue,
            max: timerMaxValue,
            audioTrigger: triggerAudio,
            startPosition: audioOffset
        });
        socket.emit("current-timer", {
            current: timerValue,
            max: timerMaxValue
        });
        socket.emit("freeze-timer", false);
    }
    else if (timerStartTime) {
        const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
        const remainingTime = Math.max(0, timerValue - elapsedSeconds);
        socket.emit("update-timer", {
            current: remainingTime,
            max: timerMaxValue,
            audioTrigger: triggerAudio,
            startPosition: audioOffset || (59 - remainingTime)
        });
        socket.emit("current-timer", {
            current: remainingTime,
            max: timerMaxValue
        });
        socket.emit("unfreeze-timer", false);
    }
}

function updateTimerForAllClients(triggerAudio = false, audioOffset = 0) {
    const now = Date.now();
    lastBroadcastTime = now;

    io.sockets.sockets.forEach(socket => {
        updateTimerForClient(socket, triggerAudio, audioOffset);
    });
}

module.exports = server;
