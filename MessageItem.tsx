
import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { shadesOfPurple as theme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../types';
import { GeminiService } from '../services/geminiService';

interface MessageItemProps {
  message: Message;
}

// Global reference to stop current playback when a new one starts
let activeSource: AudioBufferSourceNode | null = null;

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const code = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-[#2d2d2d] bg-[#0b0d0e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1c1e] border-b border-[#2d2d2d]">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{match[1]}</span>
        <button 
          onClick={copyToClipboard}
          className="text-gray-500 hover:text-indigo-400 transition-colors"
        >
          {copied ? (
            <span className="text-[10px] text-green-500 font-bold">COPIED!</span>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 8h3m-3-3h3m-3-3h3" />
            </svg>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        {...props}
        style={theme}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: 'transparent',
          padding: '1rem',
          fontSize: '0.875rem',
        }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const geminiService = GeminiService.getInstance();

  const playNarration = async () => {
    if (isPlaying) {
      activeSource?.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setIsSynthesizing(true);
      const audioBase64 = await geminiService.generateSpeech(message.content);
      setIsSynthesizing(false);

      if (!audioBase64) return;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const bytes = decodeBase64(audioBase64);
      const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);

      // Stop any existing playback
      if (activeSource) {
        try { activeSource.stop(); } catch(e) {}
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        if (activeSource === source) activeSource = null;
      };

      activeSource = source;
      source.start();
      setIsPlaying(true);
    } catch (error) {
      console.error("Speech Error:", error);
      setIsSynthesizing(false);
      setIsPlaying(false);
    }
  };

  const downloadImage = () => {
    if (!message.imageData) return;
    const link = document.createElement('a');
    link.href = message.imageData;
    link.download = `persona-gen-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className={`flex gap-4 mb-8 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isUser ? 'bg-indigo-600' : 'bg-gray-800'
      }`}>
        {isUser ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        ) : (
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        )}
      </div>

      <div className={`flex flex-col max-w-[85%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`group relative px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-[#1a1c1e] text-gray-200 border border-[#2d2d2d] rounded-tl-none prose prose-invert max-w-none'
        }`}>
          {!isUser && !message.imageData && (
            <button 
              onClick={playNarration}
              disabled={isSynthesizing}
              className={`absolute -right-10 top-0 p-2 rounded-lg transition-all ${
                isPlaying ? 'text-indigo-400 scale-110' : 'text-gray-600 hover:text-indigo-400'
              } ${isSynthesizing ? 'animate-pulse cursor-wait' : ''}`}
              title="Narrate response"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          )}

          {message.imageData ? (
            <div className="space-y-3">
              <div className="relative group">
                <img src={message.imageData} alt="AI Generated" className="rounded-lg w-full max-w-sm shadow-lg cursor-zoom-in" />
                <button onClick={downloadImage} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
              </div>
              {message.content && <p className="italic text-gray-400 text-sm">{message.content}</p>}
            </div>
          ) : (
            isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock
                }}
              >
                {message.content || '...'}
              </ReactMarkdown>
            )
          )}
        </div>
        <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
