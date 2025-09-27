// utils/textCleaner.js

export const cleanTextForSpeech = (text) => {
  if (typeof text !== 'string') return String(text);
  
  // Step 1: Remove all markdown and formatting
  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/``````/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[*#~`_\-]/g, ' ');

  // Step 2: Convert lists to natural speech
  cleaned = cleaned
    .replace(/\n\s*[-*•]\s*/g, '. ')
    .replace(/\n\s*\d+\.\s*/g, '. ');

  // Step 3: Clean punctuation for speech
  cleaned = cleaned
    .replace(/\s*\.\s*\.\s*\./g, '. ')
    .replace(/\s*,\s*/g, ' ')
    .replace(/\s*;\s*/g, '. ')
    .replace(/\s*:\s*/g, ' ')
    .replace(/\s*!\s*/g, '. ')
    .replace(/\s*\?\s*/g, '. ')
    .replace(/[\[\](){}"']/g, ' ')
    .replace(/@#$%&+=<>\/\\\|/g, ' ');

  // Step 4: Normalize whitespace and add pauses
  cleaned = cleaned
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Step 5: Ensure proper sentence endings
  if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
};


export const isHealthContent = (text) => {
  if (typeof text !== 'string') return false;
  
  const healthKeywords = [
    'fever', 'headache', 'cough', 'cold', 'stomach', 'pain', 'symptom',
    'medicine', 'doctor', 'health', 'medical', 'advice', 'treatment',
    'बुखार', 'सिरदर्द', 'खांसी', 'जुकाम', 'पेट', 'दर्द', 'लक्षण',
    'दवा', 'डॉक्टर', 'स्वास्थ्य', 'चिकित्सा', 'सलाह', 'इलाज',
    'జ్వరం', 'తలనొప్పి', 'దగ్గు', 'జలుబు', 'కడుపు', 'నొప్పి', 'లక్షణం',
    'మందు', 'డాక్టర్', 'ఆరోగ్యం', 'వైద్యం', 'సలహా', 'చికిత్స'
    // Add keywords for other languages...
  ];
  
  const lowerText = text.toLowerCase();
  return healthKeywords.some(keyword => lowerText.includes(keyword));
};