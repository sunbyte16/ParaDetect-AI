export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔬</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">ParaDetect AI</h3>
                <p className="text-sm text-gray-400">Deep Learning Malaria Diagnosis</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4">
              Advanced AI-powered malaria detection system using state-of-the-art deep learning technology. 
              Fast, accurate, and reliable diagnosis at your fingertips.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <span>📧</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <span>🐙</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <span>📱</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Technology</a></li>
              <li><a href="http://localhost:8000/docs" target="_blank" className="hover:text-white transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-lg">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Research Paper</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dataset Info</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2k26 ParaDetect AI. Created by ❤️ BitBuilder Team.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Disclaimer</a>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
          <p className="text-yellow-200 text-sm text-center">
            ⚠️ Medical Disclaimer: This tool is for research and educational purposes only. 
            Always consult qualified healthcare professionals for medical diagnosis and treatment.
          </p>
        </div>
      </div>
    </footer>
  )
}
