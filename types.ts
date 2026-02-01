
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string; // Base64 image data
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  lastUpdated: number;
}

export type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface AppState {
  currentChatId: string | null;
  sessions: ChatSession[];
  isSidebarOpen: boolean;
  selectedModel: ModelType;
  currentUser: User | null;
}
