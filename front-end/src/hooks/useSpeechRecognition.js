import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export const useSpeechRecognitionHook = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const timeoutRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && !listening) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (transcript.trim().length > 0) {
          onResult(transcript, selectedLanguage);
          resetTranscript();
        }
      }, 1000);
    }
  }, [transcript, listening, onResult, resetTranscript, selectedLanguage]);

  const startListening = (language = 'en-US') => {
    setSelectedLanguage(language);
    SpeechRecognition.startListening({
      continuous: true,
      language: language
    });
    setIsListening(true);
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const supportedLanguages = [
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' }
  ];

  return {
    transcript,
    isListening: listening,
    startListening,
    stopListening,
    supportedLanguages,
    selectedLanguage,
    setSelectedLanguage,
    browserSupportsSpeechRecognition
  };
};