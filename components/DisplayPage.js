/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Lifeline from "./screens/Lifeline";
import Logo from "./screens/Logo";
import Question from "./screens/Question";
import SpinTheWheel from "./screens/SpinTheWheel";
import Status from "./screens/Status";

const audioFiles = {
    correct: "/audio/Correct.mp3",
    wrong: "/audio/Wrong.mp3",
    timer: "/audio/Timer.mp3",
    intro: "/audio/Intro.mp3",
    end: "/audio/End.mp3",
    lock: "/audio/Lock.mp3",
    next: "/audio/Next Question.mp3",
    suspense1: "/audio/Suspense 1.mp3",
    suspense2: "/audio/Suspense 2.mp3",
    suspense3: "/audio/Suspense 3.mp3",
    suspense4: "/audio/Suspense 4.mp3",
};
const icons = {
    '50-50': '/50-50.png',
    'Audience Poll': '/Audience Poll.png',
    'Phone a friend': '/Phone a friend.png',
};

const LightEffect = ({ type }) => {
    return (
        <AnimatePresence>
            {type && (
                <motion.div
                    className={`fixed inset-0 pointer-events-none z-50 ${
                        type === "correct" ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                >
                    <motion.div
                        className={`absolute inset-0 ${
                            type === "correct" ? "bg-green-500/10" : "bg-red-500/10"
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ 
                            duration: 5,
                            times: [0, 0.5, 1],
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default function DisplayPage() {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000", {
        extraHeaders: {
            'ngrok-skip-browser-warning': 'true'
        }
    });
    
    const [question, setQuestion] = useState({
        text: "",
        options: ["&nbsp;", "&nbsp;", "&nbsp;", "&nbsp;"],
        correctIndex: null,
        wrongIndex: null,
        selected: null,
        timer: 60,
        maxTimer: 60,
        showOptions: false
    });
    const [selectedStatus, setSelectedStatus] = useState({ index: null, status: "" });
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [timer, setTimer] = useState({ current: 0, max: 0 });
    const [timerFrozen, setTimerFrozen] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [currentScreen, setCurrentScreen] = useState("logo");
    const audioRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const lastUpdateTime = useRef(0);

    const [lifelineStatus, setLifelineStatus] = useState({
        "50-50": false,
        "Audience Poll": false,
        "Phone a friend": false
    });
    const [hiddenOptions, setHiddenOptions] = useState([]);
    const [specificLifeline, setSpecificLifeline] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [lightEffect, setLightEffect] = useState(null);

    useEffect(() => {
        socket.on("display-question", (data) => {
            setQuestion(data);
            setSelectedStatus({ index: null, status: "" });
            setCorrectAnswer(null);
            setTimer({ current: data.timer || 60, max: data.maxTimer || 60 });
            setShowOptions(data.showOptions || false);
            setTimerFrozen(true);
        });

        socket.on("show-options", () => {
            setShowOptions(true);
            setTimerFrozen(false);
        });

        socket.on("highlight-answer", (index) => {
            setSelectedStatus({ index, status: "selected" });
            setCorrectAnswer(null);
        });

        socket.on("mark-correct", (index) => {
            setSelectedStatus({ index, status: "correct" });
            setCorrectAnswer(null);
            setLightEffect("correct");
            playAudio("correct");
            setTimeout(() => setLightEffect(null), 5000);
        });

        socket.on("mark-wrong", (index) => {
            setSelectedStatus({ index, status: "wrong" });
            setCorrectAnswer(null);
            setLightEffect("wrong");
            playAudio("wrong");
            setTimeout(() => setLightEffect(null), 5000);
        });

        socket.on("show-correct-answer", (data) => {
            setSelectedStatus({ index: data.selectedIndex, status: "selected" });
            setCorrectAnswer(data.correctIndex);
            setLightEffect("wrong");
            playAudio("wrong");
            setTimeout(() => setLightEffect(null), 5000);
        });

        socket.on("reset-highlights", () => {
            setSelectedStatus({ index: null, status: "" });
            setCorrectAnswer(null);
        });

        socket.on("update-timer", (data) => {
            setTimer({
                current: data.current,
                max: data.max
            });

            lastUpdateTime.current = Date.now();

            if (data.audioTrigger && data.current !== "unlimited") {
                const audioLength = 60;
                let startPosition = 0;

                if (data.startPosition !== undefined) {
                    startPosition = data.startPosition;
                } else if (typeof data.current === 'number') {
                    startPosition = Math.max(0, audioLength - data.current);
                }

                playAudio("timer", startPosition);
            } else if (data.current === "unlimited") {
                stopAllAudio();
            }
        });

        socket.on("clear-question", () => {
            setQuestion({
                text: "",
                options: ["&nbsp;", "&nbsp;", "&nbsp;", "&nbsp;"],
                correctIndex: null,
                wrongIndex: null,
                selected: null,
                timer: 60,
                maxTimer: 60,
                showOptions: false
            });
            setHiddenOptions([]);
            setSpecificLifeline(null);
            stopAllAudio();
            setTimerFrozen(true);
            setShowOptions(false);
            setSelectedStatus({ index: null, status: "" });
            setCorrectAnswer(null);
        });

        socket.on("trigger-audio", (audioKey) => {
            if (audioKey === "stop") {
                stopAllAudio();
                return;
            }
            playAudio(audioKey);
        });

        socket.on("freeze-timer", (triggerAudio) => {
            setTimerFrozen(true);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            if (triggerAudio) {
                stopAllAudio();
            }
        });

        socket.on("unfreeze-timer", (triggerAudio, audioOffset) => {
            setTimerFrozen(false);

            if (triggerAudio) {
                const offset = audioOffset || (typeof timer.current === 'number' ? 60 - timer.current : 0);
                playAudio("timer", offset);
            }
        });

        socket.on("change-screen", (screen) => {
            setCurrentScreen(screen);
        });

        socket.on("update-lifelines", (status) => {
            setLifelineStatus(status);
        });

        socket.on("apply-5050", (optionsToHide) => {
            setHiddenOptions(optionsToHide);
        });

        socket.on("show-specific-lifeline", (lifeline) => {
            setSpecificLifeline(lifeline);
        });

        socket.on("update-question-number", (data) => {
            setQuestionNumber(data.questionNumber);
        });

        return () => {
            socket.off("display-question");
            socket.off("show-options");
            socket.off("highlight-answer");
            socket.off("mark-correct");
            socket.off("mark-wrong");
            socket.off("update-timer");
            socket.off("clear-question");
            socket.off("trigger-audio");
            socket.off("freeze-timer");
            socket.off("unfreeze-timer");
            socket.off("change-screen");
            socket.off("show-correct-answer");
            socket.off("reset-highlights");
            socket.off("update-lifelines");
            socket.off("apply-5050");
            socket.off("show-specific-lifeline");
            socket.off("update-question-number");
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (timer.current === "unlimited" || timerFrozen) {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            return;
        }

        if (timer.current > 0 && !timerFrozen) {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }

            timerIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const elapsedSinceLastUpdate = (now - lastUpdateTime.current) / 1000;

                if (elapsedSinceLastUpdate >= 0.9) {
                    setTimer(prev => {
                        if (typeof prev.current === 'number' && prev.current > 0) {
                            lastUpdateTime.current = now;
                            return { ...prev, current: prev.current - 1 };
                        }
                        return prev;
                    });
                }
            }, 1000);

            return () => {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
            };
        }
    }, [timer.current, timerFrozen]);

    const stopAllAudio = async () => {
        if (audioRef.current) {
            await audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    };

    const playAudio = async (key, offset = 0) => {
        try {
            await stopAllAudio();
            console.log(`Playing ${key} with offset ${offset}`);
            if (audioFiles[key]) {
                audioRef.current = new Audio(audioFiles[key]);
                if (offset > 0) {
                    audioRef.current.currentTime = offset;
                }
                await audioRef.current.play();
            }
        }
        catch (e) {
            console.log(e);
        }
    };

    const getBgColor = (index) => {
        if (correctAnswer !== null && selectedStatus.index !== null) {
            if (index === correctAnswer) {
                return "bg-gradient-to-r from-green-800 via-green-700 to-green-800";
            }
            if (index === selectedStatus.index) {
                return "bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700";
            }
        }

        if (selectedStatus.index === index) {
            if (selectedStatus.status === "selected") return "bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700";
            if (selectedStatus.status === "correct") return "bg-gradient-to-r from-green-800 via-green-700 to-green-800";
            if (selectedStatus.status === "wrong") return "bg-gradient-to-r from-red-800 via-red-700 to-red-800";
        }
        return "bg-gradient-to-r from-[#03126F] via-[#053EAE] to-[#03126F]";
    };

    useEffect(() => {
        setSpecificLifeline(null);
    }, [currentScreen]);

    const prizeAmounts = ["₹1000", "₹500", "₹400", "₹240", "₹180", "₹120", "₹80", "₹50", "₹30", "₹20", "₹10"];

    const renderScreen = () => {
        switch (currentScreen) {
            case "logo":
                return <Logo />
            case "question":
                return <Question question={question} questionNumber={questionNumber} timer={timer} hiddenOptions={hiddenOptions} showOptions={showOptions} getBgColor={getBgColor} />
            case "lifeline":
                return <Lifeline icons={icons} lifelineStatus={lifelineStatus} specificLifeline={specificLifeline} />
            case "status":
                return <Status prizeAmounts={prizeAmounts} questionNumber={questionNumber} lifelineStatus={lifelineStatus} icons={icons} />
            case "blank":
                return <div className="w-full h-screen bg-black" />
            case "spin":
                return <SpinTheWheel/>
            default:
                return <Logo />
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-black text-white">
            <LightEffect type={lightEffect} />
            <div className="w-full text-center">
                <div className="mx-auto">
                    {renderScreen()}
                </div>
            </div>
        </div>
    );
}
