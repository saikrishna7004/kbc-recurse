/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import SemiCircleProgressBar from "react-progressbar-semicircle";
import Image from "next/image";

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000", {
    extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
    }
});
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
    'Phone a friend': '/Phone A Friend.png',
};

export default function DisplayPage() {
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
    const textRef = useRef(null);
    const lastUpdateTime = useRef(0);

    const [dashOffset, setDashOffset] = useState(100);

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
            playAudio("correct");
        });

        socket.on("mark-wrong", (index) => {
            setSelectedStatus({ index, status: "wrong" });
            setCorrectAnswer(null);
            playAudio("wrong");
        });

        socket.on("show-correct-answer", (data) => {
            setSelectedStatus({ index: data.selectedIndex, status: "selected" });
            setCorrectAnswer(data.correctIndex);
            playAudio("wrong");
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
                return "bg-gradient-to-r from-red-800 via-red-700 to-red-800";
            }
        }

        if (selectedStatus.index === index) {
            if (selectedStatus.status === "selected") return "bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700";
            if (selectedStatus.status === "correct") return "bg-gradient-to-r from-green-800 via-green-700 to-green-800";
            if (selectedStatus.status === "wrong") return "bg-gradient-to-r from-red-800 via-red-700 to-red-800";
        }
        return "bg-gradient-to-r from-[#03126F] via-[#053EAE] to-[#03126F]";
    };

    const adjustFontSize = () => {
        const container = textRef.current;
        if (!container) return;

        const containerWidth = container.offsetWidth;
        let fontSize = containerWidth / question?.text?.length;
        fontSize = Math.min(Math.max(fontSize, 20), 34);

        container.style.fontSize = `${fontSize}px`;
    };

    useEffect(() => {
        adjustFontSize();
        window.addEventListener('resize', adjustFontSize);

        return () => {
            window.removeEventListener('resize', adjustFontSize);
        };
    }, [question]);

    useEffect(() => {
        const progress = (timer.current / timer.max) * 100;
        setDashOffset(progress);
    }, [timer.current, timer.max]);

    const renderScreen = () => {
        switch (currentScreen) {
            case "logo":
                return (
                    <div className="flex flex-col items-center justify-center">
                        <Image className="mx-auto rounded-full mb-12" src="/logo.jpg" width={300} height={300} alt="Logo" />
                        <h1 className="text-4xl font-bold text-yellow-400 mt-8">Kaun Banega Codepati</h1>
                    </div>
                );
            case "question":
                return (
                    <>
                        <Image className="mx-auto rounded-full mb-12" src="/logo.jpg" width={200} height={200} alt="Logo" />
                        <div className="relative w-32 h-32 -mb-16 mx-auto border-4 border-yellow-300 bg-radial from-[#053EAE] to-[#03126F] rounded-full">
                            <SemiCircleProgressBar percentage={dashOffset || 0} diameter={120} strokeWidth={5} background="transparent" stroke="#eab308" />
                            <span className="text-4xl text-semibold text-yellow-200 absolute translate-x-[-50%] translate-y-[-115%]">{timer.current === "unlimited" ? "∞" : timer.current}</span>
                        </div>

                        <div className="relative flex items-center justify-center mb-6 mx-auto text-center overflow-hidden">
                            <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 animate-shine"></span>
                            <span ref={textRef} className="z-1 w-4xl h-[80px] content-center border-4 border-yellow-300 bg-gradient-to-r from-[#03126F] via-[#053EAE] to-[#03126F]">{question?.text || ""}</span>
                        </div>

                        <div className="relative flex items-center justify-center mb-6 mx-auto text-center overflow-hidden">
                            <div className="grid grid-cols-2 gap-4 w-4xl mx-auto mt-4">
                                <span className="absolute left-0 top-[127px] w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 animate-shine"></span>
                                <span className="absolute left-0 top-[47px] w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 animate-shine"></span>
                                {question?.options?.map((option, index) => (
                                    <div key={index}>
                                        <div
                                            onClick={() => socket.emit("answer-selected", index)}
                                            className={`border-4 relative z-10 h-[65px] border-yellow-300 rounded-full py-2 px-4 text-center lg:text-lg text-sm content-center ${getBgColor(index)}`}
                                        >
                                            {showOptions ? option : ""}
                                        </div>
                                    </div>
                                ))}
                                {
                                    !(question?.options?.length > 0) && [1, 2, 3, 4].map((option, index) => (
                                        <div key={index}>
                                            <div
                                                onClick={() => socket.emit("answer-selected", index)}
                                                className={`border-4 relative z-10 h-[52px] border-yellow-300 rounded-full py-2 px-4`}
                                            >
                                                {showOptions ? option : ""}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </>
                );
            case "lifeline":
                return (
                    <div className="flex flex-col items-center justify-center mb-12">
                        <h2 className="text-3xl font-bold text-yellow-400 mb-8">Lifelines</h2>
                        <div className="flex gap-8">
                            {Object.entries(icons).map(([key, icon]) => {
                                return <div key={key} className="flex flex-col items-center justify-center">
                                    <Image className="w-32 h-auto" src={icon} width={100} height={100} alt={key} />
                                </div>
                            })}
                        </div>
                    </div>
                );
            case "prize":
                return (
                    <div className="flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-bold text-yellow-400 mb-8">Prize Money</h2>
                        <div className="border-4 border-yellow-300 rounded-lg p-6 bg-blue-900 max-w-md">
                            <ul className="space-y-4">
                                <li className="bg-yellow-600 p-2 rounded">₹ 500</li>
                                <li>₹ 400</li>
                                <li>₹ 300</li>
                                <li>₹ 200</li>
                                <li>₹ 100</li>
                                <li className="bg-yellow-600 p-2 rounded">₹ 50</li>
                                <li>₹ 0</li>
                                <li>₹ 0</li>
                                <li>₹ 0</li>
                                <li>₹ 0</li>
                                <li>₹ 0</li>
                            </ul>
                        </div>
                    </div>
                );
            case "blank":
                return (
                    <div className="w-full h-screen bg-black">
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center">
                        <Image className="mx-auto rounded-full mb-12" src="/logo.jpg" width={300} height={300} alt="Logo" />
                    </div>
                );
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="w-full text-center">
                <div className="mx-auto">
                    {renderScreen()}
                </div>
            </div>
        </div>
    );
}
