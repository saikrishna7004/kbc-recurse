"use client";
import { animate, motion } from "framer-motion";
import { useState } from "react";

const SpinTheWheel = () => {
    const [options] = useState([
        "Revive a lifeline",
        "+ ₹50",
        "+ ₹100",
        "- ₹50",
    ]);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [highlightedIndex, setHighlightedIndex] = useState(null);

    const spinWheel = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setHighlightedIndex(null);

        const initialSpeed = 5000;
        const finalRotation =
            rotation + initialSpeed + Math.floor(Math.random() * 1000);

        animate(rotation, finalRotation, {
            duration: 7,
            ease: [0.25, 0.1, 0.25, 1],
            onUpdate: (latest) => setRotation(latest),
            onComplete: () => {
                const normalizedAngle = finalRotation % 360;
                const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 360 : normalizedAngle;
                const adjustedAngle = (positiveAngle + 90) % 360;
                const baseIndex = Math.floor(((360 - adjustedAngle) % 360) / (360 / options.length)) % options.length;
                const oppositeIndex = (baseIndex + Math.floor(options.length / 2)) % options.length;
                setHighlightedIndex(oppositeIndex);
                setIsSpinning(false);
            },
        });
    };

    const getColorForIndex = (index) => {
        const darkModeColors = [
            "#E74C3C",
            "#2ECC71",
            "#3498DB",
            "#F39C12",
            "#9B59B6",
            "#E67E22",
            "#1ABC9C",
            "#34495E",
        ];
        return darkModeColors[index % darkModeColors.length];
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
            <h1 className="text-4xl font-bold mb-8 text-center text-neutral-100">
                Spin the Wheel
            </h1>

            <div className="relative w-96 h-96">
                <motion.div
                    className="absolute inset-0 rounded-full shadow-2xl overflow-hidden border-4 border-neutral-700"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        backgroundImage:
                            "conic-gradient(" +
                            options
                                .map(
                                    (option, index) =>
                                        `${getColorForIndex(index)} ${(index / options.length) * 360
                                        }deg ${((index + 1) / options.length) * 360}deg`
                                )
                                .join(", ") +
                            ")",
                    }}
                >
                    {options.map((option, index) => {
                        const angle = (index / options.length) * 360 + 180 / options.length;
                        const isHighlighted = index === highlightedIndex;
                        return (
                            <div
                                key={option}
                                className={`absolute w-full h-full text-neutral-100 font-semibold text-base transition-all duration-500 ${isHighlighted ? 'scale-105 z-10' : ''
                                    }`}
                                style={{
                                    transform: `rotate(${angle}deg)`,
                                    transformOrigin: "center",
                                }}
                            >
                                <div
                                    className={`absolute w-24 text-center flex flex-col items-center justify-center ${isHighlighted ? 'text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''
                                        }`}
                                    style={{
                                        left: "50%",
                                        top: "20%",
                                        transform: "translateX(-50%) rotate(-90deg)",
                                        textShadow: isHighlighted ? "0 0 10px rgba(255,255,255,0.8)" : "1px 1px 2px rgba(0,0,0,0.5)",
                                        transformOrigin: "center",
                                    }}
                                >
                                    {option}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>

                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-16 border-t-transparent border-b-transparent border-r-neutral-600 z-10" />
            </div>

            <button
                onClick={spinWheel}
                disabled={isSpinning}
                className={`mt-8 px-6 py-3 rounded-lg text-white font-bold ${isSpinning
                    ? "bg-neutral-600 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800 active:bg-blue-900"
                    } transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            >
                {isSpinning ? "Spinning..." : "Spin the Wheel"}
            </button>
        </div>
    );
};

export default SpinTheWheel;