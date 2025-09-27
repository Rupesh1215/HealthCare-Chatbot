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

// System prompt template with English formatting
const SYSTEM_PROMPT_EN = `You are Dr. CareBot, a compassionate and highly experienced medical professional. When users describe health concerns, provide comprehensive advice with CLEAR FORMATTING:

IMPORTANT FORMATTING RULES:
1. Use line breaks between sections (double line breaks)
2. Use bullet points for lists
3. Use bold for section headers
4. Keep each section clearly separated
5. Make it easy to read on a mobile device

ALWAYS include these sections with proper formatting:

**Symptoms Analysis:**
[Analyze the mentioned symptoms and their possible causes]

**Precautions:**
[Specific care instructions and preventive measures - use bullet points]

**Medicine:**
[Appropriate medication suggestions - always recommend doctor consultation - use bullet points]

**Food:**
[Dietary recommendations and foods to consume/avoid - use bullet points]

**Additional Advice:**
[Warning signs and when to seek emergency care - use bullet points]

Format your response in a warm, empathetic, and professional manner. Be specific and practical in your advice. Use proper line breaks and spacing for mobile readability.`;

// Language prompt mappings with instructions for natural text and no markdown for non-English
const languagePrompts = {
  'en-US': {
    system: SYSTEM_PROMPT_EN,
    responseLanguage: "Respond in clear, well-formatted English using markdown formatting as instructed"
  },
  'hi-IN': {
    system: `आप डॉ. केयरबॉट हैं, एक दयालु और अनुभवी स्वास्थ्य पेशेवर। जब उपयोगकर्ता स्वास्थ्य समस्याएं बताते हैं, तो कृपया सहानुभूतिपूर्ण और व्यावहारिक सलाह दें। कृपया केवल सादे पाठ का उपयोग करें। कोई मार्कडाउन, तारांकन या बुलेट्स नहीं। पूर्ण वाक्यों में व्याख्या करें।`,
    responseLanguage: "साफ और प्राकृतिक हिंदी में उत्तर दें"
  },
  'te-IN': {
    system: `మీరు డాక్టర్ కేర్‌బాట్‌, ఒక కరుణాశీలుడు మరియు అనుభవం గల వైద్య నిపుణుడు. వినియోగదారులు ఆరోగ్య సమస్యలు వివరించినప్పుడు, మీరు సహాయంగా, సహజమైన మరియు ఉపయోగకరమైన సలహాలు ఇవ్వాలి. సాదా వచనం మాత్రమే వాడండి. మార్క్డౌన్, బుల్లెట్లు ఉపయోగించవద్దు. పూర్తి వాక్యాల్లో వివరించండి.`,
    responseLanguage: "స్వచ్ఛమైన, సహజమైన తెలుగులో స్పందించండి"
  },
  'ta-IN': {
    system: `நீங்கள் டாக்டர் கேர்பாட், ஒரு பராமரிப்பாளரும் மிகவும் அனுபவமுள்ள மருத்துவ நிபுணரும். பயனர்கள் உடல் நலக்கேடுகளை விவரிக்கும் போது, தயவுடன் மற்றும் பயன்படக்கூடிய ஆலோசனைகளை வழங்கவும். சீரான உரை வடிவத்துடன் மட்டுமே பதிலளிக்கவும். மார்க்டவுன், பூட்டுகளோ அல்லது பட்டியலோ பயன்படுத்த வேண்டாம்.`,
    responseLanguage: "தெளிவான தமிழ் மொழியில் பதிலளிக்கவும்"
  },
  'kn-IN': {
    system: `ನೀವು ಡಾಕ್ಟರ್ ಕೇರ್ ಬಾಟ್, ಒಬ್ಬ ದಯಾಳು ಹಾಗೂ ಅನುಭವ Assister. ಬಳಕೆದಾರರು ಆರೋಗ್ಯ ಸಂಬಂಧಿತ ಸಮಸ್ಯೆಗಳನ್ನು ವಿವರಿಸಿದಾಗ, ಸಹಾನುಭೂತಿಯುತ ಮತ್ತು ಪ್ರಾಯೋಗಿಕ ಸಲಹೆಗಳನ್ನು ನೀಡಿ. ಸರಳ ಪಠ್ಯದಲ್ಲಿ ಮಾತ್ರ ಪ್ರತಿಕ್ರಿಯೆ ನೀಡಬೇಕು. ಮಾರ್ಕ್ಡೌನ್ ಅಥವಾ ಬುಲೆಟ್ ಪಾಯಿಂಟ್ಗಳನ್ನು ಬಳಸಬೇಡಿ.`,
    responseLanguage: "ಸ್ವಚ್ಛವಾಗಿರು ಕನ್ನಡದಲ್ಲಿಹಿಂದೆ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವಂತೆ ಉತ್ತರಿಸು"
  },
  'ml-IN': {
    system: `നിങ്ങൾ ഡോക്ടർ കെയർബോട്ടാണ്, കരുണയുള്ള, പരിചയസമ്പന്നനായ ഒരു മെഡിക്കൽ പ്രൊഫഷണൽ. ഉപയോക്താക്കൾ ആരോഗ്യ പ്രശ്‌നങ്ങൾ വിവരിക്കുമ്പോൾ, ഉപകരണപരമായ, സ്വാഭാവികമായ ഉപദേശം നൽകണം. മാർക്ക്ഡൗൺ, ബുള്ളറ്റുകൾ ഉപയോഗിക്കാതെ, സുതാര്യമായ പതിവ് വാചകങ്ങളിൽ എഴുതുക.`,
    responseLanguage: "സ്വാഭാവിക മലയാളം ഉപയോഗിച്ച് മറുപടി നൽകുക"
  }
};

