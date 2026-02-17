"""
AI Chatbot powered by Google Gemini AI
Provides intelligent medical advice, consolation, and support
"""

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    print("✅ Google Generative AI package loaded successfully")
except ImportError:
    try:
        import google.genai as genai
        GEMINI_AVAILABLE = True
        print("✅ Using new google.genai package")
    except ImportError:
        GEMINI_AVAILABLE = False
        print("❌ No Google AI package available. Install google-generativeai or google-genai")

from typing import Optional, Dict
import os

# Configure Gemini AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyByWuA515NOLs28OsguZGje_ZDaX8QggBc")

model = None

if GEMINI_AVAILABLE and GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        # Initialize the model with proper configuration
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        model = genai.GenerativeModel(
            model_name='gemini-2.0-flash',
            generation_config=generation_config
        )
        print("✅ Gemini AI model initialized successfully (gemini-2.0-flash)")
    except Exception as e:
        print(f"⚠️ Warning: Gemini AI initialization failed: {e}")
        print(f"   Falling back to basic responses")
        model = None
        GEMINI_AVAILABLE = False
else:
    if not GEMINI_AVAILABLE:
        print("⚠️ Gemini package not available")
    if not GOOGLE_API_KEY:
        print("⚠️ GOOGLE_API_KEY not set")
    print("   Using fallback responses")

# System prompt for medical context
SYSTEM_PROMPT = """You are an intelligent AI Assistant for ParaDetect AI, a malaria detection platform. 

YOUR CAPABILITIES:
- Answer ANY question the user asks (not limited to medical topics)
- Provide accurate, helpful information on any subject
- Be conversational, friendly, and engaging
- Use emojis to make responses more engaging
- Give detailed, comprehensive answers

SPECIAL FOCUS AREAS:
When users ask about health/medical topics, especially malaria:
- Provide accurate medical information
- Offer emotional support and consolation
- Give practical advice on treatment and prevention
- Recommend nutrition and diet
- Explain when to seek emergency care

RESPONSE STYLE:
- Be friendly and conversational
- Use emojis appropriately 😊
- Break down complex topics simply
- Provide examples when helpful
- Be concise but thorough
- Format responses with bullet points and headers for clarity

TOPICS YOU CAN DISCUSS:
✅ Medical & Health (malaria, diseases, symptoms, treatment)
✅ Technology & Science
✅ Education & Learning
✅ Food & Nutrition
✅ Travel & Geography
✅ History & Culture
✅ Entertainment & Sports
✅ Business & Finance
✅ Programming & Coding
✅ General Knowledge
✅ Life Advice & Tips
✅ And literally ANYTHING else!

Remember: You're here to help with ANY question, not just medical ones. Be helpful, accurate, and engaging!"""

