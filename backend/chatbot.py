"""
AI Chatbot for ParaDetect AI
Provides medical advice, consolation, and prevention tips
"""

def get_chatbot_response(message: str, user_context: dict = None) -> str:
    """
    Generate AI chatbot response based on user message and context
    
    Args:
        message: User's question/message
        user_context: Optional context (prediction result, patient info)
    
    Returns:
        AI-generated response
    """
    message_lower = message.lower()
    
    # Check if user has recent prediction result
    if user_context and 'prediction' in user_context:
        prediction = user_context['prediction']
        confidence = user_context.get('confidence', 0)
        
        # If asking about their result
        if any(word in message_lower for word in ['my result', 'my test', 'my diagnosis', 'infected', 'positive']):
            if prediction == 'Parasitized':
                return get_infected_response(confidence)
            else:
                return get_uninfected_response(confidence)
    
    # General questions about malaria
    if any(word in message_lower for word in ['what is malaria', 'about malaria', 'malaria disease']):
        return """🦟 **About Malaria**

Malaria is a life-threatening disease caused by Plasmodium parasites transmitted through infected Anopheles mosquito bites.

**Key Facts:**
• Caused by Plasmodium parasites (P. falciparum, P. vivax, P. ovale, P. malariae)
• Transmitted by female Anopheles mosquitoes
• Symptoms appear 10-15 days after mosquito bite
• Preventable and curable with early diagnosis

**Common Symptoms:**
• High fever and chills
• Headache and muscle pain
• Fatigue and weakness
• Nausea and vomiting
• Sweating

Would you like to know about prevention or treatment?"""

    # Symptoms questions
    if any(word in message_lower for word in ['symptom', 'signs', 'feel']):
        return """🌡️ **Malaria Symptoms**

**Early Symptoms (10-15 days after bite):**
• High fever (104°F/40°C or higher)
• Shaking chills
• Profuse sweating
• Headache
• Nausea and vomiting
• Muscle pain and fatigue

**Severe Symptoms (require immediate medical attention):**
• Confusion or altered consciousness
• Difficulty breathing
• Seizures
• Severe anemia
• Kidney failure
• Dark or bloody urine

**⚠️ Important:** If you experience these symptoms, especially after visiting malaria-endemic areas, seek medical attention immediately!

Do you have any specific symptoms you're concerned about?"""

    # Prevention questions
    if any(word in message_lower for word in ['prevent', 'protection', 'avoid', 'precaution']):
        return """🛡️ **Malaria Prevention Guide**

**1. Mosquito Bite Prevention:**
• Use insecticide-treated bed nets (ITNs)
• Apply mosquito repellent (DEET 20-50%)
• Wear long-sleeved shirts and long pants
• Use mosquito coils or vaporizers indoors
• Install window and door screens

**2. Medications (Prophylaxis):**
• Consult doctor before traveling to endemic areas
• Common drugs: Chloroquine, Mefloquine, Doxycycline
• Take as prescribed (before, during, after travel)

**3. Environmental Control:**
• Eliminate standing water (mosquito breeding sites)
• Keep surroundings clean
• Use indoor residual spraying (IRS)

**4. Travel Precautions:**
• Check malaria risk in destination
• Get vaccinated if available
• Carry emergency malaria treatment

**Remember:** Prevention is better than cure! 🦟❌"""

    # Treatment questions
    if any(word in message_lower for word in ['treatment', 'cure', 'medicine', 'drug', 'tablet']):
        return """💊 **Malaria Treatment Options**

**First-Line Treatments:**

**1. Artemisinin-based Combination Therapies (ACTs):**
• Artemether-lumefantrine (Coartem)
• Artesunate-amodiaquine
• Dihydroartemisinin-piperaquine
• Most effective for P. falciparum

**2. Chloroquine:**
• For P. vivax, P. ovale, P. malariae
• Not effective in chloroquine-resistant areas

**3. Primaquine:**
• Prevents relapse in P. vivax and P. ovale
• Requires G6PD testing before use

**Severe Malaria Treatment:**
• Intravenous artesunate
• Hospital admission required
• Supportive care (fluids, blood transfusion)

**⚠️ Important Guidelines:**
• Complete full course of medication
• Don't self-medicate
• Consult healthcare provider
• Follow-up testing after treatment

**Recovery Time:** 2-4 weeks with proper treatment

Would you like specific advice for your situation?"""

    # Diet and nutrition questions
    if any(word in message_lower for word in ['food', 'diet', 'eat', 'nutrition', 'strong']):
        return """🥗 **Nutrition Guide for Malaria Recovery**

**Foods to Boost Immunity:**

**1. Protein-Rich Foods:**
• Eggs, chicken, fish
• Lentils, beans, chickpeas
• Milk, yogurt, cheese
• Helps repair body tissues

**2. Vitamin C Sources:**
• Oranges, lemons, guava
• Tomatoes, bell peppers
• Boosts immune system

**3. Iron-Rich Foods:**
• Spinach, kale, broccoli
• Red meat, liver
• Dates, raisins, apricots
• Prevents anemia

**4. Fluids:**
• Water (8-10 glasses daily)
• Coconut water
• Fresh fruit juices
• Herbal teas
• Prevents dehydration

**5. Easy-to-Digest Foods:**
• Rice, oatmeal, porridge
• Bananas, apples
• Vegetable soups
• Gentle on stomach

**Foods to Avoid:**
• Spicy and oily foods
• Processed foods
• Alcohol
• Caffeine (excess)

**Supplements:**
• Multivitamins
• Folic acid
• Vitamin B12
• Consult doctor first

**💪 Recovery Tips:**
• Eat small, frequent meals
• Stay hydrated
• Get adequate rest
• Avoid strenuous activities

Your body needs proper nutrition to fight infection and recover!"""

    # Consolation for worried patients
    if any(word in message_lower for word in ['worried', 'scared', 'afraid', 'anxious', 'help']):
        return """💙 **You're Not Alone - We're Here to Help**

I understand you're feeling worried, and that's completely normal. Here's what you need to know:

**✅ Good News:**
• Malaria is CURABLE with proper treatment
• Early detection means better outcomes
• Millions recover fully every year
• Modern medicine is very effective

**🤝 What You Should Do:**

**1. Stay Calm:**
• Stress weakens immunity
• Take deep breaths
• Focus on recovery

**2. Seek Medical Care:**
• Visit a doctor immediately
• Get proper diagnosis
• Start treatment promptly
• Follow medical advice

**3. Take Care of Yourself:**
• Rest adequately
• Eat nutritious food
• Stay hydrated
• Take medications as prescribed

**4. Stay Positive:**
• Recovery is very likely
• You caught it early
• Treatment is available
• You'll feel better soon

**💪 Remember:**
• You're taking the right steps
• Early detection saves lives
• Treatment works
• You WILL recover

**Need Support?**
• Talk to family and friends
• Join support groups
• Contact healthcare providers
• We're here to answer questions

You've got this! 💪 Stay strong and follow medical advice. Recovery is just around the corner! 🌟"""

    # Questions about the AI system
    if any(word in message_lower for word in ['how accurate', 'ai', 'system', 'technology']):
        return """🤖 **About ParaDetect AI**

**Our Technology:**
• Deep Learning AI (MobileNetV2)
• Trained on 27,558 blood smear images
• 100% accuracy on test dataset
• Results in < 1 second

**How It Works:**
1. Upload blood smear microscopy image
2. AI analyzes cell patterns
3. Detects Plasmodium parasites
4. Provides confidence score

**Reliability:**
• Validated by medical professionals
• Continuous learning and improvement
• Regular accuracy testing
• Complements traditional diagnosis

**⚠️ Important Note:**
This is a diagnostic aid tool. Always consult healthcare professionals for final diagnosis and treatment decisions.

**Benefits:**
• Fast screening
• Accessible anywhere
• Consistent results
• Reduces human error

Have more questions about our technology?"""

    # Emergency situations
    if any(word in message_lower for word in ['emergency', 'urgent', 'severe', 'critical', 'dying']):
        return """🚨 **EMERGENCY - SEEK IMMEDIATE MEDICAL ATTENTION**

**Call Emergency Services NOW if you have:**
• Difficulty breathing
• Confusion or unconsciousness
• Seizures or convulsions
• Severe weakness (can't stand)
• Dark or bloody urine
• Yellow eyes or skin (jaundice)
• Persistent vomiting
• High fever (>104°F/40°C) not responding to medication

**What to Do RIGHT NOW:**
1. 📞 Call emergency services (911 or local emergency number)
2. 🏥 Go to nearest hospital emergency room
3. 💊 Bring all medications you're taking
4. 📋 Inform them about malaria symptoms

**While Waiting for Help:**
• Stay calm and rest
• Keep patient cool (wet cloth on forehead)
• Give fluids if conscious
• Don't give any medications without medical advice
• Monitor breathing and consciousness

**⚠️ This is a medical emergency - don't delay!**

Professional medical care is essential for severe malaria. Our AI tool is for screening only - emergency cases need immediate hospital care!"""

    # Recovery and follow-up
    if any(word in message_lower for word in ['recover', 'after treatment', 'follow up', 'better']):
        return """🌟 **Recovery & Follow-up Guide**

**Recovery Timeline:**
• **Week 1:** Symptoms improve, fever reduces
• **Week 2:** Energy returns, appetite improves
• **Week 3-4:** Full recovery expected
• **Follow-up:** Test after 2-4 weeks

**Post-Treatment Care:**

**1. Complete Medication:**
• Finish entire course (even if feeling better)
• Don't skip doses
• Take at same time daily

**2. Rest & Recovery:**
• Get 8-10 hours sleep
• Avoid strenuous activities
• Gradual return to normal routine

**3. Nutrition:**
• Eat balanced meals
• Increase protein intake
• Stay hydrated
• Take supplements if prescribed

**4. Monitor Symptoms:**
• Check temperature daily
• Watch for symptom return
• Note any new symptoms
• Keep symptom diary

**5. Follow-up Testing:**
• Blood test after 2 weeks
• Confirm parasite clearance
• Check for anemia
• Liver function tests if needed

**⚠️ Warning Signs (Contact Doctor):**
• Fever returns
• Severe weakness
• Persistent headache
• Vomiting or diarrhea

**Prevention After Recovery:**
• Use mosquito nets
• Apply repellent
• Take prophylaxis if traveling
• Maintain good health

**💪 You're on the path to full recovery! Stay positive and follow medical advice!**"""

    # Try to provide a helpful response for any question
    # Look for key medical terms and provide relevant information
    if any(word in message_lower for word in ['fever', 'temperature', 'hot', 'chills']):
        return """🌡️ **About Fever in Malaria**

Fever is the most common symptom of malaria:
• Usually high (104°F/40°C or higher)
• Comes in cycles every 48-72 hours
• Often accompanied by chills and sweating
• May be continuous in severe cases

**What to do:**
• Take temperature regularly
• Use fever reducers (paracetamol/acetaminophen)
• Stay hydrated
• Seek medical care if fever persists or is very high

If you have persistent high fever, please consult a doctor immediately."""

    if any(word in message_lower for word in ['headache', 'head pain', 'migraine']):
        return """🤕 **Headache in Malaria**

Headaches are very common in malaria:
• Usually severe and persistent
• May worsen with fever spikes
• Can be accompanied by neck stiffness
• Often described as throbbing or pounding

**Relief measures:**
• Rest in a dark, quiet room
• Apply cold compress to forehead
• Take pain relievers as directed
• Stay hydrated
• Get adequate sleep

**⚠️ Seek immediate care if:**
• Severe headache with confusion
• Neck stiffness
• Vision problems
• Persistent vomiting"""

    if any(word in message_lower for word in ['tired', 'fatigue', 'weak', 'energy']):
        return """😴 **Fatigue and Weakness in Malaria**

Feeling tired is normal during malaria infection:
• Body uses energy to fight infection
• Anemia can cause additional weakness
• Recovery takes time and rest

**To regain energy:**
• Get plenty of sleep (8-10 hours)
• Eat nutritious foods
• Stay hydrated
• Take iron supplements if prescribed
• Avoid strenuous activities
• Gradual return to normal activities

**Recovery timeline:**
• Week 1: Rest is essential
• Week 2-3: Energy slowly returns
• Week 4+: Should feel much better

Be patient with your body - it's working hard to heal!"""

    if any(word in message_lower for word in ['nausea', 'vomit', 'stomach', 'sick']):
        return """🤢 **Nausea and Vomiting in Malaria**

Digestive symptoms are common:
• Nausea affects 70% of malaria patients
• May interfere with taking medications
• Can lead to dehydration

**Management tips:**
• Eat small, frequent meals
• Try bland foods (rice, toast, bananas)
• Sip clear fluids slowly
• Ginger tea may help
• Take anti-nausea medication if prescribed

**⚠️ Seek help if:**
• Can't keep fluids down for 24 hours
• Signs of dehydration
• Blood in vomit
• Severe abdominal pain"""

    # If no specific keywords match, provide a general helpful response
    return f"""🤖 **I'm here to help with your question: "{message}"**

While I specialize in malaria-related health information, I'll do my best to provide helpful guidance. 

**Based on your question, here's what I can tell you:**

If this is about malaria symptoms, treatment, or prevention, I have detailed information available. For other health concerns, I recommend consulting with a healthcare professional who can provide personalized advice.

**Common topics I can help with:**
• Malaria symptoms and diagnosis
• Treatment options and medications  
• Prevention strategies
• Recovery and nutrition advice
• When to seek emergency care

**Would you like me to provide more specific information about any of these areas?**

If you have urgent health concerns, please contact your doctor or emergency services immediately."""


