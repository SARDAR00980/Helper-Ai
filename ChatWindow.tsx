
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, mode?: 'chat' | 'image') => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b0d0e]">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pt-10">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-500 animate-pulse">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                <p className="text-gray-400 max-w-sm">
                  Welcome to <b>Persona AI</b>. I can chat, write code, and generate stunning images using Gemini.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                {[
                  { text: "Help me write a Python script", mode: 'chat' as const },
                  { text: "Generate image of a futuristic city", mode: 'image' as const },
                  { text: "Write a creative short story", mode: 'chat' as const },
                  { text: "Generate image of a cat in space", mode: 'image' as const }
                ].map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => onSendMessage(prompt.text, prompt.mode)}
                    className="p-4 text-left border border-[#2d2d2d] rounded-xl hover:bg-[#1a1c1e] transition-all text-sm text-gray-300 hover:border-indigo-500/50 flex items-center justify-between group"
                  >
                    <span>{prompt.text}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-indigo-400">
                      {prompt.mode === 'image' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-[#0b0d0e]/95 backdrop-blur-md pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={onSendMessage} />
          <p className="text-[10px] md:text-xs text-center text-gray-500 mt-3">
            Persona AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
};
