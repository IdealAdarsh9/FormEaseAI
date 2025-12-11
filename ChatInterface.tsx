import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, BotIcon, SparklesIcon, ArrowUpRightIcon } from './Icons';
import { askFormQuestion } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface Props {
  imageSrc: string;
}

const ChatInterface: React.FC<Props> = ({ imageSrc }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hi! I’ve analyzed your form. Do you have any specific questions about it? I can explain tricky terms or help you find where to sign.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    
    const newUserMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: userText 
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // Prepare history for API (excluding the current user message which is sent as prompt)
      const apiHistory = messages.map(m => ({ role: m.role, text: m.text }));
      
      const responseText = await askFormQuestion(imageSrc, userText, apiHistory);
      
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };
      
      setMessages(prev => [...prev, newAiMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel rounded-[2.5rem] overflow-hidden transition-all bg-white/90 dark:bg-slate-900/60 flex flex-col h-[500px] mt-8 shadow-2xl border border-white/40 dark:border-white/5 backdrop-blur-md">
      {/* Header */}
      <div className="bg-white/60 dark:bg-slate-800/40 px-6 py-4 border-b border-white/40 dark:border-white/5 backdrop-blur-md flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg text-white">
                <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white">AI Assistant</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Ask about this form</p>
            </div>
         </div>
         <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            Beta
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/30">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm relative text-sm md:text-base leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-gradient-to-br from-primary-500 to-blue-600 text-white rounded-tr-sm' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-2 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border-t border-white/40 dark:border-white/5">
        <div className="relative flex items-center gap-2">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                className="w-full pl-5 pr-14 py-4 rounded-full glass-input text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all shadow-inner bg-white/50 dark:bg-slate-900/50"
                disabled={isLoading}
            />
            <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-95"
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;