def get_gemini_response(message: str, user_context: Optional[Dict] = None) -> str:
    """
    Get AI response from Google Gemini - Can answer ANY question!
    
    Args:
        message: User's question (can be about anything!)
        user_context: Optional context (prediction result, patient info)
    
    Returns:
        AI-generated response
    """
    try:
        # Check if Gemini is available and model is initialized
        if not GEMINI_AVAILABLE or model is None:
            print("⚠️ Gemini model not available, using fallback")
            return get_fallback_response(message, user_context)
            
        # Build context-aware prompt
        full_prompt = SYSTEM_PROMPT + "\n\n"
        
        # Add user context if available (for medical questions)
        if user_context and 'prediction' in user_context:
            prediction = user_context['prediction']
            confidence = user_context.get('confidence', 0)
            
            full_prompt += f"""
USER'S MEDICAL CONTEXT (if relevant to their question):
- Recent Test Result: {prediction}
- Confidence: {confidence*100:.1f}%
- Status: {'INFECTED - May need medical support' if prediction == 'Parasitized' else 'HEALTHY - May want prevention tips'}

Note: Only mention this if the user asks about their health/test result.

"""
        
        # Add user question
        full_prompt += f"USER QUESTION: {message}\n\nYour helpful, engaging response:"
        
        # Generate response with retry logic
        max_retries = 2
        for attempt in range(max_retries):
            try:
                response = model.generate_content(full_prompt)
                
                if response and hasattr(response, 'text') and response.text:
                    return response.text
                elif response and hasattr(response, 'parts'):
                    # Handle different response formats
                    text_parts = [part.text for part in response.parts if hasattr(part, 'text')]
                    if text_parts:
                        return ''.join(text_parts)
                
                print(f"⚠️ Empty or invalid response from Gemini (attempt {attempt + 1})")
                
            except Exception as e:
                print(f"⚠️ Gemini API error (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1)  # Wait before retry
                    continue
        
        # If all retries failed, use fallback
        print("⚠️ All Gemini attempts failed, using fallback")
        return get_fallback_response(message, user_context)
        
    except Exception as e:
        print(f"❌ Gemini AI Error: {e}")
        # Fallback to basic response
        return get_fallback_response(message, user_context)


def get_fallback_response(message: str, user_context: Optional[Dict] = None) -> str:
    """Enhanced fallback response that can handle any type of question"""
    
    message_lower = message.lower()
    
    # Programming and technology questions
    if any(word in message_lower for word in ['python', 'javascript', 'code', 'programming', 'software', 'computer', 'tech']):
        return """💻 **Technology & Programming Help**

I can help with various tech topics! Here are some areas I cover:

**Programming Languages:**
• Python, JavaScript, Java, C++, HTML/CSS
• Web development frameworks
• Database queries and design
• API development

**Common Programming Help:**
• Debugging code issues
• Best practices and patterns
• Algorithm explanations
• Project structure advice

**What specific technology question do you have?** I'll do my best to provide helpful guidance!

For complex coding problems, I can explain concepts, suggest approaches, and help troubleshoot issues."""

    # Science and education questions
    if any(word in message_lower for word in ['science', 'physics', 'chemistry', 'biology', 'math', 'education', 'learn']):
        return """🔬 **Science & Education Help**

I can help explain various scientific concepts and educational topics:

**Science Areas:**
• Biology and life sciences
• Chemistry and chemical reactions
• Physics and natural phenomena
• Mathematics and problem-solving
• Environmental science

**Learning Support:**
• Concept explanations
• Study strategies
• Problem-solving approaches
• Research guidance

**What would you like to learn about?** I can break down complex topics into understandable explanations!"""

    # Food and cooking questions
    if any(word in message_lower for word in ['food', 'cook', 'recipe', 'eat', 'meal', 'dish']):
        return """🍳 **Food & Cooking Help**

I can help with various culinary questions:

**Cooking Guidance:**
• Recipe suggestions and modifications
• Cooking techniques and tips
• Ingredient substitutions
• Meal planning ideas

**Nutrition Information:**
• Healthy eating tips
• Dietary considerations
• Food safety guidelines
• Nutritional benefits

**What cooking or food question do you have?** Whether it's a specific recipe, cooking technique, or nutrition advice, I'm here to help!"""

    # Travel and geography questions
    if any(word in message_lower for word in ['travel', 'country', 'city', 'geography', 'culture', 'place']):
        return """🌍 **Travel & Geography Help**

I can provide information about places and travel:

**Geographic Information:**
• Countries, cities, and landmarks
• Cultural information and customs
• Climate and weather patterns
• Historical background

**Travel Guidance:**
• Destination recommendations
• Travel tips and advice
• Cultural etiquette
• Planning suggestions

**What place or travel topic interests you?** I can share information about destinations, cultures, and travel planning!"""

    # General greetings and conversation
    if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings', 'how are you']):
        return """👋 **Hello! Great to meet you!**

I'm your AI Assistant and I'm here to help with absolutely anything you'd like to know!

**I can assist with:**
• 🏥 Health & medical questions (especially malaria)
• 💻 Technology & programming
• 🔬 Science & education
• 🍳 Food & cooking
• 🌍 Travel & geography
• 🎮 Entertainment & hobbies
• 💡 General knowledge
• 🎯 Life advice and tips

**Just ask me anything!** I'm designed to be helpful, informative, and engaging. What's on your mind today? 😊"""

    # Check if user has recent prediction result for medical context
    if user_context and 'prediction' in user_context:
        prediction = user_context['prediction']
        confidence = user_context.get('confidence', 0)
        
        if any(word in message_lower for word in ['my result', 'my test', 'infected', 'positive', 'diagnosis']):
            if prediction == 'Parasitized':
                return f"""💙 **Your Test Result: Parasitized (Infected)**

**Confidence:** {confidence*100:.1f}%

I understand this news can be concerning, but here's what you need to know:

✅ **Malaria is CURABLE**
• Early detection is excellent news
• Treatment is very effective
• Most people recover in 2-4 weeks

🏥 **Immediate Steps:**
1. See a doctor TODAY
2. Start antimalarial treatment
3. Rest and stay hydrated
4. Follow medical advice

💊 **Common Treatments:**
• Artemether-lumefantrine (Coartem)
• Artesunate-amodiaquine
• Complete the full course

💪 **You WILL recover! Stay positive and follow medical guidance.**

Do you have any specific questions about treatment, symptoms, or recovery?"""
            else:
                return f"""✅ **Your Test Result: Uninfected (Healthy)**

**Confidence:** {confidence*100:.1f}%

Excellent news! You're healthy! 🎉

🛡️ **Stay Protected:**
• Use insecticide-treated bed nets
• Apply mosquito repellent (DEET 20-50%)
• Wear long-sleeved clothing
• Remove standing water around home

💪 **Maintain Good Health:**
• Eat nutritious foods
• Exercise regularly
• Get adequate sleep
• Stay hydrated

Keep up the great work staying healthy! 💚

Any questions about prevention or anything else I can help with?"""

    # Default comprehensive response for any other question
    return f"""🤖 **I'm here to help with your question!**

You asked: *"{message}"*

While I specialize in providing helpful information on a wide range of topics, I want to make sure I give you the most accurate and useful response possible.

**I can help with:**
• 🏥 Health and medical information
• 💻 Technology and programming
• 🔬 Science and education
• 🍳 Food and cooking
• 🌍 Travel and geography
• 🎮 Entertainment and hobbies
• 💡 General knowledge and facts
• 🎯 Life advice and practical tips

**Could you provide a bit more context about what you're looking for?** This will help me give you a more specific and helpful answer!

For urgent health concerns, please consult with a healthcare professional. For other topics, I'm happy to share what I know and help you find the information you need! 😊"""


# Test function
if __name__ == "__main__":
    # Test the chatbot
    test_messages = [
        "What is malaria?",
        "I'm infected and worried",
        "What foods should I eat?"
    ]
    
    for msg in test_messages:
        print(f"\nUser: {msg}")
        response = get_gemini_response(msg)
        print(f"AI: {response}\n")
        print("-" * 80)
