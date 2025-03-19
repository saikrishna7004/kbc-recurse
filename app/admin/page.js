"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Image from "next/image";

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000", {
    extraHeaders: {
        "ngrok-skip-browser-warning": "true",
    }
});

export default function AdminPage() {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const [currentTimer, setCurrentTimer] = useState({ current: null, max: null });
    const [timerState, setTimerState] = useState("stopped");
    const [error, setError] = useState("");
    const [currentScreen, setCurrentScreen] = useState("logo");
    const [lifelineStatus, setLifelineStatus] = useState({
        "50-50": false,
        "Audience Poll": false,
        "Phone a friend": false
    });
    const [activeLifeline, setActiveLifeline] = useState(null);
    const [fiftyFiftySelection, setFiftyFiftySelection] = useState([]);
    const [hiddenOptions, setHiddenOptions] = useState([]);
    const [questionNumber, setQuestionNumber] = useState(1);

    const audios = {
        correct: "Correct",
        wrong: "Wrong",
        timer: "Timer",
        intro: "Intro",
        end: "End",
        lock: "Lock",
        next: "Next",
        stop: "Stop",
        suspense1: "Suspense 1",
        suspense2: "Suspense 2",
        suspense3: "Suspense 3",
        suspense4: "Suspense 4",
    };

    const screens = [
        { id: "logo", name: "Logo" },
        { id: "question", name: "Question" },
        { id: "lifeline", name: "Lifelines" },
        { id: "prize", name: "Prize Money" },
        { id: "blank", name: "Blank Screen" }
    ];

    const icons = {
        '50-50': '/50-50.png',
        'Audience Poll': '/Audience Poll.png',
        'Phone a friend': '/Phone a friend.png',
    };

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

        socket.on("update-lifelines", (status) => {
            setLifelineStatus(status);
        });

        socket.on("set-active-lifeline", (lifeline) => {
            setActiveLifeline(lifeline);
            if (!lifeline) {
                setFiftyFiftySelection([]);
            }
        });

        socket.on("prepare-fifty-fifty", (availableOptions) => {
            setFiftyFiftySelection([]);
        });

        socket.on("apply-5050", (optionsToHide) => {
            setHiddenOptions(optionsToHide);
        });

        socket.on("update-question-number", (data) => {
            setQuestionNumber(data.questionNumber);
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
            socket.off("update-lifelines");
            socket.off("set-active-lifeline");
            socket.off("prepare-fifty-fifty");
            socket.off("apply-5050");
            socket.off("update-question-number");
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

    const handleLifeline = (lifeline) => {
        if (!lifelineStatus[lifeline] && !activeLifeline) {
            socket.emit("use-lifeline", lifeline);
        }
    };

    const handleFiftyFiftyOption = (index) => {
        if (activeLifeline === "50-50") {
            if (fiftyFiftySelection.includes(index)) {
                setFiftyFiftySelection(fiftyFiftySelection.filter(i => i !== index));
            } else {
                if (fiftyFiftySelection.length < 2) {
                    setFiftyFiftySelection([...fiftyFiftySelection, index]);
                }
            }
        }
    };

    const applyFiftyFifty = () => {
        if (fiftyFiftySelection.length === 2) {
            socket.emit("select-fifty-fifty-options", fiftyFiftySelection);
        }
    };

    const cancelLifeline = () => {
        socket.emit("cancel-lifeline");
    };

    const resetLifelines = () => {
        socket.emit("reset-lifelines");
    };

    const isOptionDisabled = (index) => {
        return hiddenOptions.includes(index);
    };

    const handleIncrementQuestion = () => {
        socket.emit("increment-question");
    };

    const handleDecrementQuestion = () => {
        socket.emit("decrement-question");
    };

    const handleResetQuestionNumber = () => {
        socket.emit("reset-question-number");
    };

    const prizeAmounts = ["₹ 500", "₹ 400", "₹ 300", "₹ 200", "₹ 100", "₹ 50", "₹ 0", "₹ 0", "₹ 0", "₹ 0", "₹ 0"];

    return (
        <div className="flex flex-col-reverse lg:flex-none">
            <div className="lg:absolute lg:right-0 lg:top-0 bg-black flex flex-col flex-wrap gap-2 p-4">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold mb-3">Screen Control</h2>
                    {screens.map(screen => (
                        <button
                            key={screen.id}
                            className={`p-2 cursor-pointer ${currentScreen === screen.id ? 'bg-yellow-400 hover:bg-yellow-500 text-black' : 'bg-blue-800 hover:bg-blue-700'} transition-all`}
                            onClick={() => handleScreenChange(screen.id)}
                        >
                            {screen.name}
                        </button>
                    ))}
                </div>
                <div className="justify-items-center mt-4 mb-6">
                    <h2 className="text-lg font-bold mb-2">Lifelines</h2>
                    <div className="flex flex-col justify-center gap-2 items-center">
                        {Object.entries(icons).map(([name, icon]) => (
                            <div key={name} className="relative">
                                <button
                                    onClick={() => handleLifeline(name)}
                                    disabled={lifelineStatus[name] || activeLifeline !== null}
                                    className={`p-2 rounded ${lifelineStatus[name] || activeLifeline !== null ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-blue-800 active:scale-95'} transition-all`}
                                >
                                    <div className="relative">
                                        <Image
                                            src={icon}
                                            width={80}
                                            height={80}
                                            alt={name}
                                            className="mx-auto"
                                        />
                                        {lifelineStatus[name] && (
                                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                                <Image src="/cross.png" width={80} height={80} alt="Used" className="opacity-80" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="block text-sm mt-1">{name}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        className="mt-2 p-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition-all cursor-pointer"
                        onClick={resetLifelines}
                    >
                        Reset Lifelines
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="w-full max-w-5xl bg-gray-900 px-6 py-4 shadow-lg text-center border-4 border-yellow-500">
                    <h1 className="text-2xl font-bold text-yellow-500 mb-4">Admin Panel</h1>

                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                            <button
                                onClick={handleDecrementQuestion}
                                className="p-2 bg-red-500 hover:bg-red-600 active:scale-95 cursor-pointer"
                                disabled={questionNumber <= 1}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div className="px-4 py-2 bg-gray-800 text-white font-bold">
                                Question {questionNumber}/11
                            </div>

                            <button
                                onClick={handleIncrementQuestion}
                                className="p-2 bg-green-500 hover:bg-green-600 active:scale-95 cursor-pointer"
                                disabled={questionNumber >= 11}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-600 text-white font-bold">
                                Prize: {prizeAmounts[11 - questionNumber]}
                            </div>
                            <button
                                onClick={handleResetQuestionNumber}
                                className="ml-2 p-2 h-10 bg-purple-500 hover:bg-purple-600 active:scale-95 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-600 text-white p-2 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <input className="w-full p-3 mb-4 text-lg bg-gray-800" placeholder="Enter question..." value={question} onChange={(e) => setQuestion(e.target.value)} />

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
                        <div className="flex flex-row flex-wrap gap-2 my-2">
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
                            <div className="bg-gray-800 px-2 text-lg flex items-center justify-center">
                                Timer Status: {timerState.toUpperCase()}
                                <span className="ml-4">Current Time: {formatTimer()}</span>
                            </div>
                        </div>
                    )}

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
                            Reset
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

                    {activeLifeline === "50-50" && (
                        <div className="bg-blue-900 p-4 my-4 border-2 border-yellow-400 rounded">
                            <h3 className="text-xl font-bold text-yellow-400 mb-3">Select 2 options to hide:</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {options.map((opt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleFiftyFiftyOption(index)}
                                        className={`p-3 border-2 ${fiftyFiftySelection.includes(index)
                                            ? 'border-red-500 bg-red-900'
                                            : 'border-gray-400 bg-gray-800'
                                            } rounded`}
                                    >
                                        {opt || `Option ${index + 1}`}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={applyFiftyFifty}
                                    disabled={fiftyFiftySelection.length !== 2}
                                    className={`p-2 w-1/2 ${fiftyFiftySelection.length === 2
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-gray-600 cursor-not-allowed'
                                        } rounded`}
                                >
                                    Apply 50:50
                                </button>
                                <button
                                    onClick={cancelLifeline}
                                    className="p-2 w-1/2 bg-red-600 hover:bg-red-700 rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <hr className="mt-8" />

                    <div className="flex lg:flex-row flex-col gap-4 mt-2 mb-4">
                        <div className="lg:w-1/2">
                            <h2 className="text-lg my-4">Controls</h2>
                            <div className="grid grid-cols-4 gap-2">
                                {options.map((_, index) => (
                                    <button
                                        key={`p${index}`}
                                        className={`p-2 rounded ${isOptionDisabled(index)
                                            ? 'bg-gray-400 opacity-50 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600 active:scale-95 cursor-pointer'} transition-all`}
                                        onClick={() => !isOptionDisabled(index) && socket.emit("pick-answer", index)}
                                        disabled={isOptionDisabled(index)}
                                    >
                                        Pick {index + 1}
                                    </button>
                                ))}
                                {options.map((_, index) => (
                                    <button
                                        key={`c${index}`}
                                        className={`p-2 rounded ${isOptionDisabled(index)
                                            ? 'bg-gray-400 opacity-50 cursor-not-allowed'
                                            : 'bg-green-500 hover:bg-green-600 active:scale-95 cursor-pointer'} transition-all`}
                                        onClick={() => !isOptionDisabled(index) && socket.emit("mark-correct", index)}
                                        disabled={isOptionDisabled(index)}
                                    >
                                        ✅ {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2">
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
        </div>
    );
}
