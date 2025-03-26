"use client";
import { animate, motion } from "framer-motion";
import { useState } from "react";

const SpinTheWheel = () => {
  const [options] = useState([
    "Trip to Hawaii",
    "$100 Gift Card",
    "Wireless Headphones",
    "Dinner for Two",
    "Tech Gadget",
    "Shopping Spree",
    "Spa Day",
    "Mystery Prize",
  ]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

//   const spinWheel = () => {
//     if (isSpinning) return;
//     setIsSpinning(true);

//     const initialSpeed = 5000;
//     const finalRotation =
//       rotation + initialSpeed + Math.floor(Math.random() * 1000);

//     animate(rotation, finalRotation, {
//       duration: 7,
//       ease: [0.25, 0.1, 0.25, 1],
//       onUpdate: (latest) => setRotation(latest),
//       onComplete: () => {
//         const optionIndex = Math.floor(
//           (finalRotation % 360) / (360 / options.length)
//         );
//         setSelectedOption(options[optionIndex]);
//         setIsSpinning(false);
//       },
//     });
//   };


const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
  
    const initialSpeed = 5000;
    const finalRotation =
      rotation + initialSpeed + Math.floor(Math.random() * 1000);
  
    animate(rotation, finalRotation, {
      duration: 7,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (latest) => setRotation(latest),
      onComplete: () => {
        // Calculate the normalized angle (0-360 degrees)
        const normalizedAngle = finalRotation % 360;
        // Convert to positive angle if negative
        const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 360 : normalizedAngle;
        // Calculate option index (reversed to match wheel direction)
        const optionIndex = Math.floor((360 - positiveAngle) / (360 / options.length)) % options.length;
        
        setSelectedOption(options[optionIndex]);
        setIsSpinning(false);
      },
    });
  };
  
  const closeModal = () => {
    setSelectedOption(null);
  };

  const getColorForIndex = (index) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FDCB6E",
      "#6C5CE7",
      "#FF8A5B",
      "#2ECC71",
      "#3498DB",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Spin the Wheel
      </h1>

      <div className="relative w-96 h-96">
        <motion.div
          className="absolute inset-0 rounded-full shadow-2xl overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            backgroundImage:
              "conic-gradient(" +
              options
                .map(
                  (option, index) =>
                    `${getColorForIndex(index)} ${
                      (index / options.length) * 360
                    }deg ${((index + 1) / options.length) * 360}deg`
                )
                .join(", ") +
              ")",
          }}
        >
          {options.map((option, index) => {
            const angle = (index / options.length) * 360 + 180 / options.length;
            return (
              <div
                key={option}
                className="absolute w-full h-full text-white font-semibold text-sm"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: "center",
                }}
              >
                <div
                  className="absolute w-24 text-center flex flex-col items-center justify-center"
                  style={{
                    left: "50%",
                    top: "20%",
                    transform: "translateX(-50%) rotate(-90deg)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                    transformOrigin: "center",
                  }}
                >
                  {option}
                </div>
              </div>
            );
          })}
        </motion.div>

        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 
                     border-l-8 border-r-8 border-t-16 border-l-transparent 
                     border-r-transparent border-t-black z-10"
        />
      </div>

      <button
        onClick={spinWheel}
        disabled={isSpinning}
        className={`mt-8 px-6 py-3 rounded-lg text-white font-bold ${
          isSpinning
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
        } transition-colors duration-300`}
      >
        {isSpinning ? "Spinning..." : "Spin the Wheel"}
      </button>

      {/* Result Modal */}
      {selectedOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center relative z-50 min-w-[300px]">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Congratulations!
            </h2>
            <p className="text-xl mb-6 text-gray-700">
              You won: <span className="font-semibold">{selectedOption}</span>
            </p>
            <button
              onClick={closeModal}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinTheWheel;
