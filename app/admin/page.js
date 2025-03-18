"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function AdminPage() {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const [currentTimer, setCurrentTimer] = useState({ current: null, max: null });
    const [timerState, setTimerState] = useState("stopped");
    const [error, setError] = useState("");
    const [currentScreen, setCurrentScreen] = useState("logo");

    const audios = {
        correct: "Correct",
        wrong: "Wrong",
        timer: "Timer",
        intro: "Intro",
        end: "End",
        lock: "Lock",
        next: "Next",
        suspense1: "Suspense 1",
        suspense2: "Suspense 2",
        suspense3: "Suspense 3",
        suspense4: "Suspense 4",
        stop: "Stop",
    };
    
    const screens = [
        { id: "logo", name: "Logo" },
        { id: "question", name: "Question" },
        { id: "lifeline", name: "Lifelines" },
        { id: "prize", name: "Prize Money" },
        { id: "blank", name: "Blank Screen" }
    ];

    useEffect(() => {
        socket.on("current-timer", (data) => {
            setCurrentTimer(data);
        });

        socket.on("freeze-timer", () => {
            setTimerState("paused");
        });

        socket.on("unfreeze-timer", () => {
            setTimerState("running");
        });

        socket.on("clear-question", () => {
            setTimerState("stopped");
        });

        socket.on("show-options", () => {
            setTimerState("running");
        });

        socket.on("timer-state", (data) => {
            setTimerState(data.state);
        });
        
        socket.on("change-screen", (screen) => {
            setCurrentScreen(screen);
        });

        const timerUpdateInterval = setInterval(() => {
            if (timerState === "running") {
                socket.emit("get-timer");
            }
        }, 1000);

        return () => {
            socket.off("current-timer");
            socket.off("freeze-timer");
            socket.off("unfreeze-timer");
            socket.off("clear-question");
            socket.off("show-options");
            socket.off("timer-state");
            socket.off("change-screen");
            clearInterval(timerUpdateInterval);
        };
    }, [timerState]);

    useEffect(() => {
        socket.emit("get-timer");
    }, []);

    const handleGetTimer = () => {
        socket.emit("get-timer");
    };

    const validateQuestion = () => {
        if (!question.trim()) {
            setError("Please enter a question");
            return false;
        }

        const emptyOptions = options.filter(option => !option.trim()).length;
        if (emptyOptions > 0) {
            setError("Please fill all options");
            return false;
        }

        setError("");
        return true;
    };

    const handleSendQuestion = () => {
        if (validateQuestion()) {
            socket.emit("question-update", { text: question, options });
            setError("");
        }
    };

    const handleShowOptions = () => {
        if (validateQuestion()) {
            socket.emit("show-options");
            setError("");
        }
    };

    const handlePauseTimer = () => {
        socket.emit("pause-timer");
    };

    const handleContinueTimer = () => {
        socket.emit("continue-timer");
    };

    const handleScreenChange = (screenId) => {
        socket.emit("set-screen", screenId);
    };

    const formatTimer = () => {
        if (currentTimer.current === "unlimited") return "Unlimited";
        if (currentTimer.current === null) return "Not set";
        return `${currentTimer.current}/${currentTimer.max}`;
    };

    const isTimerChangeable = timerState === "stopped";

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="w-full max-w-5xl bg-gray-900 px-6 py-4 rounded-lg shadow-lg text-center border-4 border-yellow-500">
                <h1 className="text-2xl font-bold text-yellow-500 mb-4">Admin Panel</h1>

                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-3">Screen Control</h2>
                    <div className="flex flex-wrap gap-2">
                        {screens.map(screen => (
                            <button 
                                key={screen.id}
                                className={`p-2 cursor-pointer ${currentScreen === screen.id ? 'bg-blue-600' : 'bg-blue-800'} hover:bg-blue-700 transition-all`}
                                onClick={() => handleScreenChange(screen.id)}
                            >
                                {screen.name}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-600 text-white p-2 rounded mb-4">
                        {error}
                    </div>
                )}

                <input
                    className="w-full p-3 mb-4 text-lg bg-gray-800"
                    placeholder="Enter question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                    {options.map((opt, index) => (
                        <input
                            key={index}
                            className="w-full p-2 mb-2 text-lg bg-gray-800"
                            placeholder={`Option ${index + 1}`}
                            value={opt}
                            onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[index] = e.target.value;
                                setOptions(newOptions);
                            }}
                        />
                    ))}
                </div>

                {isTimerChangeable && (
                    <div className="flex gap-2 my-2">
                        {["30", "45", "60", "unlimited"].map((t) => (
                            <button
                                key={t}
                                className="p-2 bg-purple-500 rounded hover:bg-purple-600 active:scale-95 transition-all cursor-pointer"
                                onClick={() => {
                                    socket.emit("change-timer", t);
                                    handleGetTimer();
                                }}
                            >
                                {t}s
                            </button>
                        ))}
                        <input
                            type="number"
                            value={timer}
                            className="p-2 bg-gray-700 text-white"
                            onChange={(e) => { setTimer(e.target.value); }}
                        />
                        <button
                            className="p-2 bg-purple-500 rounded hover:bg-purple-600 active:scale-95 transition-all cursor-pointer"
                            onClick={() => {
                                socket.emit("change-timer", timer);
                                handleGetTimer();
                            }}
                        >
                            Set
                        </button>
                    </div>
                )}

                <div className="flex gap-2 mt-4">
                    <div className="w-full p-3 bg-gray-800 rounded-lg text-lg flex items-center justify-center">
                        Timer Status: {timerState.toUpperCase()}
                        <span className="ml-4">Current Time: {formatTimer()}</span>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    {isTimerChangeable && <button
                        className="w-full p-3 bg-yellow-500 hover:bg-yellow-600 active:scale-95 transition-all cursor-pointer"
                        onClick={handleSendQuestion}
                    >
                        Send Question
                    </button>}

                    {isTimerChangeable && <button
                        className="w-full p-3 bg-green-500 hover:bg-green-600 active:scale-95 transition-all cursor-pointer"
                        onClick={handleShowOptions}
                    >
                        Show Options
                    </button>}

                    <button
                        className="w-full p-3 bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
                        onClick={() => socket.emit("remove-question")}
                    >
                        ❌ Remove
                    </button>
                    {timerState === "running" && <button
                        className="w-full p-3 bg-red-500 hover:bg-red-600 active:scale-95 transition-all cursor-pointer"
                        onClick={handlePauseTimer}
                    >
                        Pause Timer
                    </button>}
                    {timerState === "paused" && <button
                        className="w-full p-3 bg-green-500 hover:bg-green-600 active:scale-95 transition-all cursor-pointer"
                        onClick={handleContinueTimer}
                    >
                        Continue Timer
                    </button>}
                </div>

                <hr className="mt-8" />

                <div className="flex flex-row gap-4 mt-2 mb-6">
                    <div className="w-1/2">
                        <h2 className="text-lg my-4">Controls</h2>
                        <div className="grid grid-cols-4 gap-2">
                            {options.map((_, index) => (
                                <button key={`p${index}`} className="p-2 bg-blue-500 rounded hover:bg-blue-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("pick-answer", index)}>Pick {index + 1}</button>
                            ))}
                            {options.map((_, index) => (
                                <button key={`c${index}`} className="p-2 bg-green-500 rounded hover:bg-green-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("mark-correct", index)}>✅ {index + 1}</button>
                            ))}
                            {options.map((_, index) => (
                                <button key={`w${index}`} className="p-2 bg-red-500 rounded hover:bg-red-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("mark-wrong", index)}>❌ {index + 1}</button>
                            ))}
                        </div>
                    </div>
                    <div className="w-1/2">
                        <h2 className="text-lg my-4">Mixer</h2>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.keys(audios).map((key) => (
                                <button key={key} className="p-2 bg-gray-500 rounded hover:bg-gray-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("play-audio", key)}>{audios[key]}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
