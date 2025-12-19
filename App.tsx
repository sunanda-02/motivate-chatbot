
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, ChatSession } from './types';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { GeminiService } from './services/geminiService';
import { Bot, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'gemini_chat_sessions';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Initialize data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, isStreaming]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeSessionId]);

  const handleSend = async (content: string) => {
    if (!activeSessionId && !sessions.length) {
      // If no session exists, create one first
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: content.slice(0, 30) + '...',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      // Wait for state to settle? No, we can just use the new session ID directly
      await processMessage(newSession.id, content, []);
    } else if (activeSessionId) {
      await processMessage(activeSessionId, content, activeSession?.messages || []);
    }
  };

  const processMessage = async (sessionId: string, content: string, history: Message[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantPlaceholder: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Add user message and assistant placeholder to UI
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const isFirstMessage = s.messages.length === 0;
        return {
          ...s,
          title: isFirstMessage ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : s.title,
          messages: [...s.messages, userMessage, assistantPlaceholder],
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    setIsStreaming(true);

    try {
      const gemini = GeminiService.getInstance();
      let fullContent = '';
      
      const stream = gemini.streamChat(history, content);
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            const newMessages = [...s.messages];
            const lastIdx = newMessages.length - 1;
            newMessages[lastIdx] = { ...newMessages[lastIdx], content: fullContent };
            return { ...s, messages: newMessages };
          }
          return s;
        }));
      }

      // Mark as finished streaming
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          const newMessages = [...s.messages];
          const lastIdx = newMessages.length - 1;
          newMessages[lastIdx] = { ...newMessages[lastIdx], isStreaming: false };
          return { ...s, messages: newMessages };
        }
        return s;
      }));
    } catch (error) {
      console.error("Chat error:", error);
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          const newMessages = [...s.messages];
          const lastIdx = newMessages.length - 1;
          newMessages[lastIdx] = { 
            ...newMessages[lastIdx], 
            content: "Sorry, I encountered an error while processing your request. Please try again.",
            isStreaming: false 
          };
          return { ...s, messages: newMessages };
        }
        return s;
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-zinc-200 overflow-hidden">
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      <main className="flex-1 flex flex-col relative h-full">
        {/* Header - Fixed */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/50 bg-[#0d0d0d]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Gemini 3 Pro</span>
              <Sparkles size={12} className="text-emerald-500" />
            </div>
          </div>
          <div className="text-sm font-medium text-zinc-400">
            {activeSession?.title || 'Gemini Chat'}
          </div>
          <div className="w-[100px]" /> {/* Spacer for balance */}
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto pt-4 pb-32">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-emerald-600/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20">
                <Bot size={40} className="text-emerald-500" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">How can I help you today?</h1>
              <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
                Powered by Google Gemini 3 Pro. Ask me anything from complex coding tasks to creative writing or deep analysis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 max-w-2xl w-full">
                <QuickAction 
                  title="Optimize my code" 
                  desc="Paste a snippet to get improvements" 
                  onClick={() => handleSend("Can you help me optimize this code snippet for better performance and readability?")}
                />
                <QuickAction 
                  title="Explain a concept" 
                  desc="Simplify quantum physics or baking" 
                  onClick={() => handleSend("Explain quantum entanglement to me as if I'm a five-year-old.")}
                />
                <QuickAction 
                  title="Write an email" 
                  desc="Draft professional correspondence" 
                  onClick={() => handleSend("Draft a polite but firm follow-up email to a recruiter regarding a job application.")}
                />
                <QuickAction 
                  title="Brainstorm ideas" 
                  desc="Creative concepts for your project" 
                  onClick={() => handleSend("Brainstorm 5 unique startup ideas involving sustainable energy and AI.")}
                />
              </div>
            </div>
          ) : (
            <div className="w-full">
              {activeSession.messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={scrollAnchorRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Bar - Fixed Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent pt-12">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
            <p className="text-[10px] text-zinc-500 mt-3 text-center uppercase tracking-widest">
              Gemini can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  desc: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, desc, onClick }) => (
  <button 
    onClick={onClick}
    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group"
  >
    <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{title}</div>
    <div className="text-xs text-zinc-500 mt-1">{desc}</div>
  </button>
);

export default App;
