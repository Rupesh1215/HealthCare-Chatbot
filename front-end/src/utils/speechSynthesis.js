class SpeechSynthesis {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 0.8;
  }

  async init() {
    return new Promise((resolve) => {
      if (this.synth.getVoices().length > 0) {
        this.voices = this.synth.getVoices();
        this.selectVoice();
        resolve();
      } else {
        this.synth.onvoiceschanged = () => {
          this.voices = this.synth.getVoices();
          this.selectVoice();
          resolve();
        };
      }
    });
  }

  selectVoice(language = 'en-US') {
    // Prefer Google voices for better quality and accuracy
    const preferredVoices = this.voices.filter(voice => 
      voice.voiceURI.includes('Google') && voice.lang.includes(language)
    );
    if (preferredVoices.length > 0) {
      this.selectedVoice = preferredVoices[0];
    } else {
      // Fallback to any voice for the language
      const languageVoices = this.voices.filter(voice => 
        voice.lang.includes(language)
      );
      if (languageVoices.length > 0) {
        this.selectedVoice = languageVoices[0];
      } else {
        // If no suitable language voice is found, fallback to English
        this.selectedVoice = this.voices.find(v => v.lang.includes('en-US')) || null;
        // Optionally, add logging or UI feedback here
        if (!this.selectedVoice) {
          alert('No suitable voice found for selected language. Speech may not work.');
        }
      }
    }
  }

  speak(text, language = 'en-US') {
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    this.selectVoice(language);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.selectedVoice;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;
    utterance.lang = language;

    this.synth.speak(utterance);

    return new Promise((resolve) => {
      utterance.onend = resolve;
      utterance.onerror = resolve;
    });
  }

  stop() {
    this.synth.cancel();
  }

  isSpeaking() {
    return this.synth.speaking;
  }

  getAvailableLanguages() {
    const languages = new Set();
    this.voices.forEach(voice => {
      const langCode = voice.lang;
      languages.add(langCode);
    });
    return Array.from(languages);
  }
}

export const speechSynthesizer = new SpeechSynthesis();
