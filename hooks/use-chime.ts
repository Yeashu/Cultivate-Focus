import { useRef } from "react";

function triggerTone(audioContext: AudioContext, isDeepSession: boolean = false) {
  const now = audioContext.currentTime;

  if (isDeepSession) {
    // Mindful bell for 25+ minute sessions - a beautiful layered chime
    // First tone - deep resonant base
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(528, now); // "Love frequency" - Solfeggio
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 2.5);

    // Second tone - harmonic overtone
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(792, now + 0.1); // Perfect fifth above
    gain2.gain.setValueAtTime(0.001, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.08, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 2.0);

    // Third tone - high shimmer
    const osc3 = audioContext.createOscillator();
    const gain3 = audioContext.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1056, now + 0.2); // Octave above base
    gain3.gain.setValueAtTime(0.001, now + 0.2);
    gain3.gain.exponentialRampToValueAtTime(0.05, now + 0.25);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    osc3.connect(gain3);
    gain3.connect(audioContext.destination);
    osc3.start(now + 0.2);
    osc3.stop(now + 1.8);
  } else {
    // Standard simple chime for shorter sessions
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(now + 1.2);
  }
}

export function useChime() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const play = (isDeepSession: boolean = false) => {
    try {
      const existing = audioContextRef.current;
      if (existing) {
        triggerTone(existing, isDeepSession);
        return;
      }

      const extendedWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };

      const AudioContextClass = extendedWindow.AudioContext || extendedWindow.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const context = new AudioContextClass();
      audioContextRef.current = context;
      triggerTone(context, isDeepSession);
    } catch (error) {
      console.warn("Unable to play chime", error);
    }
  };

  return play;
}
