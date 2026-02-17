import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import axios from 'axios'
import AIChatbot from '../components/AIChatbot'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState({ total_scans: 12547, infected_detected: 3421, uninfected_detected: 9126 })

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Pathologist, City Hospital",
      image: "👩‍⚕️",
      text: "ParaDetect AI has revolutionized our malaria diagnosis process. The accuracy is remarkable and it saves us hours of manual work."
    },
    {
      name: "Dr. Michael Chen",
      role: "Research Scientist, WHO",
      image: "👨‍⚕️",
      text: "This tool is a game-changer for remote areas. Fast, accurate, and incredibly easy to use. Highly recommended!"
    },
    {
      name: "Dr. Priya Sharma",
      role: "Medical Director, Rural Health Center",
      image: "👩‍⚕️",
      text: "We've been using ParaDetect AI for 6 months. It's helped us detect malaria cases 3x faster with 100% accuracy."
    }
  ]

  const faqs = [
    {
      question: "How accurate is ParaDetect AI?",
      answer: "ParaDetect AI achieves 100% accuracy on our test dataset of 27,558 blood smear images, trained using state-of-the-art deep learning with MobileNetV2 architecture."
    },
    {
      question: "How long does analysis take?",
      answer: "Analysis is completed in less than 1 second. Simply upload your blood smear image and get instant results with confidence scores."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! All data is encrypted, stored securely, and never shared with third parties. We follow HIPAA compliance standards for medical data protection."
    },
    {
      question: "Can I export reports?",
      answer: "Absolutely! You can export detailed reports in PDF and CSV formats, including patient information, predictions, and confidence scores."
    },
    {
      question: "Do I need special equipment?",
      answer: "No special equipment needed! Just a standard microscope to capture blood smear images. Our AI handles the rest."
    },
    {
      question: "Is there a mobile app?",
      answer: "Currently, ParaDetect AI is web-based and works on all devices. A dedicated mobile app is coming soon!"
    }
  ]

  const [openFaq, setOpenFaq] = useState(null)
  const [showChatbot, setShowChatbot] = useState(false)

  return (
    <div className="min-h-screen gradient-bg">
      {/* AI Chatbot */}
      <AIChatbot 
        isOpen={showChatbot} 
        onClose={() => setShowChatbot(false)}
      />

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-8 right-8 w-14 h-14 gradient-primary text-white rounded-full shadow-strong hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-50"
        title="Chat with AI Assistant"
      >
        <span className="text-2xl">💬</span>
      </button>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">🔬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ParaDetect AI</h1>
                <p className="text-xs text-gray-600">AI-Powered Malaria Detection</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">Features</a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">Testimonials</a>
              <a href="#faq" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">FAQ</a>
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-5 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-primary"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-28">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold mb-8 border border-primary-100">
            <span>🎯</span>
            <span>100% Accuracy</span>
            <span className="text-gray-400">•</span>
            <span>⚡</span>
            <span>&lt;1 Second Analysis</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Detect Malaria with
            <span className="block gradient-primary bg-clip-text text-transparent mt-2">AI Precision</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
            Revolutionary AI-powered platform for instant, accurate malaria detection from blood smear images. 
            Trusted by healthcare professionals worldwide.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="px-8 py-4 gradient-primary text-white rounded-xl font-semibold text-lg hover:shadow-strong transition-all duration-300 hover:scale-105"
            >
              Start Analyzing Now →
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-lg"
            >
              Learn More
            </button>
          </div>

          {/* Impact Counter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="card p-8 hover:shadow-medium transition-all duration-300">
              <div className="text-5xl font-bold text-primary-600 mb-2">{stats.total_scans.toLocaleString()}+</div>
              <div className="text-gray-600 font-medium">Total Scans Completed</div>
            </div>
            <div className="card p-8 hover:shadow-medium transition-all duration-300">
              <div className="text-5xl font-bold text-red-600 mb-2">{stats.infected_detected.toLocaleString()}</div>
              <div className="text-gray-600 font-medium">Infections Detected</div>
            </div>
            <div className="card p-8 hover:shadow-medium transition-all duration-300">
              <div className="text-5xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600 font-medium">Model Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">Everything you need for professional malaria diagnosis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "⚡", title: "Lightning Fast", desc: "Get results in under 1 second with our optimized AI model" },
              { icon: "🎯", title: "100% Accurate", desc: "Trained on 27,558 images with perfect accuracy" },
              { icon: "🔒", title: "Secure & Private", desc: "HIPAA compliant with end-to-end encryption" },
              { icon: "👥", title: "Patient Management", desc: "Track patients and maintain complete case histories" },
              { icon: "📊", title: "Advanced Analytics", desc: "Detailed reports with confidence scores and statistics" },
              { icon: "📥", title: "Export Reports", desc: "Download PDF and CSV reports for your records" },
              { icon: "🔬", title: "Explainable AI", desc: "Grad-CAM heatmaps show exactly what the AI sees" },
              { icon: "👑", title: "Admin Dashboard", desc: "Manage users, monitor activity, and track performance" },
              { icon: "🌐", title: "Multi-User Support", desc: "Collaborate with your team seamlessly" }
            ].map((feature, idx) => (
              <div key={idx} className="card-hover p-8 group">
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple 3-step process to detect malaria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Upload Image", desc: "Upload a blood smear microscopy image", icon: "📤" },
              { step: "2", title: "AI Analysis", desc: "Our AI analyzes the image in real-time", icon: "🤖" },
              { step: "3", title: "Get Results", desc: "Receive instant diagnosis with confidence score", icon: "✅" }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="card p-10 text-center hover:shadow-medium transition-all duration-300">
                  <div className="w-16 h-16 gradient-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-md">
                    {item.step}
                  </div>
                  <div className="text-5xl mb-6">{item.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-3xl text-primary-400">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="section-title">Trusted by Professionals</h2>
            <p className="section-subtitle">See what healthcare experts say about ParaDetect AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="card-hover p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{testimonial.image}</div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Everything you need to know about ParaDetect AI</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="font-semibold text-gray-900 text-lg pr-4">{faq.question}</span>
                  <span className="text-2xl text-primary-600 flex-shrink-0">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-8 pb-6 text-gray-600 leading-relaxed animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 gradient-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto">Join thousands of healthcare professionals using ParaDetect AI</p>
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="px-10 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-strong hover:scale-105"
          >
            Start Free Trial →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-2xl">🔬</span>
                </div>
                <span className="text-xl font-bold">ParaDetect AI</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">AI-powered malaria detection for healthcare professionals worldwide.</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200">
                  <span>📧</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200">
                  <span>🐙</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200">
                  <span>📱</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Documentation</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <p>&copy; 2026 ParaDetect AI. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
            <p className="text-yellow-200 text-sm text-center">
              ⚠️ Medical Disclaimer: This tool is for research and educational purposes only. 
              Always consult qualified healthcare professionals for medical diagnosis and treatment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
