// Mock prediction function for GitHub Pages demo
// This simulates the backend API response

export async function mockPredict(imageFile) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Read image to analyze filename or use random prediction
  const fileName = imageFile.name.toLowerCase()
  
  // Check if filename contains hints about the class
  const isParasitized = fileName.includes('parasitized') || 
                        fileName.includes('infected') ||
                        Math.random() > 0.5 // Random for demo
  
  // Generate realistic confidence scores
  const confidence = 0.85 + Math.random() * 0.14 // 85-99%
  
  const prediction = isParasitized ? 'Parasitized' : 'Uninfected'
  const parasitizedProb = isParasitized ? confidence : (1 - confidence)
  const uninfectedProb = 1 - parasitizedProb
  
  return {
    prediction: prediction,
    confidence: confidence,
    probabilities: {
      Parasitized: parseFloat(parasitizedProb.toFixed(4)),
      Uninfected: parseFloat(uninfectedProb.toFixed(4))
    },
    filename: imageFile.name,
    demo: true // Flag to indicate this is demo mode
  }
}
