const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your_api_key_here');
  console.log('Gemini initialized successfully');
} catch (error) {
  console.error('Gemini initialization error:', error);
  genAI = null;
}

// Language prompts with clean, speech-friendly responses
const languagePrompts = {
  'en-US': {
    system: `You are Dr. CareBot, a compassionate health assistant. Provide warm, supportive health advice.

IMPORTANT: Use plain text only. No markdown, no asterisks, no bullets. Write in complete sentences that sound natural when spoken aloud.`,
    responseLanguage: "Respond in clean, natural English"
  },
  'hi-IN': {
    system: `आप डॉ. केयरबॉट हैं, एक दयालु स्वास्थ्य सहायक। गर्मजोशी, सहायक स्वास्थ्य सलाह प्रदान करें।

महत्वपूर्ण: सादे पाठ का उपयोग करें। कोई मार्कडाउन नहीं, कोई तारांकन नहीं, कोई बुलेट्स नहीं। पूर्ण वाक्यों में लिखें जो जोर से पढ़े जाने पर स्वाभाविक लगें।`,
    responseLanguage: "साफ, स्वाभाविक हिंदी में उत्तर दें"
  },
  'te-IN': {
    system: `మీరు డాక్టర్ కేర్ బాట్, ఒక కరుణామయి ఆరోగ్య సహాయకుడు. వెచ్చదనం, మద్దతు ఆరోగ్య సలహాలను అందించండి.

ముఖ్యమైనది: సాదా టెక్స్ట్ మాత్రమే ఉపయోగించండి. మార్క్డౌన్ లేదు, నక్షత్రాలు లేవు, బులెట్లు లేవు. బిగ్గరగా చదివినప్పుడు సహజంగా ధ్వనించే సంపూర్ణ వాక్యాల్లో వ్రాయండి.`,
    responseLanguage: "స్వచ్ఛమైన, సహజమైన తెలుగులో జవాబు ఇవ్వండి"
  },
  'ta-IN': {
    system: `நீங்கள் டாக்டர் கேர் போட், ஒரு கருணை சுகாதார உதவியாளர். வெப்பமான, ஆதரவான சுகாதார ஆலோசனைகளை வழங்கவும்.

முக்கியமானது: வெற்று உரையை மட்டும் பயன்படுத்தவும். மார்க்அவுன் இல்லை, நட்சத்திரங்கள் இல்லை, புல்லட்டுகள் இல்லை. சத்தமாக வாசிக்கும் போது இயல்பாக ஒலிக்கும் முழுமையான வாக்கியங்களில் எழுதவும்.`,
    responseLanguage: "தூய, இயல்பான தமிழில் பதிலளிக்கவும்"
  },
  'kn-IN': {
    system: `ನೀವು ಡಾ. ಕೇರ್ ಬಾಟ್, ಕರುಣಾಮಯಿ ಆರೋಗ್ಯ ಸಹಾಯಕ. ಬೆಚ್ಚಗಿನ, ಬೆಂಬಲ ಆರೋಗ್ಯ ಸಲಹೆಗಳನ್ನು ಒದಗಿಸಿ.

ಮುಖ್ಯ: ಸಾದಾ ಪಠ್ಯವನ್ನು ಮಾತ್ರ ಬಳಸಿ. ಮಾರ್ಕ್ಡೌನ್ ಇಲ್ಲ, ನಕ್ಷತ್ರಗಳು ಇಲ್ಲ, ಬುಲೆಟ್‌ಗಳು ಇಲ್ಲ. ಜೋರಾಗಿ ಓದಿದಾಗ ಸಹಜವಾಗಿ ಧ್ವನಿಸುವ ಸಂಪೂರ್ಣ ವಾಕ್ಯಗಳಲ್ಲಿ ಬರೆಯಿರಿ.`,
    responseLanguage: "ಶುದ್ಧ, ಸಹಜ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ"
  },
  'ml-IN': {
    system: `നിങ്ങൾ ഡോ. കെയർ ബോട്ട്, ഒരു കാരുണ്യ ആരോഗ്യ സഹായി. ഊഷ്മളവും, പിന്തുണയും നൽകുന്ന ആരോഗ്യ ഉപദേശങ്ങൾ നൽകുക.

പ്രധാനം: പ്ലെയിൻ ടെക്സ്റ്റ് മാത്രം ഉപയോഗിക്കുക. മാർക്ക്ഡൗൺ ഇല്ല, നക്ഷത്രങ്ങൾ ഇല്ല, ബുള്ളറ്റുകൾ ഇല്ല. ഉച്ചത്തിൽ വായിക്കുമ്പോൾ സ്വാഭാവികമായി ശബ്ദിക്കുന്ന സമ്പൂർണ്ണ വാക്യങ്ങളിൽ എഴുതുക.`,
    responseLanguage: "ശുദ്ധമായ, സ്വാഭാവികമായ മലയാളത്തിൽ മറുപടി നൽകുക"
  }
};

async function processHealthQuery(userMessage, language = 'en-US') {
  // Fallback if Gemini is not available
  if (!genAI) {
    console.log('Using intelligent fallback for language:', language);
    return generateIntelligentResponse(userMessage, language);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const promptConfig = languagePrompts[language] || languagePrompts['en-US'];
    
    const prompt = `${promptConfig.system}

${promptConfig.responseLanguage}

User: ${userMessage}

Assistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return generateIntelligentResponse(userMessage, language);
  }
}

function generateIntelligentResponse(userMessage, language = 'en-US') {
  const lowerMessage = userMessage.toLowerCase();
  
  // Simple fallback responses in different languages
  const responses = {
    'en-US': `I understand you're not feeling well. Based on your symptoms, I recommend resting well, staying hydrated, and monitoring your condition. If symptoms persist or worsen, please consult a healthcare professional. Could you tell me more about your specific symptoms?`,
    
    'hi-IN': `मैं समझता हूं कि आप अच्छा महसूस नहीं कर रहे हैं। आपके लक्षणों के आधार पर, मैं अच्छी तरह आराम करने, हाइड्रेटेड रहने और अपनी स्थिति पर नजर रखने की सलाह देता हूं। यदि लक्षण बने रहते हैं या बिगड़ते हैं, तो कृपया किसी स्वास्थ्य पेशेवर से सलाह लें। क्या आप अपने विशिष्ट लक्षणों के बारे में और बता सकते हैं?`,
    
    'te-IN': `మీరు బాగా అనుభవించడం లేదని నేను అర్థం చేసుకున్నాను. మీ లక్షణాల ఆధారంగా, మంచి విశ్రాంతి తీసుకోవడం, హైడ్రేటెడ్ గా ఉండడం మరియు మీ స్థితిని పర్యవేక్షించడం నేను సిఫార్సు చేస్తున్నాను. లక్షణాలు కొనసాగితే లేదా అధ్వాన్నమైతే, దయచేసి హెల్త్కేర్ ప్రొఫెషనల్ ను సంప్రదించండి. మీ నిర్దిష్ట లక్షణాల గురించి మరింత చెప్పగలరా?`
  };

  return responses[language] || responses['en-US'];
}

module.exports = {
  processHealthQuery
};