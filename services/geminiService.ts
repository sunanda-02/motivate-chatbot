
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private static instance: GeminiService;

  private constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not defined in the environment");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async *streamChat(history: Message[], message: string) {
    const chat = this.ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are a helpful, brilliant AI assistant similar to ChatGPT. You provide concise, accurate, and conversational responses. Format your output using Markdown. If you use code blocks, specify the language.",
      }
    });

    // Convert history for the Gemini API
    // Gemini's history excludes the current message we are about to send
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Actually, we manage history ourselves in the state, so for a specific stream call, 
    // we can either initialize chat with history or just send the message.
    // Given our UI, it's easier to use history.
    
    const streamResponse = await chat.sendMessageStream({ message });
    
    for await (const chunk of streamResponse) {
      const response = chunk as GenerateContentResponse;
      yield response.text;
    }
  }
}
