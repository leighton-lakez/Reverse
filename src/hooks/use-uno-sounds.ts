import { useCallback } from 'react';

export const useUnoSounds = () => {
  const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [audioContext]);

  const playCardPlace = useCallback(() => {
    // Quick "snap" sound - two quick tones
    playTone(400, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(350, 0.06, 'triangle', 0.15), 30);
  }, [playTone]);

  const playCardDraw = useCallback(() => {
    // Swoosh sound - descending tone
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  }, [audioContext]);

  const playSpecialCard = useCallback(() => {
    // Special action sound - rising then falling
    playTone(600, 0.1, 'square', 0.2);
    setTimeout(() => playTone(800, 0.08, 'square', 0.18), 80);
    setTimeout(() => playTone(700, 0.12, 'square', 0.15), 150);
  }, [playTone]);

  const playWin = useCallback(() => {
    // Victory fanfare - ascending notes
    const notes = [523, 659, 784, 1047]; // C, E, G, C (major chord arpeggio)
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, 0.4, 'sine', 0.25);
      }, index * 150);
    });
  }, [playTone]);

  const playLose = useCallback(() => {
    // Sad trombone effect - descending notes
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, 0.3, 'sawtooth', 0.2);
      }, index * 200);
    });
  }, [playTone]);

  const playReverse = useCallback(() => {
    // Quick up-down sound
    playTone(700, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(500, 0.08, 'triangle', 0.2), 70);
  }, [playTone]);

  const playSkip = useCallback(() => {
    // Two quick high beeps
    playTone(1000, 0.06, 'sine', 0.18);
    setTimeout(() => playTone(1200, 0.06, 'sine', 0.18), 80);
  }, [playTone]);

  const playDraw2 = useCallback(() => {
    // Two swooshes
    playCardDraw();
    setTimeout(() => playCardDraw(), 150);
  }, [playCardDraw]);

  const playWild = useCallback(() => {
    // Magical shimmer sound
    const freqs = [800, 1000, 1200, 1400, 1200, 1000];
    freqs.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, 0.08, 'sine', 0.15);
      }, index * 40);
    });
  }, [playTone]);

  return {
    playCardPlace,
    playCardDraw,
    playSpecialCard,
    playWin,
    playLose,
    playReverse,
    playSkip,
    playDraw2,
    playWild,
  };
};
