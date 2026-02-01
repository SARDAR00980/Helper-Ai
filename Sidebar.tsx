
import React, { useState } from 'react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentChatId: string | null;
  currentUser: User | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentChatId,
  currentUser,
  isOpen,
  setIsOpen,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-20 md:hidden"
        onClick={() => setIsOpen(false)}
      />
      <aside className="w-[280px] bg-[#1a1c1e] flex flex-col h-full border-r border-[#2d2d2d] fixed md:relative z-30 transition-transform">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl px-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">P</div>
              <span>Persona AI</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-[#2d2d2d] rounded-md transition-colors md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg active:scale-95 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0d0e] border border-[#2d2d2d] rounded-xl pl-10 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500 text-sm">
              {searchQuery ? 'No chats match your search' : 'No conversations yet'}
            </div>
          ) : (
            filteredSessions.map(session => (
              <div 
                key={session.id}
                className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                  currentChatId === session.id 
                    ? 'bg-[#2d2d2d] text-white' 
                    : 'text-gray-400 hover:bg-[#252729] hover:text-gray-200'
                }`}
                onClick={() => {
                  onSelectChat(session.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="flex-1 truncate text-sm font-medium">
                  {session.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#2d2d2d] bg-[#1a1c1e]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2d2d2d] transition-colors group relative">
            <img 
              src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
              className="w-9 h-9 rounded-full bg-gray-700 object-cover border border-[#3d3d3d]"
              alt="User"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{currentUser?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'user@persona.ai'}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-gray-500 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
