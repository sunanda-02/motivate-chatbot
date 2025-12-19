
import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, PanelLeftClose } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession 
}) => {
  return (
    <aside className="w-[260px] h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-md border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-200 group"
        >
          <Plus size={16} className="text-zinc-400 group-hover:text-white" />
          New Chat
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <PanelLeftClose size={14} className="text-zinc-500" />
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="text-[10px] font-bold text-zinc-500 px-3 py-2 uppercase tracking-wider">
          Recent Conversations
        </div>
        {sessions.length === 0 ? (
          <div className="px-3 py-4 text-xs text-zinc-600 italic">No recent chats</div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className={`group flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer text-sm transition-all ${
                activeSessionId === session.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate flex-1">{session.title || 'Untitled Chat'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 text-sm text-zinc-400 cursor-not-allowed">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <UserIcon />
          </div>
          <span className="font-medium truncate">Premium User</span>
        </div>
      </div>
    </aside>
  );
};

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default Sidebar;
