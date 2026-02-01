
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ChatInputProps {
  onSend: (text: string, mode?: 'chat' | 'image') => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setText(prev => (prev.trim() + ' ' + finalTranscript).trim());
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim()) {
      onSend(text.trim(), mode);
      setText('');
      setMode('chat');
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`relative flex items-end gap-2 p-2 bg-[#1a1c1e] border rounded-2xl shadow-2xl transition-all duration-300 ${
        mode === 'image' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-[#2d2d2d] focus-within:border-indigo-500/50'
      }`}
    >
      <div className="flex items-center gap-1">
        <button 
          type="button"
          onClick={() => setMode(mode === 'chat' ? 'image' : 'chat')}
          className={`p-2 rounded-xl transition-all shrink-0 ${
            mode === 'image' ? 'bg-indigo-600 text-white' : 'hover:bg-[#2d2d2d] text-gray-400'
          }`}
          title={mode === 'image' ? "Switch to Chat" : "Switch to Image Generation"}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </button>

        <button 
          type="button"
          onClick={toggleListening}
          className={`p-2 rounded-xl transition-all shrink-0 ${
            isListening 
              ? 'bg-red-500/10 text-red-500 animate-pulse' 
              : 'hover:bg-[#2d2d2d] text-gray-400'
          }`}
          title={isListening ? "Stop listening" : "Start voice-to-text"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={mode === 'image' ? "Describe the image you want..." : (isListening ? "Listening..." : "Message Persona AI...")}
        className="flex-1 bg-transparent border-none focus:ring-0 text-white resize-none py-2.5 max-h-[200px] text-sm md:text-base scrollbar-hide"
      />

      <button
        type="submit"
        disabled={!text.trim()}
        className={`p-2 rounded-xl transition-all shrink-0 ${
          text.trim() 
            ? 'bg-indigo-600 text-white shadow-lg active:scale-90' 
            : 'bg-[#2d2d2d] text-gray-500 cursor-not-allowed'
        }`}
      >
        <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
};
