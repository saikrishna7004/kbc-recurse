import { motion } from "framer-motion";
import Image from 'next/image';
import { fadeInVariants } from '@/constants/animations';

const Lifeline = ({
    specificLifeline,
    lifelineStatus,
    icons
}) => {
    return (
        <div>
            <motion.div
                className="flex flex-col items-center justify-center mb-12"
                initial="hidden"
                animate="visible"
                variants={fadeInVariants}
            >
                <motion.h2
                    className="text-3xl font-bold text-yellow-400 mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {specificLifeline || "Lifelines"}
                </motion.h2>
                <div className="flex gap-8 relative">
                    {specificLifeline ? (
                        <motion.div
                            className="flex flex-col items-center justify-center relative"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            transition={{ duration: 0.7 }}
                        >
                            <Image
                                className="w-64 h-auto"
                                src={icons[specificLifeline]}
                                width={200}
                                height={200}
                                alt={specificLifeline}
                            />
                            <h3 className="text-xl font-bold text-yellow-300 mt-4">{specificLifeline}</h3>
                        </motion.div>
                    ) : (
                        Object.entries(icons).map(([key, icon], index) => {
                            const isUsed = lifelineStatus[key];

                            return (
                                <motion.div
                                    key={key}
                                    className={`flex flex-col items-center justify-center relative ${isUsed ? "!opacity-70" : "cursor-pointer"}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.2, duration: 0.5 }}
                                >
                                    <Image className="w-32 h-auto" src={icon} width={100} height={100} alt={key} />
                                    {isUsed && (
                                        <Image
                                            className="w-32 h-32 absolute top-0 -mt-4"
                                            src="/cross.png"
                                            width={100}
                                            height={100}
                                            alt="Cross"
                                            style={{ opacity: 0.8 }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default Lifeline
