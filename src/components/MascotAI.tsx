"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function MascotAI() {
    const [message, setMessage] = useState("Chào cậu! Tớ là trợ lý AI ở đây.");

    const messages = [
        "Cậu đã sẵn sàng khám phá vũ trụ chưa?",
        "Mỗi hành tinh là một kiến thức mới, cùng bay nào!",
        "Tớ sẽ luôn đồng hành cùng cậu nha! ✨",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-8 right-8 z-50 flex items-end gap-3 pointer-events-none">
            {/* Speech Bubble */}
            <motion.div
                key={message}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-slate-900/80 backdrop-blur-md border border-neon-cyan/50 text-white text-sm px-4 py-3 rounded-2xl shadow-[0_0_15px_rgba(0,245,255,0.2)] mb-8 max-w-[200px]"
                style={{ borderBottomRightRadius: '4px' }}
            >
                <p>{message}</p>
            </motion.div>

            {/* Mascot Character */}
            <motion.div
                className="relative w-24 h-24 pointer-events-auto cursor-pointer"
                animate={{
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setMessage("Tớ ở đây! Cậu cần giúp gì không? 🤖")}
            >
                <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full" />

                {/* Robot body/head */}
                <div className="absolute inset-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl border-2 border-white/50 shadow-[0_0_20px_rgba(0,245,255,0.4)] flex flex-col items-center justify-center overflow-hidden">
                    {/* Eyes */}
                    <div className="flex gap-3 mb-2">
                        <motion.div
                            className="w-4 h-5 bg-white rounded-full shadow-[0_0_10px_white]"
                            animate={{ scaleY: [1, 0.1, 1], scaleX: [1, 1.2, 1] }}
                            transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                        />
                        <motion.div
                            className="w-4 h-5 bg-white rounded-full shadow-[0_0_10px_white]"
                            animate={{ scaleY: [1, 0.1, 1], scaleX: [1, 1.2, 1] }}
                            transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                        />
                    </div>
                    {/* Smile */}
                    <svg width="24" height="12" viewBox="0 0 24 12" className="mt-1">
                        <path d="M 4 2 Q 12 10 20 2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
            </motion.div>
        </div>
    );
}
