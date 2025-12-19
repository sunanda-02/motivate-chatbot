
import React from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '../types';

// Simple Markdown-like renderer since we aren't using an external heavy lib for this basic demo
// but we want code blocks and bold text to work.
const formatContent = (content: string) => {
  if (!content) return null;
  
  // Basic escaping and line break handling
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  return lines.map((line, idx) => {
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const code = codeBuffer.join('\n');
        codeBuffer = [];
        return (
          <pre key={idx} className="bg-zinc-900 p-4 rounded-lg my-3 overflow-x-auto border border-zinc-800">
            <code className="text-sm font-mono text-emerald-400">{code}</code>
          </pre>
        );
      } else {
        inCodeBlock = true;
        return null;
      }
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return null;
    }

    // Handle bold
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <p key={idx} className="mb-2 leading-relaxed text-zinc-300 last:mb-0">
        {formattedLine.length > 0 ? formattedLine : <br />}
      </p>
    );
  }).filter(Boolean);
};

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group w-full py-8 ${isAssistant ? 'bg-zinc-900/30' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto px-4 flex gap-6">
        <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${
          isAssistant ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300'
        }`}>
          {isAssistant ? <Bot size={20} /> : <User size={20} />}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="prose prose-invert max-w-none">
            {formatContent(message.content)}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-zinc-500 animate-pulse vertical-middle" />
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCopy}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
