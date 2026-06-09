import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Sparkles, Smile } from 'lucide-react';
import { dbService } from '../firebase';
import { ChatSession } from '../types';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch the customer sessionId
  useEffect(() => {
    let sid = localStorage.getItem('hb_chat_session_id');
    if (!sid) {
      sid = 'customer-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('hb_chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Listen to Firestore or mock dynamic messages once sessionId is ready
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = dbService.subscribeToChat(sessionId, (session: ChatSession | null) => {
      if (session) {
        setMessages(session.messages || []);
      } else {
        setMessages([
          {
            sender: 'admin',
            text: 'Hello there! 👋 Welcome to Hello Beautiful! How can we assist you with beauty recommendations or order queries today?',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !sessionId) return;

    const textToSend = messageText.trim();
    setMessageText('');

    // Pre-insert message immediately into local display for dynamic real-time responsiveness
    setMessages(prev => [...prev, {
      sender: 'customer',
      text: textToSend,
      timestamp: new Date().toISOString()
    }]);

    try {
      await dbService.sendMessage(sessionId, 'customer', textToSend);
    } catch (err) {
      console.error('Failed sending chat message: ', err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="toggle-chat-widget-btn"
          className="flex items-center gap-2 px-5 py-4 bg-brand-sage hover:bg-brand-sage/90 text-brand-warm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 scale-100 hover:scale-105 cursor-pointer border border-brand-sand"
        >
          <MessageSquare className="w-5 h-5 animate-pulse text-brand-peach" />
          <span>Chat Assistance</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div 
          id="chat-help-window"
          className="bg-white w-80 sm:w-96 h-[460px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-brand-sand animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <div className="bg-brand-sage text-brand-warm p-4 flex justify-between items-center border-b border-brand-sand">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <Sparkles className="w-5 h-5 text-brand-peach" />
              </div>
              <div className="text-left">
                <h4 className="font-serif font-bold text-sm tracking-tight text-brand-warm">Beautiful Concierge</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-brand-warm/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white animate-pulse"></span>
                  Online assistance
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              id="close-chat-widget-btn"
              className="text-brand-warm/80 hover:text-brand-warm p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-warm/20">
            {messages.map((msg, index) => {
              const isAdminMsg = msg.sender === 'admin';
              return (
                <div
                  key={index}
                  className={`flex ${isAdminMsg ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                      isAdminMsg
                        ? 'bg-white text-brand-charcoal rounded-tl-none border border-brand-sand/55'
                        : 'bg-brand-sage text-brand-warm rounded-tr-none'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap text-left">{msg.text}</p>
                    <span 
                      className={`text-[9px] block mt-1 text-right ${
                        isAdminMsg ? 'text-brand-charcoal/50' : 'text-brand-warm/75'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Form Input */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-brand-sand flex items-center gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your beauty request..."
              className="flex-1 bg-brand-warm/30 text-xs px-4 py-2.5 rounded-xl border border-brand-sand focus:outline-none focus:ring-1 focus:ring-brand-sage text-brand-charcoal placeholder:text-brand-charcoal/40"
            />
            <button
              type="submit"
              id="send-chat-msg-btn"
              disabled={!messageText.trim()}
              className="h-9 w-9 bg-brand-sage hover:bg-brand-sage/90 disabled:bg-brand-sand/50 disabled:text-brand-charcoal/30 text-brand-warm flex items-center justify-center rounded-xl transition duration-200 cursor-pointer shadow"
            >
              <Send className="w-4 h-4 text-brand-peach" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
