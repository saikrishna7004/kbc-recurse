import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { logoVariants, questionVariants, optionsContainerVariants, optionItemVariants, optionTextVariants, textChangeVariants, timerVariants } from '@/constants/animations';
import SemiCircleProgressBar from 'react-progressbar-semicircle';
import { useEffect, useRef, useState } from "react";

const Question = ({ question, questionNumber, timer, hiddenOptions, showOptions, getBgColor }) => {
    const textRef = useRef(null);
    const [dashOffset, setDashOffset] = useState(100);
    useEffect(() => {
        const progress = ((timer.max - timer.current) / timer.max) * 100;
        setDashOffset(progress);
    }, [timer.current, timer.max]);

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

    return (
        <div>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={logoVariants}
            >
                <Image className="mx-auto rounded-full mb-12" src="/logo.jpg" width={200} height={200} alt="Logo" />
            </motion.div>

            <motion.div
                className="relative w-32 h-32 -mb-16 mx-auto border-4 border-yellow-300 bg-radial from-[#053EAE] to-[#03126F] rounded-full"
                initial="hidden"
                animate="visible"
                variants={timerVariants}
            >
                <SemiCircleProgressBar percentage={dashOffset || 0} diameter={120} strokeWidth={5} background="transparent" stroke="#eab308" />
                <span className="text-4xl text-semibold text-yellow-200 absolute translate-x-[-50%] translate-y-[-115%]">{timer.current === "unlimited" ? "∞" : timer.current}</span>
            </motion.div>

            <motion.div
                className="relative flex items-center justify-center mb-6 mx-auto text-center px-4"
                initial="hidden"
                animate="visible"
                variants={questionVariants}
                onAnimationComplete={adjustFontSize}
            >
                <div className="absolute w-4xl -top-12">
                    <motion.div
                        className="left-12 w-12 h-12 bg-yellow-500 rounded-t-md flex items-center justify-center text-black font-bold text-xl border-x-2 border-t-2 border-yellow-300"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                    >
                        {questionNumber}
                    </motion.div>
                </div>
                <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 animate-shine"></span>
                <span ref={textRef} className="z-1 w-4xl h-[80px] content-center border-4 border-yellow-300 bg-gradient-to-r from-[#03126F] via-[#053EAE] to-[#03126F] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={question.text}
                            className="w-full h-full flex items-center justify-center"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={textChangeVariants}
                        >
                            {question?.text || ""}
                        </motion.span>
                    </AnimatePresence>
                </span>
            </motion.div>

            <motion.div
                className="relative flex items-center justify-center mb-6 mx-auto text-center overflow-hidden px-4"
                initial="hidden"
                animate="visible"
                variants={optionsContainerVariants}
            >
                <div className="grid grid-cols-2 gap-4 w-4xl mx-auto mt-4">
                    <span className="absolute left-0 top-[127px] w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 animate-shine"></span>
                    <span className="absolute left-0 top-[47px] w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 animate-shine"></span>
                    {question?.options?.map((option, index) => (
                        <motion.div key={index} variants={optionItemVariants}>
                            <div className={`border-4 relative z-10 h-[65px] border-yellow-300 rounded-full py-2 px-4 text-center md:text-lg text-sm content-center ${getBgColor(index)} overflow-hidden`}>
                                <AnimatePresence mode="wait">
                                    {showOptions && (
                                        <motion.span
                                            key={`option-${index}-${option}`}
                                            className="w-full h-full flex items-center justify-center"
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            variants={optionTextVariants}
                                        >
                                            {hiddenOptions.includes(index) ? "" : option}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                    {
                        !(question?.options?.length > 0) && [1, 2, 3, 4].map((option, index) => (
                            <motion.div key={index} variants={optionItemVariants}>
                                <div
                                    onClick={() => handleOptionClick(index)}
                                    className={`border-4 relative z-10 h-[52px] border-yellow-300 rounded-full py-2 px-4 ${hiddenOptions.includes(index) ? 'opacity-30' : 'cursor-pointer'}`}
                                >
                                    {showOptions ? option : ""}
                                </div>
                            </motion.div>
                        ))
                    }
                </div>
            </motion.div>

        </div>
    )
}

export default Question