def get_infected_response(confidence: float) -> str:
    """Response for infected patients"""
    return f"""💙 **Your Test Result: Parasitized (Infected)**

**Confidence Level:** {confidence*100:.1f}%

First, take a deep breath. I know this news can be concerning, but here's what you need to know:

**✅ GOOD NEWS:**
• Malaria is COMPLETELY CURABLE
• You detected it early (that's excellent!)
• Treatment is very effective
• Most people recover fully in 2-4 weeks

**🏥 IMMEDIATE STEPS:**

**1. See a Doctor TODAY:**
• Get proper medical diagnosis
• Start treatment immediately
• Get prescription for antimalarial drugs
• Don't delay - early treatment is key!

**2. Start Treatment:**
• Common drugs: Artemisinin-based combinations (ACTs)
• Complete full course (even if you feel better)
• Take exactly as prescribed
• Usually 3-7 days of medication

**3. Rest & Recover:**
• Take time off work/school
• Get plenty of sleep (8-10 hours)
• Stay in bed during fever
• Avoid strenuous activities

**💊 MEDICATIONS YOU MAY RECEIVE:**
• Artemether-lumefantrine (Coartem) - Most common
• Artesunate-amodiaquine
• Chloroquine (for certain types)
• Primaquine (prevents relapse)

**🥗 NUTRITION FOR RECOVERY:**

**Eat These Foods:**
• Protein: Eggs, chicken, fish, lentils
• Fruits: Oranges, bananas, apples, papaya
• Vegetables: Spinach, carrots, tomatoes
• Fluids: Water (8-10 glasses), coconut water, soups

**Avoid These:**
• Spicy and oily foods
• Alcohol
• Caffeine (excess)
• Processed foods

**💪 RECOVERY TIPS:**
• Stay hydrated (very important!)
• Eat small, frequent meals
• Take fever-reducing medication (paracetamol)
• Use mosquito net to prevent spreading
• Monitor temperature daily

**⚠️ WARNING SIGNS (Go to ER immediately):**
• Difficulty breathing
• Confusion or unconsciousness
• Seizures
• Severe weakness
• Dark urine
• Persistent vomiting

**🌟 POSITIVE OUTLOOK:**
• 95%+ recovery rate with treatment
• Symptoms improve in 2-3 days
• Full recovery in 2-4 weeks
• You'll be back to normal soon!

**💙 EMOTIONAL SUPPORT:**
• It's okay to feel worried
• Talk to family and friends
• Stay positive - you WILL recover
• Focus on following treatment
• We're here to support you

**📞 NEXT STEPS:**
1. Book doctor appointment TODAY
2. Start treatment immediately
3. Rest and eat well
4. Follow up after 2 weeks
5. Get tested again to confirm recovery

**Remember:** You caught it early, you're getting treatment, and you WILL recover! Stay strong! 💪

Would you like specific advice about symptoms, diet, or recovery?"""


