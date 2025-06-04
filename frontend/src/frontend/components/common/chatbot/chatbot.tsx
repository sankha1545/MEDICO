// File: src/components/ChatbotUI.tsx

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Mic, X } from "lucide-react";
import botAvatar from "../../../assets/bot.png";
import userAvatar from "../../../assets/user.png";

const initialMessages = [
  {
    role: "system",
    avatar: botAvatar,
    content:
      "You are a helpful assistant for our medical booking appointment website. You can answer any questions about medical appointments, services, doctors, or booking procedures. If the question is unrelated, respond with 'sorry'.",
  },
  {
    id: 1,
    role: "bot",
    avatar: botAvatar,
    content: "Hi there! How can I assist you with your medical appointment today?",
  },
];

export default function ChatbotUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keep speech recognition instance
  const recognition = useRef<SpeechRecognition | null>(null);
  const speechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initialize speech recognition
  useEffect(() => {
    if (speechRecognitionAPI) {
      recognition.current = new speechRecognitionAPI();
      recognition.current.lang = "en-US";
      recognition.current.continuous = false;
      recognition.current.interimResults = false;

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
    }
  }, []);

  const startListening = () => {
    if (recognition.current && !isListening) {
      recognition.current.start();
    }
  };
  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      avatar: userAvatar,
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const payload = {
      messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
    };

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        avatar: botAvatar,
        content: data.answer,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          avatar: botAvatar,
          content: "Sorry, I couldn't fetch an answer right now.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-4 shadow-xl text-white"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle Chatbot"
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 z-50 flex h-[75vh] w-80 max-w-full flex-col rounded-2xl bg-white/30 shadow-2xl backdrop-blur-lg sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-3 text-white shadow-md">
              <div className="flex items-center space-x-2">
                <img src={botAvatar} alt="Bot Avatar" className="h-8 w-8 rounded-full border-2 border-white" />
                <h2 className="text-lg font-semibold drop-shadow-sm">
                  Medical Booking Assistant
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close Chatbot"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} {...msg} />
              ))}
              {isTyping && <TypingDots />}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="rounded-b-2xl bg-white/70 px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-2">
                <textarea
                  className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 "
                  rows={1}
                  value={input}
                  placeholder="Ask about appointments..."
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{color:"#000"}}
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  aria-label={isListening ? "Stop Listening" : "Start Listening"}
                  className={`flex items-center justify-center rounded-full p-2 ${
                    isListening ? "bg-red-500" : "bg-green-500"
                  } shadow-lg transition-colors duration-200 hover:opacity-90`}
                >
                  <Mic size={18} className="text-white" />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 shadow-lg disabled:opacity-50 transition-transform duration-200 hover:scale-105"
                  aria-label="Send Message"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Chat Bubble Component
function MessageBubble({
  role,
  avatar,
  content,
}: {
  role: string;
  avatar: string;
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div
      className={`flex items-end ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <img
          src={avatar}
          alt="bot-avatar"
          className="mr-2 h-8 w-8 rounded-full border border-gray-200 shadow-sm"
        />
      )}
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${
          isUser
            ? "bg-gradient-to-tr from-blue-400 to-indigo-500 text-white rounded-br-none"
            : "bg-white/80 text-gray-800 rounded-bl-none"
        }`}
      >
        {content}
      </div>
      {isUser && (
        <img
          src={avatar}
          alt="user-avatar"
          className="ml-2 h-8 w-8 rounded-full border border-gray-200 shadow-sm"
        />
      )}
    </div>
  );
}

// Typing Indicator Component
function TypingDots() {
  return (
    <div className="flex items-center space-x-1 pl-10">
      <motion.span
        className="h-2 w-2 rounded-full bg-indigo-400"
        animate={{ y: ["0%", "-50%", "0%"] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-indigo-400"
        animate={{ y: ["0%", "-50%", "0%"] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-indigo-400"
        animate={{ y: ["0%", "-50%", "0%"] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
      />
    </div>
  );
}
