// File: src/types/chat.d.ts

export interface ChatMessage {
  role: "system" | "user" | "bot";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
}
