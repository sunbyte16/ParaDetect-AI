import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AIChatbot({ isOpen, onClose, userPrediction = null }) {
  const { isAuthenticated } = useAuth()
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: '👋 Hello! I\'m your AI Assistant and I can help you with ANYTHING!\n\n🏥 Health & Medical:\n• Malaria information & symptoms\n• Treatment & prevention\n• Nutrition advice\n\n💻 Technology & Programming:\n• Coding help\n• Software questions\n• Tech troubleshooting\n\n🌍 General Knowledge:\n• Science & education\n• Travel & geography\n• Entertainment & hobbies\n• Life advice\n\n✨ Ask me literally ANY question - I\'m here to help!',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const quickQuestions = [
    { icon: '🦟', text: 'What is malaria?', query: 'What is malaria?' },
    { icon: '🌡️', text: 'Symptoms', query: 'What are the symptoms of malaria?' },
    { icon: '💊', text: 'Treatment', query: 'What treatment do I need?' },
    { icon: '🛡️', text: 'Prevention', query: 'How can I prevent malaria?' },
    { icon: '💻', text: 'Programming', query: 'Can you help me with Python programming?' },
    { icon: '🌍', text: 'Geography', query: 'Tell me about different countries' },
    { icon: '🍕', text: 'Recipes', query: 'How do I make pizza?' },
    { icon: '🎮', text: 'Any topic!', query: 'Can you really answer any question I ask?' }
  ]

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend) return

    // Add user message
    const userMessage = {
      type: 'user',
      text: textToSend,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('message', textToSend)

      // Use authenticated endpoint if user is logged in, otherwise use public endpoint
      const endpoint = isAuthenticated ? '/api/chatbot' : '/api/chatbot/public'
      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Add AI response
      const aiMessage = {
        type: 'ai',
        text: response.data.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chatbot error:', error)
      const errorMessage = {
        type: 'ai',
        text: '❌ Sorry, I encountered an error. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessage = (text) => {
    // Convert markdown-style formatting to HTML
    return text.split('\n').map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Bullet points
      if (line.trim().startsWith('•')) {
        return <li key={i} className="ml-4">{line.replace('•', '').trim()}</li>
      }
      
      // Headers
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        return <h4 key={i} className="font-bold text-lg mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>
      }
      
      return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line || '<br/>' }} />
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-3xl">
              🤖
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Assistant</h3>
              <p className="text-sm opacity-90">Ask me ANYTHING - I can help with any topic!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤖</span>
                    <span className="font-semibold text-sm">AI Assistant</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {formatMessage(message.text)}
                </div>
                <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-gray-600 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-6 py-3 bg-white border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2 font-semibold">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.query)}
                disabled={isLoading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span>{q.icon}</span>
                <span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-gray-200 rounded-b-2xl">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Send</span>
              <span className="text-xl">→</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
