import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Mic } from "lucide-react";
import bot from '../../../assets/bot.png';
import user from '../../../assets/user.png';

const initialMessages = [
  {
    role: "system",
    avatar: bot,
    content:
      "You are a helpful assistant for our medical booking appointment website. You can answer any questions about medical appointments, services, doctors, or booking procedures. If the question is unrelated, respond with 'sorry'.",
  },
  {
    id: 1,
    role: "bot",
    avatar: bot,
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const recognition = useRef<SpeechRecognition | null>(null);
  const speechRecognitionAPI =
    window.SpeechRecognition || (window as any).webkitSpeechRecognition;

  useEffect(() => {
    if (speechRecognitionAPI) {
      recognition.current = new speechRecognitionAPI();
      recognition.current.lang = "en-US";
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInput(transcript);
      };
    }
  }, []);

  const startListening = () => recognition.current?.start();
  const stopListening = () => recognition.current?.stop();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      avatar: user,
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
        avatar: bot,
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
          avatar: bot,
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
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-100 p-4 shadow-lg text-blue-700"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MessageCircle size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 right-4 z-50 w-80 max-h-[75vh] flex flex-col rounded-2xl bg-white/90 shadow-2xl overflow-hidden sm:w-96"
          >
            <div className="p-4 font-semibold bg-white/70 flex items-center justify-between">
              <span>Medical Booking Assistant</span>
              <button onClick={() => setIsOpen(false)} className="text-xl font-bold">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => <Message key={idx} {...msg} />)}
              {isTyping && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-3 bg-white/70"
            >
              <div className="flex items-center gap-2">
                <textarea
                  className="flex-1 resize-none rounded-xl border bg-white px-3 py-2 text-sm shadow-inner focus:ring-2 focus:ring-blue-200"
                  rows={1}
                  value={input}
                  placeholder="Ask about appointments..."
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button type="submit" disabled={!input.trim()} className="rounded-full p-2 disabled:opacity-50">
                  <Send size={18} className="text-blue-700" />
                </button>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`rounded-full p-2 ${isListening ? 'bg-red-400' : 'bg-green-400'}`}
                >
                  <Mic size={18} className="text-white" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Message({ role, avatar, content }: { role: string; avatar: string; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <img src={avatar} alt="bot" className="mr-2 h-8 w-8 rounded-full" />}
      <div className={`px-4 py-2 rounded-2xl text-sm shadow max-w-[75%] ${isUser ? 'bg-blue-100 text-blue-700 rounded-br-none' : 'bg-white/80 text-gray-800 rounded-bl-none'}`}>
        {content}
      </div>
      {isUser && <img src={avatar} alt="user" className="ml-2 h-8 w-8 rounded-full" />}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 pl-10">
      <span className="h-2 w-2 animate-bounce bg-blue-300 rounded-full [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce bg-blue-300 rounded-full [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce bg-blue-300 rounded-full" />
    </div>
  );
}
