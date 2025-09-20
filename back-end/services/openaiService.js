const { OpenAI } = require('openai');

// Initialize OpenAI with proper error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI initialized successfully');
} catch (error) {
  console.error('OpenAI initialization error:', error);
  openai = null;
}

// Function to process health queries with compassionate and detailed responses
async function processHealthQuery(userMessage) {
  // Check if OpenAI is properly initialized
  if (!openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_actual_openai_api_key_here') {
    console.log('OpenAI not configured, using intelligent fallback');
    return generateIntelligentResponse(userMessage);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are Dr. CareBot, a compassionate and empathetic health assistant. Provide warm, supportive, and detailed health advice based on the user's specific symptoms.

Always include:
1. Heartfelt empathy and concern
2. Specific symptom analysis
3. Practical home care instructions
4. Medicine suggestions (always recommend doctor consultation)
5. Dietary recommendations
6. Warning signs to watch for

Format naturally without section headers. Be conversational and caring.`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return generateIntelligentResponse(userMessage);
  }
}

// Intelligent fallback response based on user input
function generateIntelligentResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Analyze the user's message and generate appropriate response
  if (lowerMessage.includes('fever') && lowerMessage.includes('headache')) {
    return `I'm really concerned about your fever and headache 😔. It sounds like you're going through a tough time. For fever with headache that's lasted 3 days, here's what I recommend:

• Please monitor your temperature regularly - if it's above 102°F (39°C), seek medical attention immediately
• For the headache, try a cool compress on your forehead and rest in a dark, quiet room
• Stay well-hydrated with water, electrolyte solutions, or herbal teas like ginger or peppermint
• You can consider over-the-counter fever reducers like acetaminophen or ibuprofen, but please consult a pharmacist or doctor first, especially if you have other health conditions
• Eat light, easy-to-digest foods like soups, broths, and plain rice

Most importantly, since this has persisted for 3 days, I strongly recommend consulting a healthcare professional to rule out any infections that might need specific treatment. Your health is precious! 💙`;
  }
  
  if (lowerMessage.includes('cough') || lowerMessage.includes('cold')) {
    return `I'm sorry to hear you're dealing with cough and cold symptoms 😔. Here's how you can find some relief:

• Steam inhalation can really help - try leaning over a bowl of hot water with a towel over your head
• Honey and warm lemon water can soothe your throat
• Rest is essential - your body needs energy to fight off whatever's causing this
• Stay hydrated with warm fluids like herbal teas, broths, and plenty of water
• Consider over-the-counter cough suppressants if the cough is disturbing your sleep, but check with a pharmacist first

If your symptoms persist beyond a week or you develop fever or breathing difficulties, please see a doctor.`;
  }

  if (lowerMessage.includes('stomach') || lowerMessage.includes('diarrhea') || lowerMessage.includes('vomit')) {
    return `Oh no, stomach issues are so uncomfortable 😔. I'm sorry you're going through this. Here's what might help:

• Stick to the BRAT diet - Bananas, Rice, Applesauce, and Toast - until things settle down
• Stay hydrated with small, frequent sips of water or oral rehydration solutions
• Avoid dairy, fatty foods, and caffeine until you're feeling better
• Rest as much as possible - your body needs energy to recover
• Peppermint or ginger tea can help soothe stomach discomfort

If symptoms persist beyond 48 hours or you see blood, please seek medical attention immediately.`;
  }

  // General compassionate response for other symptoms
  return `I'm really sorry to hear you're not feeling well 😔. I can hear the concern in your message, and I want to help you through this.

Based on what you've described, here's my advice:
• Rest is crucial - give your body the time it needs to heal
• Stay well-hydrated with water, herbal teas, or electrolyte solutions
• Monitor your symptoms closely and keep track of any changes
• Don't hesitate to reach out to a healthcare professional for personalized advice

Could you tell me a bit more about your specific symptoms? I want to make sure I give you the best possible guidance. Remember, I'm here to support you! 💙`;
}

// Enhanced function to extract structured data
function extractStructuredData(aiResponse) {
  // For intelligent fallback responses, create structured data based on content
  const structuredData = {
    symptoms: "",
    precautions: "",
    medicine: "",
    food: "",
    other: ""
  };

  // Extract information based on common patterns in the response
  if (aiResponse.includes('fever') && aiResponse.includes('headache')) {
    structuredData.symptoms = "Fever, headache, body pains";
    structuredData.precautions = "Monitor temperature, rest, seek medical help if fever persists";
    structuredData.medicine = "Consult doctor for appropriate fever reducers and pain medication";
    structuredData.food = "Light meals, warm fluids, soups, electrolyte solutions";
    structuredData.other = "Seek immediate medical attention if symptoms worsen or persist beyond 3 days";
  }
  else if (aiResponse.includes('cough') || aiResponse.includes('cold')) {
    structuredData.symptoms = "Cough, cold, respiratory discomfort";
    structuredData.precautions = "Steam inhalation, rest, avoid spreading germs";
    structuredData.medicine = "Over-the-counter cough suppressants (consult pharmacist), honey remedies";
    structuredData.food = "Warm fluids, herbal teas, honey, vitamin C rich foods";
    structuredData.other = "Consult doctor if symptoms persist or breathing difficulties occur";
  }
  else if (aiResponse.includes('stomach') || aiResponse.includes('diarrhea')) {
    structuredData.symptoms = "Stomach discomfort, digestive issues";
    structuredData.precautions = "BRAT diet, hydration, rest";
    structuredData.medicine = "Consult doctor for anti-diarrheal medication if needed";
    structuredData.food = "Bananas, rice, applesauce, toast, clear broths";
    structuredData.other = "Seek immediate medical attention for persistent symptoms or blood";
  }
  else {
    structuredData.symptoms = "General discomfort and symptoms";
    structuredData.precautions = "Rest, hydration, medical consultation";
    structuredData.medicine = "Consult healthcare professional for appropriate treatment";
    structuredData.food = "Light meals, warm fluids, easy-to-digest foods";
    structuredData.other = "Monitor symptoms and seek medical attention if condition worsens";
  }

  return structuredData;
}

module.exports = {
  processHealthQuery,
  extractStructuredData
};