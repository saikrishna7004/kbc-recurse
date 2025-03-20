import React from 'react'
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { logoVariants } from '@/constants/animations';

const Logo = () => {

    return (
        <div className="flex flex-col items-center justify-center">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={logoVariants}
            >
                <Image className="mx-auto rounded-full mb-12" src="/logo.jpg" width={300} height={300} alt="Logo" />
            </motion.div>
            <motion.h1
                className="text-4xl font-bold text-yellow-400 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
            >
                Kaun Banega Codepati
            </motion.h1>
        </div>
    )
}

export default Logo
