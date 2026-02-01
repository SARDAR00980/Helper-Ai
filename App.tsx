
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Login } from './components/Login';
import { Message, ChatSession, ModelType, User } from './types';
import { GeminiService } from './services/geminiService';

const STORAGE_KEY = 'persona_ai_sessions';
const USER_KEY = 'persona_ai_user';

const DEV_INSTRUCTION = "You are Persona AI, a world-class senior software engineer and architect. Your goal is to provide highly efficient, secure, and clean code solutions. Always favor modern standards, explain architectural decisions when relevant, and proactively suggest improvements or identify potential edge cases. Use Markdown for all code blocks and structure your responses for readability.";

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-3-flash-preview');
  const [isDevMode, setIsDevMode] = useState(false);
  const geminiService = GeminiService.getInstance();

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [currentUser]);

  const currentSession = sessions.find(s => s.id === currentChatId);

  const createNewChat = useCallback(async () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      model: selectedModel,
      lastUpdated: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentChatId(newSession.id);
  }, [selectedModel]);

  const deleteChat = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentChatId === id) setCurrentChatId(null);
  }, [currentChatId]);

  const updateSessionMessages = (sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) return { ...s, messages, lastUpdated: Date.now() };
      return s;
    }));
  };

  const handleSendMessage = async (text: string, mode: 'chat' | 'image' = 'chat') => {
    let activeSessionId = currentChatId;
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: 'New Conversation',
        messages: [],
        model: selectedModel,
        lastUpdated: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentChatId(newSession.id);
      activeSessionId = newSession.id;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: mode === 'image' ? `Generate image: ${text}` : text,
      timestamp: Date.now(),
    };

    const currentSess = sessions.find(s => s.id === activeSessionId) || {
      id: activeSessionId,
      messages: [],
      model: selectedModel
    };
    
    const updatedMessages = [...(currentSess.messages || []), userMsg];
    updateSessionMessages(activeSessionId, updatedMessages);

    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: mode === 'image' ? 'Synthesizing your visual...' : '',
      timestamp: Date.now(),
    };
    
    updateSessionMessages(activeSessionId, [...updatedMessages, aiMsg]);

    try {
      if (mode === 'image') {
        const result = await geminiService.generateImage(text);
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            const newMsgs = [...s.messages];
            const idx = newMsgs.findIndex(m => m.id === aiMsgId);
            if (idx !== -1) {
              newMsgs[idx] = { 
                ...newMsgs[idx], 
                content: result.text || "Here is your generated image.",
                imageData: result.imageData 
              };
            }
            return { ...s, messages: newMsgs };
          }
          return s;
        }));
      } else {
        let fullAiResponse = "";
        const instruction = isDevMode ? DEV_INSTRUCTION : undefined;
        const stream = geminiService.streamChat(
          selectedModel,
          currentSess.messages || [],
          text,
          instruction
        );

        for await (const chunk of stream) {
          fullAiResponse += chunk;
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const newMsgs = [...s.messages];
              const idx = newMsgs.findIndex(m => m.id === aiMsgId);
              if (idx !== -1) newMsgs[idx] = { ...newMsgs[idx], content: fullAiResponse };
              return { ...s, messages: newMsgs };
            }
            return s;
          }));
        }
      }

      if (updatedMessages.length === 1) {
        const title = await geminiService.generateTitle(text);
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s));
      }
    } catch (error) {
      console.error("API error", error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentChatId(null);
    setSessions([]);
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  const modelLabel = selectedModel === 'gemini-3-flash-preview' ? 'Flash 3' : 'Pro 3';

  return (
    <div className="flex h-screen bg-[#0b0d0e] text-gray-100 overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentChatId={currentChatId}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onSelectChat={setCurrentChatId}
        onDeleteChat={deleteChat}
        onNewChat={createNewChat}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-[#2d2d2d] bg-[#0b0d0e]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-[#1a1c1e] rounded-md transition-colors shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm md:text-base font-semibold truncate text-gray-100">
                {currentSession?.title || `Persona AI • ${modelLabel}`}
              </h1>
              {!currentSession && <span className="text-[10px] text-gray-500 font-medium tracking-wide">READY TO ASSIST</span>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDevMode(!isDevMode)}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isDevMode ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'border-[#2d2d2d] text-gray-500 hover:text-gray-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              DEV MODE
            </button>
            <div className="hidden md:flex bg-[#1a1c1e] p-1 rounded-lg border border-[#2d2d2d]">
              <button onClick={() => setSelectedModel('gemini-3-flash-preview')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider ${selectedModel === 'gemini-3-flash-preview' ? 'bg-[#374151] text-white' : 'text-gray-500 hover:text-gray-300'}`}>Flash</button>
              <button onClick={() => setSelectedModel('gemini-3-pro-preview')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider ${selectedModel === 'gemini-3-pro-preview' ? 'bg-[#374151] text-white' : 'text-gray-500 hover:text-gray-300'}`}>Pro</button>
            </div>
          </div>
        </header>
        <ChatWindow messages={currentSession?.messages || []} onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
};

export default App;
