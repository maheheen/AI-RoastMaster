
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SpeechSynthesisEventWithCharIndex extends SpeechSynthesisEvent {
  charIndex: number;
}

export const useSpeechSynthesis = (onBoundary: (e: SpeechSynthesisEventWithCharIndex) => void, onEnd: () => void) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const voiceList = window.speechSynthesis.getVoices();
        if (voiceList.length > 0) {
          setVoices(voiceList);
          // Once voices are loaded, we don't need the listener anymore.
          if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = null;
          }
        }
      };
      
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
      }

    }
  }, []);

  const speak = useCallback((text: string, retries = 3) => {
    if (!isSupported || !text) {
      onEnd();
      return;
    }
    
    if (voices.length === 0 && retries > 0) {
        setTimeout(() => speak(text, retries - 1), 100);
        return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Prioritize high-quality, local, Hindi/Indian-English voices for Roman Urdu/Hindi
    const selectedVoice = 
        voices.find(voice => voice.lang === 'hi-IN' && voice.name.includes('Google') && voice.localService) ||
        voices.find(voice => voice.lang === 'hi-IN' && voice.name.includes('Google')) ||
        voices.find(voice => voice.lang === 'en-IN' && voice.localService) ||
        voices.find(voice => voice.lang === 'hi-IN') ||
        voices.find(voice => voice.lang.startsWith('en-'));


    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.pitch = 0.8;
    utterance.rate = 1.3;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd();
    };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setIsSpeaking(false);
      onEnd(); // Also call onEnd on error to reset state
    };

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        onBoundary(e as SpeechSynthesisEventWithCharIndex);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }, [isSupported, onBoundary, onEnd, voices]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, cancel, isSpeaking, isSupported };
};
