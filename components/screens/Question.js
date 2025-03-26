import { logoVariants, optionItemVariants, optionsContainerVariants, optionTextVariants, questionVariants, textChangeVariants, timerVariants } from '@/constants/animations';
import { AnimatePresence, motion } from "framer-motion";
import Image from 'next/image';
import { useEffect, useRef, useState } from "react";
import SemiCircleProgressBar from 'react-progressbar-semicircle';

const getGradientUrl = (bgColor, index) => {
    if (bgColor.includes('from-green')) {
        return `url(#greenGradient-${index})`;
    } else if (bgColor.includes('from-yellow')) {
        return `url(#yellowGradient-${index})`;
    } else if (bgColor.includes('from-red')) {
        return `url(#redGradient-${index})`;
    } else {
        return `url(#blueGradient-${index})`;
    }
};

const Question = ({ question, questionNumber, timer, hiddenOptions, showOptions, getBgColor }) => {
    const textRef = useRef(null);
    const optionRefs = useRef([]);
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

    const adjustOptionFontSize = () => {
        optionRefs.current.forEach((ref, index) => {
            if (!ref || hiddenOptions.includes(index)) return;
            
            const container = ref;
            let fontSize = 24;
            container.style.fontSize = `${fontSize}px`;
           
            while (container.scrollHeight > container.clientHeight && fontSize > 14) {
                fontSize--;
                container.style.fontSize = `${fontSize}px`;
            }
        });
    };

    useEffect(() => {
        adjustFontSize();
        adjustOptionFontSize();
        window.addEventListener('resize', () => {
            adjustFontSize();
            adjustOptionFontSize();
        });

        return () => {
            window.removeEventListener('resize', adjustFontSize);
            window.removeEventListener('resize', adjustOptionFontSize);
        };
    }, [question, hiddenOptions]);

    const optionLabels = ['A', 'B', 'C', 'D'];

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
                        <div key={index}>
                        <motion.div key={index} variants={optionItemVariants}>
                            <div className="relative" style={{ height: '65px' }}>
                                <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 -3 100 106" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id={`blueGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#03126F" />
                                            <stop offset="50%" stopColor="#053EAE" />
                                            <stop offset="100%" stopColor="#03126F" />
                                        </linearGradient>
                                        
                                        <linearGradient id={`greenGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="rgb(22, 101, 52)" /> {/* green-800 */}
                                            <stop offset="50%" stopColor="rgb(21, 128, 61)" /> {/* green-700 */}
                                            <stop offset="100%" stopColor="rgb(22, 101, 52)" /> {/* green-800 */}
                                        </linearGradient>
                                        
                                        <linearGradient id={`yellowGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="rgb(161, 98, 7)" /> {/* yellow-700 */}
                                            <stop offset="50%" stopColor="rgb(202, 138, 4)" /> {/* yellow-600 */}
                                            <stop offset="100%" stopColor="rgb(161, 98, 7)" /> {/* yellow-700 */}
                                        </linearGradient>
                                        
                                        <linearGradient id={`redGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="rgb(153, 27, 27)" /> {/* red-800 */}
                                            <stop offset="50%" stopColor="rgb(185, 28, 28)" /> {/* red-700 */}
                                            <stop offset="100%" stopColor="rgb(153, 27, 27)" /> {/* red-800 */}
                                        </linearGradient>
                                    </defs>
                                    
                                    {/* Background fill */}
                                    <polygon 
                                        points="7,0 93,0 100,50 93,100 7,100 0,50" 
                                        fill={getGradientUrl(getBgColor(index), index)}
                                    />
                                    
                                    {/* Yellow border */}
                                    <polygon 
                                        points="7,0 93,0 100,50 93,100 7,100 0,50" 
                                        fill="none"
                                        stroke="#eab308" 
                                        strokeWidth="3" 
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>
                                
                                <div className="relative z-10 h-full flex items-center justify-center px-6 text-center md:text-lg text-sm">
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
                                                <span className="absolute left-6 font-bold text-lg">{optionLabels[index]}.</span>
                                                <span 
                                                    ref={el => optionRefs.current[index] = el}
                                                    className="w-full pl-12 pr-4 break-words whitespace-normal"
                                                >
                                                    {hiddenOptions.includes(index) ? "" : option}
                                                </span>
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    ))}
                    {
                        !(question?.options?.length > 0) && [1, 2, 3, 4].map((option, index) => (
                            <motion.div key={index} variants={optionItemVariants}>
                                <div
                                    onClick={() => handleOptionClick(index)}
                                    className={`border-4 relative z-10 h-[52px] border-yellow-300 rounded-full py-2 px-4 ${hiddenOptions.includes(index) ? 'opacity-30' : 'cursor-pointer'}`}
                                >
                                    {showOptions ? `${optionLabels[index]}. ${option}` : ""}
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