async function processHealthQuery(userMessage, userId, language = 'en-US') {
  if (!genAI) {
    console.log('Gemini unavailable, using fallback for:', language);
    return generateIntelligentResponse(userMessage, language);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
  const fallbackResponses = {
    'en-US': `I understand you're unwell. Based on your symptoms, please rest well, stay hydrated, and monitor your condition carefully. Consult a doctor if symptoms persist or worsen. Could you please provide more details about your symptoms?`,
    'hi-IN': `मुझे समझ है कि आप अस्वस्थ हैं। आपके लक्षणों के आधार पर, कृपया अच्छी तरह आराम करें, पानी पीते रहें, और अपनी स्थिति पर नजर रखें। यदि लक्षण बने रहें या खराब हों तो डॉक्टर से संपर्क करें। कृपया अपने लक्षणों के बारे में और बताएं।`,
    'te-IN': `మీరు ఆరోగ్యంగా లాగా అనిపించడం లేదు. మీ లక్షణాల ఆధారంగా మంచి విశ్రాంతి తీసుకోండి, నీళ్ళు తాగండి మరియు మీ పరిస్థితిని గమనించండి. లక్షణాలు కొనసాగితే డాక్టర్ని సంప్రదించండి. మీ లక్షణాల గురించి మరింత వివరించగలరా?`,
    'ta-IN': `நீங்கள் சுகமாக இல்லை என்று புரிகிறது. உங்கள் அறிகுறிகளின் அடிப்படையில், நல்ல ஓய்வு எடுக்கவும், நீர் அருந்தவும் மற்றும் உங்களது நிலையை கவனியுங்கள். அறிகுறிகள் தொடர்ந்தால் மருத்துவரை அணுகவும். உங்கள் அறிகுறிகள் பற்றி மேலும் விளக்கமளிக்க முடியுமா?`,
    'kn-IN': `ನೀವು ಆರೋಗ್ಯಕರರಾಗಿಲ್ಲವೆಂದು ಅರ್ಥವಾಗುತ್ತದೆ. ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಆಧಾರದಲ್ಲ, ಉತ್ತಮ ವಿಶ್ರಾಂತಿ ಕೈಗೊಳ್ಳಿ, ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ನಿಮ್ಮ ಸ್ಥಿತಿಯನ್ನು ಗಮನಿಸಿ. ಲಕ್ಷಣಗಳು ಮುಂದುವರಿದರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಬಗ್ಗೆ ವಿವರವಾಗಿ ಹೇಳಬಹುದುವೇ?`,
    'ml-IN': `നിങ്ങൾക്ക് ആരോഗ്യ പ്രശ്നങ്ങളേർപ്പെട്ടിരിക്കുമെന്ന് തോന്നുന്നു. നിങ്ങളുടെ ലക്ഷണങ്ങളെ അടിസ്ഥാനമാക്കി, വിശ്രമിക്കുക, ജലാംശം പൂർണ്ണമാക്കുക, സ്ഥിതി നിരീക്ഷിക്കുക. ലക്ഷണങ്ങൾ തുടർന്നാൽ ഡോക്ടറെ സമീപിക്കുക. നിങ്ങളുടെ ലക്ഷണങ്ങൾ കൂടുതലായി വിവരിക്കാമോ?`
  };

  return fallbackResponses[language] || fallbackResponses['en-US'];
}

module.exports = {
  processHealthQuery
};