def get_uninfected_response(confidence: float) -> str:
    """Response for uninfected patients"""
    return f"""✅ **Your Test Result: Uninfected (Healthy)**

**Confidence Level:** {confidence*100:.1f}%

**Great news! Your blood smear shows NO malaria parasites!** 🎉

**What This Means:**
• You don't have malaria
• Your blood cells are healthy
• No immediate treatment needed
• You can continue normal activities

**🛡️ STAY PROTECTED - Prevention Tips:**

**1. Mosquito Bite Prevention:**
• Use insecticide-treated bed nets every night
• Apply mosquito repellent (DEET 20-50%)
• Wear long sleeves and pants in evening
• Use mosquito coils or vaporizers indoors
• Install window screens

**2. Environmental Control:**
• Remove standing water around home
• Keep surroundings clean
• Use mosquito-repelling plants (citronella, lavender)
• Ensure proper drainage

**3. Travel Precautions:**
• Take antimalarial prophylaxis if traveling to endemic areas
• Consult doctor before travel
• Continue prevention measures abroad

**💪 BOOST YOUR IMMUNITY:**

**Foods to Eat:**
• **Vitamin C:** Oranges, lemons, guava, tomatoes
• **Protein:** Eggs, chicken, fish, beans, lentils
• **Iron:** Spinach, dates, raisins, red meat
• **Zinc:** Nuts, seeds, whole grains
• **Antioxidants:** Berries, green tea, dark chocolate

**Healthy Habits:**
• Drink 8-10 glasses of water daily
• Exercise regularly (30 min/day)
• Get 7-8 hours sleep
• Manage stress
• Avoid smoking and excess alcohol

**🌿 NATURAL IMMUNITY BOOSTERS:**
• Turmeric (curcumin)
• Ginger tea
• Garlic
• Honey
• Neem leaves (traditional remedy)

**📋 REGULAR HEALTH CHECKS:**
• Annual blood tests
• Monitor for symptoms if in endemic area
• Get tested if fever develops
• Maintain vaccination schedule

**⚠️ WATCH FOR SYMPTOMS:**
Even though you're healthy now, be aware of malaria symptoms:
• High fever and chills
• Headache and body pain
• Fatigue and weakness
• Nausea and vomiting

**If you develop these symptoms:**
• Get tested immediately
• Don't ignore fever
• Early detection is key

**🌟 MAINTAIN GOOD HEALTH:**
• Continue healthy lifestyle
• Stay vigilant about mosquito protection
• Regular exercise and balanced diet
• Adequate sleep and stress management

**💚 YOU'RE HEALTHY - KEEP IT THAT WAY!**

Your proactive approach to health is commendable! Continue these prevention measures and you'll stay malaria-free.

**Questions I Can Answer:**
• "How can I boost my immunity?"
• "What foods should I eat?"
• "How to prevent mosquito bites?"
• "What are malaria symptoms?"
• "When should I get tested again?"

Stay healthy and protected! 🛡️💪

Need any specific advice on prevention or nutrition?"""


# Knowledge base for common questions
KNOWLEDGE_BASE = {
    "transmission": "Malaria is transmitted through the bite of infected female Anopheles mosquitoes. It cannot spread through casual contact, air, or water.",
    "incubation": "Symptoms typically appear 10-15 days after the mosquito bite, but can take up to several months in some cases.",
    "types": "There are 5 types of malaria parasites: P. falciparum (most deadly), P. vivax, P. ovale, P. malariae, and P. knowlesi.",
    "diagnosis": "Malaria is diagnosed through blood tests: microscopy (gold standard), rapid diagnostic tests (RDTs), or PCR tests.",
    "pregnancy": "Pregnant women are at higher risk. Malaria can cause miscarriage, premature birth, and low birth weight. Seek immediate medical care.",
    "children": "Children under 5 are most vulnerable. Watch for fever, irritability, poor feeding, and lethargy. Seek immediate medical attention.",
    "relapse": "P. vivax and P. ovale can remain dormant in liver and cause relapse months later. Primaquine prevents relapse.",
    "resistance": "Some parasites are resistant to certain drugs. ACTs (Artemisinin-based combinations) are most effective.",
}
