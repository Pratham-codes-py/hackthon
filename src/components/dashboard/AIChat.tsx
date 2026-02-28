"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface FootprintData {
    transport?: number;
    energy?: number;
    diet?: number;
    waste?: number;
    total?: number;
    previousTotal?: number;
}

const STORAGE_KEY = "aiChatHistory_v2";
const MAX_STORED = 40;

const QUICK_QUESTIONS = [
    "Where do I have the biggest carbon impact?",
    "How can I reduce my transport emissions?",
    "What are easy lifestyle habits to lower my footprint?",
    "How does my diet affect my carbon footprint?",
    "What if I cycle instead of driving?",
    "Tips to save energy at home?",
    "How do my daily habits compare to the Indian average?",
    "Give me one simple change I can make today.",
];

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-[#6BAA75]/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-[#6BAA75]" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[#6BAA75]"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function makeWelcome(footprint?: FootprintData): Message {
    return {
        role: "assistant",
        content: footprint?.total
            ? `Hi! 👋 I'm your EcoTrack AI assistant. I can see your total footprint is **${footprint.total.toFixed(1)} tons CO₂/year**. Ask me anything about your data, or how to reduce your impact!`
            : `Hi! 👋 I'm your EcoTrack AI assistant. Complete the footprint calculator and I'll give you personalized advice. Or ask me any general carbon footprint question!`,
    };
}

export default function AIChat({
    footprint,
    habitDescription,
}: {
    footprint?: FootprintData;
    habitDescription?: string;
}) {
    const [messages, setMessages] = useState<Message[]>([makeWelcome(footprint)]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const stored: Message[] = JSON.parse(raw);
                if (Array.isArray(stored) && stored.length > 0) {
                    setMessages([makeWelcome(footprint), ...stored]);
                }
            }
        } catch {
            // ignore parse errors
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist to localStorage
    useEffect(() => {
        try {
            const toStore = messages.slice(1).slice(-MAX_STORED);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        } catch {
            // quota exceeded or SSR
        }
    }, [messages]);

    // Auto-scroll
    useEffect(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, isLoading]);

    const sendMessage = useCallback(async (text?: string) => {
        const messageText = (text ?? input).trim();
        if (!messageText || isLoading) return;

        const userMsg: Message = { role: "user", content: messageText };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        const doFetch = () => fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: messageText,
                footprint,
                habitDescription,
                history: updatedMessages,
            }),
        });

        try {
            let res = await doFetch();
            let data = await res.json();

            // Auto-retry once on 429 — wait the time the server tells us
            if (res.status === 429 && data.retryAfter) {
                const waitSec = data.retryAfter as number;
                // Show countdown in typing indicator area via a temporary message
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `⏳ Gemini is busy — auto-retrying in ${waitSec}s…`,
                }]);
                await new Promise(r => setTimeout(r, waitSec * 1000));
                // Remove the temporary message and retry
                setMessages(prev => prev.slice(0, -1));
                res = await doFetch();
                data = await res.json();
            }

            const assistantMsg: Message = {
                role: "assistant",
                content: data.reply || "Sorry, I couldn't get a response. Please try again.",
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "Oops — something went wrong. Please try again! 🌱" },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    }, [input, isLoading, messages, footprint, habitDescription]);


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetChat = () => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        setMessages([makeWelcome(footprint)]);
    };

    const renderContent = (text: string) => {
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-[#0B3B2A]/5 to-[#6BAA75]/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#6BAA75]/15 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#6BAA75] dark:text-[#4CD964]" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">AI Carbon Coach</p>
                        <p className="text-xs text-muted-foreground">
                            Powered by Gemini 2.0 Flash
                            {habitDescription && (
                                <span className="ml-1.5 text-[#6BAA75]">· habit context active</span>
                            )}
                            {messages.length > 1 && (
                                <span className="ml-1.5 text-[#6BAA75]">
                                    · {messages.length - 1} message{messages.length > 2 ? "s" : ""}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetChat}
                    className="w-8 h-8 text-muted-foreground hover:text-foreground"
                    title="Reset chat & clear history"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex flex-col gap-3 p-4 h-80 overflow-y-auto">
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user"
                                    ? "bg-[#0B3B2A] dark:bg-[#4CD964]"
                                    : "bg-[#6BAA75]/20"
                                    }`}
                            >
                                {msg.role === "user" ? (
                                    <User className="w-4 h-4 text-white dark:text-[#0A1F18]" />
                                ) : (
                                    <Bot className="w-4 h-4 text-[#6BAA75]" />
                                )}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-[#0B3B2A] dark:bg-[#4CD964] text-white dark:text-[#0A1F18] rounded-br-sm"
                                    : "bg-muted text-foreground rounded-bl-sm"
                                    }`}
                            >
                                {renderContent(msg.content)}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <TypingIndicator />
                    </motion.div>
                )}
            </div>

            {/* Quick Questions (only on fresh chat) */}
            {messages.length <= 1 && !isLoading && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                        <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="text-xs px-3 py-1.5 rounded-full bg-[#6BAA75]/10 text-[#6BAA75] dark:text-[#4CD964] border border-[#6BAA75]/20 hover:bg-[#6BAA75]/20 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-1 border-t border-border flex gap-2 items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your carbon footprint..."
                    disabled={isLoading}
                    className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6BAA75]/40 placeholder:text-muted-foreground disabled:opacity-50 transition"
                />
                <Button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="w-10 h-10 rounded-xl bg-[#0B3B2A] dark:bg-[#4CD964] hover:bg-[#1A5C3C] dark:hover:bg-[#3bc454] text-white dark:text-[#0A1F18] flex-shrink-0"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
