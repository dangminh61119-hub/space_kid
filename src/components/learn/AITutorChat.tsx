"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─── */
interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

interface AITutorChatProps {
    studentContext: {
        name: string;
        grade: number;
        profileContext: string;
        currentSubject?: string;
    };
    suggestedTopics?: string[];
    onSessionEnd?: (messageCount: number) => void;
}

/* ─── Component ─── */
export default function AITutorChat({ studentContext, suggestedTopics, onSessionEnd }: AITutorChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    }, []);

    const sendMessage = useCallback(async (text?: string) => {
        const messageText = (text || input).trim();
        if (!messageText || isLoading) return;

        setInput("");
        setError(null);
        if (inputRef.current) inputRef.current.style.height = "auto";

        const userMsg: ChatMessage = { role: "user", content: messageText, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/study", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    studentContext,
                }),
            });

            if (!res.ok) throw new Error("API error");

            const data = await res.json();
            const assistantMsg: ChatMessage = {
                role: "assistant",
                content: data.response || "Cú Mèo đang suy nghĩ... 🤔",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            console.error("AI Tutor error:", err);
            setError("Không thể kết nối Cú Mèo. Thử lại nhé!");
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Oops! Cú Mèo bị mất tín hiệu vũ trụ! Thử lại nhé bạn! 🦉💫",
                timestamp: Date.now(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, studentContext]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }, [sendMessage]);

    return (
        <div className="tutor-chat">
            {/* Messages area */}
            <div className="tutor-messages">
                {/* Welcome message */}
                {messages.length === 0 && (
                    <motion.div
                        className="tutor-welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="tutor-welcome-owl">🦉</div>
                        <h3 className="tutor-welcome-title">Chào {studentContext.name}!</h3>
                        <p className="tutor-welcome-text">
                            Cú Mèo sẵn sàng giúp bạn học bài. Hãy hỏi bất cứ điều gì nhé!
                        </p>

                        {/* Suggested topics */}
                        {suggestedTopics && suggestedTopics.length > 0 && (
                            <div className="tutor-suggestions">
                                <p className="tutor-suggestions-label">💡 Gợi ý hỏi:</p>
                                <div className="tutor-suggestions-list">
                                    {suggestedTopics.map((topic, i) => (
                                        <motion.button
                                            key={i}
                                            className="tutor-suggestion-btn"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => sendMessage(topic)}
                                        >
                                            {topic}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Chat messages */}
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            className={`tutor-msg ${msg.role === "user" ? "tutor-msg-user" : "tutor-msg-owl"}`}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {msg.role === "assistant" && (
                                <div className="tutor-msg-avatar">🦉</div>
                            )}
                            <div className={`tutor-msg-bubble ${msg.role === "user" ? "tutor-bubble-user" : "tutor-bubble-owl"}`}>
                                <p className="tutor-msg-text">{msg.content}</p>
                            </div>
                            {msg.role === "user" && (
                                <div className="tutor-msg-avatar">
                                    {studentContext.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                    <motion.div
                        className="tutor-msg tutor-msg-owl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="tutor-msg-avatar">🦉</div>
                        <div className="tutor-bubble-owl tutor-typing">
                            <span className="tutor-dot" />
                            <span className="tutor-dot" />
                            <span className="tutor-dot" />
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="tutor-input-area">
                {error && (
                    <p className="tutor-error">{error}</p>
                )}
                <div className="tutor-input-row">
                    <textarea
                        ref={inputRef}
                        className="tutor-input"
                        placeholder="Hỏi Cú Mèo bất cứ điều gì..."
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isLoading}
                    />
                    <motion.button
                        className="tutor-send-btn"
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span>🚀</span>
                    </motion.button>
                </div>
                <p className="tutor-hint">
                    Enter để gửi • Shift+Enter để xuống dòng
                </p>
            </div>

            <style jsx>{`
        .tutor-chat {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 160px);
          max-height: 700px;
          background: var(--learn-card);
          border: 1px solid var(--learn-border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(99,102,241,0.06);
        }

        /* Messages */
        .tutor-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Welcome */
        .tutor-welcome {
          text-align: center;
          padding: 32px 16px;
        }
        .tutor-welcome-owl {
          font-size: 56px;
          margin-bottom: 12px;
        }
        .tutor-welcome-title {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 800;
          color: var(--learn-text);
          margin-bottom: 6px;
        }
        .tutor-welcome-text {
          font-size: 14px;
          color: var(--learn-text-secondary);
          margin-bottom: 20px;
        }

        .tutor-suggestions { margin-top: 8px; }
        .tutor-suggestions-label {
          font-size: 13px;
          color: var(--learn-text-secondary);
          margin-bottom: 8px;
          font-weight: 600;
        }
        .tutor-suggestions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }
        .tutor-suggestion-btn {
          padding: 8px 14px;
          border-radius: 12px;
          border: 1px solid var(--learn-border);
          background: var(--learn-bg);
          color: var(--learn-text);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tutor-suggestion-btn:hover {
          border-color: var(--learn-accent);
          background: var(--learn-bg-alt);
        }

        /* Messages */
        .tutor-msg {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .tutor-msg-user {
          justify-content: flex-end;
        }
        .tutor-msg-owl {
          justify-content: flex-start;
        }

        .tutor-msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          background: var(--learn-bg-alt);
          font-weight: 800;
          font-size: 14px;
          color: var(--learn-accent);
        }

        .tutor-msg-bubble {
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 18px;
          line-height: 1.5;
        }
        .tutor-bubble-user {
          background: var(--learn-accent);
          color: white;
          border-bottom-right-radius: 6px;
        }
        .tutor-bubble-owl {
          background: var(--learn-bg);
          color: var(--learn-text);
          border: 1px solid var(--learn-border);
          border-bottom-left-radius: 6px;
        }
        .tutor-msg-text {
          font-size: 14px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Typing indicator */
        .tutor-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 14px 18px;
        }
        .tutor-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--learn-accent-light);
          animation: dotBounce 1.4s ease-in-out infinite;
        }
        .tutor-dot:nth-child(2) { animation-delay: 0.2s; }
        .tutor-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Input */
        .tutor-input-area {
          padding: 12px 16px;
          border-top: 1px solid var(--learn-border);
          background: var(--learn-card);
        }
        .tutor-error {
          font-size: 12px;
          color: var(--learn-error);
          margin-bottom: 8px;
        }
        .tutor-input-row {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        .tutor-input {
          flex: 1;
          border: 1px solid var(--learn-border);
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: var(--font-body);
          resize: none;
          outline: none;
          background: var(--learn-bg);
          color: var(--learn-text);
          transition: border-color 0.2s;
          max-height: 120px;
        }
        .tutor-input:focus { border-color: var(--learn-accent); }
        .tutor-input::placeholder { color: var(--learn-text-secondary); }
        .tutor-input:disabled { opacity: 0.6; }

        .tutor-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--learn-accent);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .tutor-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .tutor-send-btn:not(:disabled):hover {
          background: #4F46E5;
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }

        .tutor-hint {
          font-size: 11px;
          color: var(--learn-text-secondary);
          text-align: center;
          margin-top: 6px;
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .tutor-chat { height: calc(100vh - 200px); border-radius: 16px; }
          .tutor-msg-bubble { max-width: 85%; }
          .tutor-welcome { padding: 20px 12px; }
        }
      `}</style>
        </div>
    );
}
