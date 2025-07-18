import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [userId] = useState(() => {
    const saved = localStorage.getItem('shujaa_user_id');
    return saved || `user_${Date.now()}`;
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('shujaa_user_id', userId);
    loadChatHistory();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history/${userId}`);
      setMessages(response.data.reverse());
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      message: inputMessage,
      timestamp: new Date(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: inputMessage,
        user_id: userId
      });

      const aiMessage = {
        id: Date.now() + 1,
        message: response.data.response,
        timestamp: new Date(),
        isUser: false,
        isOffline: response.data.is_offline
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsOnline(!response.data.is_offline);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        message: "👑 Oops, our nurse is sipping tea! We'll try again in a sec... For emergencies, please contact emergency services immediately.",
        timestamp: new Date(),
        isUser: false,
        isOffline: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { text: "I'm feeling anxious", icon: "💙" },
    { text: "I have a headache", icon: "🤕" },
    { text: "I can't sleep", icon: "😴" },
    { text: "I feel sad", icon: "💔" },
    { text: "Emergency help", icon: "🚨" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full opacity-10 animate-spin-slow"></div>
      </div>

      {/* Hero Section */}
      <AnimatePresence>
        {!showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6"
          >
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  Shujaa
                </h1>
                <p className="text-xl md:text-2xl text-gray-700 font-light">
                  Your AI-Powered Health Companion for East Africa
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="glassmorphic-card p-8 mb-8 max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  🌟 Welcome to Your Health Journey
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Get instant health guidance, mental health support, and emergency care tips. 
                  Shujaa is here to help you 24/7 with compassionate, culturally-aware healthcare assistance.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <div className="glassmorphic-card p-6 text-center">
                  <div className="text-4xl mb-3">🧠</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Mental Health</h3>
                  <p className="text-gray-600">Anxiety, depression, stress management</p>
                </div>
                <div className="glassmorphic-card p-6 text-center">
                  <div className="text-4xl mb-3">🏥</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Basic Care</h3>
                  <p className="text-gray-600">Symptoms, first aid, health tips</p>
                </div>
                <div className="glassmorphic-card p-6 text-center">
                  <div className="text-4xl mb-3">🚨</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Emergency</h3>
                  <p className="text-gray-600">Crisis support, urgent care guidance</p>
                </div>
              </motion.div>

              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(true)}
                className="floating-button-large bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-xl font-semibold shadow-2xl"
              >
                Ask Shujaa Anything 💬
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex flex-col"
          >
            {/* Chat Header */}
            <div className="glassmorphic-card m-4 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Shujaa Health AI</h3>
                  <p className="text-sm text-gray-600">
                    {isOnline ? '🟢 Online' : '🔴 Offline Mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="text-6xl mb-4">🏥</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Hello! I'm Shujaa, your health companion
                  </h3>
                  <p className="text-gray-600 mb-6">
                    How can I help you today? You can ask me about symptoms, mental health, or get emergency guidance.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(action.text)}
                        className="glassmorphic-card px-4 py-2 text-sm hover:bg-white/20 transition-colors"
                      >
                        {action.icon} {action.text}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      msg.isUser
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'glassmorphic-card text-gray-800'
                    }`}
                  >
                    {!msg.isUser && msg.isOffline && (
                      <div className="text-xs text-orange-600 mb-1">
                        📱 Offline Response
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="glassmorphic-card px-4 py-3 rounded-2xl">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask Shujaa about your health..."
                  className="flex-1 glassmorphic-card px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="floating-button bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full disabled:opacity-50"
                >
                  {isLoading ? '⏳' : '💬'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {!showChat && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 floating-button bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-2xl">💬</span>
        </motion.button>
      )}
    </div>
  );
};

export default App;