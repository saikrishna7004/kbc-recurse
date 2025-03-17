"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function DisplayPage() {
    const [question, setQuestion] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState({ index: null, status: "" });
    const [timer, setTimer] = useState(30);
    const [timerFrozen, setTimerFrozen] = useState(false);
    const audioRef = useRef(null);

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

    useEffect(() => {
        socket.on("display-question", (data) => {
            setQuestion(data);
            setSelectedStatus({ index: null, status: "" });
            setTimerFrozen(false);
        });

        socket.on("highlight-answer", (index) => {
            setSelectedStatus({ index, status: "selected" });
        });

        socket.on("mark-correct", (index) => {
            setSelectedStatus({ index, status: "correct" });
            playAudio("correct");
        });

        socket.on("mark-wrong", (index) => {
            setSelectedStatus({ index, status: "wrong" });
            playAudio("wrong");
        });

        socket.on("update-timer", (value) => {
            setTimer(value);
            if (value !== "unlimited") {
                const startAt = 59 - value;
                playAudio("timer", startAt);
            } else {
                stopAllAudio();
            }
        });

        socket.on("clear-question", () => {
            setQuestion(null);
            stopAllAudio();
            setTimerFrozen(false);
        });

        socket.on("trigger-audio", (audioKey) => {
            playAudio(audioKey);
        });

        socket.on("freeze-timer", () => {
            setTimerFrozen(true);
        });

        return () => {
            socket.off("display-question");
            socket.off("highlight-answer");
            socket.off("mark-correct");
            socket.off("mark-wrong");
            socket.off("update-timer");
            socket.off("clear-question");
            socket.off("trigger-audio");
        };
    }, []);

    useEffect(() => {
        if (timer === "unlimited" || timerFrozen) {
            stopAllAudio();
            return;
        }

        if (timer > 0 && !timerFrozen) {
            const interval = setInterval(() => {
                setTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [timer, timerFrozen]);

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
            if (audioFiles[key]) {
                audioRef.current = new Audio(audioFiles[key]);
                if (offset) {
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
        if (selectedStatus.index === index) {
            if (selectedStatus.status === "selected") return "bg-blue-500";
            if (selectedStatus.status === "correct") return "bg-green-500";
            if (selectedStatus.status === "wrong") return "bg-red-500";
        }
        return "bg-gray-700";
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="w-full max-w-3xl bg-gray-900 p-6 border-4 border-yellow-500 text-center">
                <h1 className="text-3xl font-bold text-yellow-500 mb-4">Kaun Banega Crorepati</h1>

                {question ? (
                    <>
                        <h2 className="text-2xl mb-6">{question.text}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            {question.options.map((option, index) => {
                                return (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg text-lg font-bold text-white cursor-pointer transition-all ${getBgColor(index)}`}
                                    >
                                        {option}
                                    </div>
                                );
                            })}
                        </div>

                        <h2 className="text-lg mt-6 text-yellow-500">Timer: {timer}</h2>
                    </>
                ) : (
                    <h2 className="text-2xl text-gray-400">Waiting for Question...</h2>
                )}
            </div>
        </div>
    );
}
