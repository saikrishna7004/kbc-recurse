"use client";
import { useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function AdminPage() {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(30);

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
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="w-full max-w-5xl bg-gray-900 px-6 py-4 rounded-lg shadow-lg text-center border-4 border-yellow-500">
                <h1 className="text-2xl font-bold text-yellow-500 mb-4">Admin Panel</h1>

                <input className="w-full p-3 mb-4 text-lg bg-gray-800" placeholder="Enter question..." value={question} onChange={(e) => setQuestion(e.target.value)} />

                {options.map((opt, index) => (
                    <input key={index} className="w-full p-2 mb-2 text-lg bg-gray-800" placeholder={`Option ${index + 1}`} value={opt} onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                    }} />
                ))}

                <button className="w-full p-3 mt-2 bg-yellow-500 hover:bg-yellow-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("question-update", { text: question, options })}>Send Question</button>

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
                <div className="flex gap-4 mt-4">
                    {["30", "45", "60", "unlimited"].map((t) => (
                        <button key={t} className="p-2 bg-purple-500 rounded hover:bg-purple-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("change-timer", t)}>{t}s</button>
                    ))}
                    <input type="number" value={timer} className="p-2 bg-gray-700 text-white" onChange={(e) => setTimer(e.target.value)} />
                    <button className="p-2 bg-purple-500 rounded hover:bg-purple-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("change-timer", timer)}>Set</button>
                    <button className="p-2 bg-gray-500 rounded hover:bg-gray-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("reset-timer")}>🔄 Reset Timer</button>
                    <button className="p-2 bg-orange-500 rounded hover:bg-orange-600 active:scale-95 transition-all cursor-pointer" onClick={() => socket.emit("remove-question")}>❌ Remove</button>
                </div>
            </div>
        </div>
    );
}
