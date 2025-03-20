import { motion } from "framer-motion";
import { fadeInVariants } from '@/constants/animations';

const Status = ({ prizeAmounts, questionNumber }) => {
    return (
        <div>
            <motion.div className="flex flex-col items-center justify-center" initial="hidden" animate="visible" variants={fadeInVariants}>
                <motion.h2 className="text-3xl font-bold text-yellow-400 mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    Status
                </motion.h2>
                <motion.div
                    className="border-4 border-yellow-300 rounded-lg p-4 bg-gradient-to-r from-[#03126F] via-[#053EAE] to-[#03126F] max-w-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                >
                    <div className="space-y-1">
                        {prizeAmounts.map((amount, index) => {
                            const isCurrentQuestion = index === (11 - questionNumber);
                            const isMilestone = index === 1 || index === 3;

                            return (
                                <motion.div
                                    key={index}
                                    className={`text-xl p-2 rounded ${isCurrentQuestion
                                        ? "bg-yellow-500 text-black font-bold border-2 border-white"
                                        : isMilestone
                                            ? "bg-yellow-600 border border-yellow-400"
                                            : ""
                                        }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        scale: isCurrentQuestion ? [1, 1.05, 1] : 1
                                    }}
                                    transition={{
                                        delay: 0.4 + (index * 0.08),
                                        scale: {
                                            repeat: Infinity,
                                            repeatType: "reverse",
                                            duration: 0.8
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-center gap-4 px-2">
                                        <span>{11 - index}</span>
                                        <span>{amount}</span>
                                    </div>
                                    {isCurrentQuestion &&
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white absolute -right-16 top-0 translate-y-[50%]" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                        </svg>
                                    }
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

export default Status
