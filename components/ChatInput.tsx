
import React, { useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = React.useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  return (
    <div className="relative flex items-end gap-2 bg-zinc-800/50 border border-zinc-700 rounded-xl p-2 pl-4 shadow-xl focus-within:border-zinc-500 transition-all duration-200">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Gemini..."
        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 py-2 resize-none max-h-[200px] outline-none"
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className={`p-2 rounded-lg transition-all duration-200 ${
          text.trim() && !disabled 
            ? 'bg-white text-black hover:bg-zinc-200' 
            : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
        }`}
      >
        <SendHorizontal size={20} />
      </button>
    </div>
  );
};

export default ChatInput;
