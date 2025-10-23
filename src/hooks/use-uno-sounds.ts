import { useCallback } from 'react';

export const useUnoSounds = () => {
  const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

  const playCardPlace = useCallback(() => {
    if (!audioContext) return;

    // Realistic card snap - using noise and filtered tone
    const bufferSize = audioContext.sampleRate * 0.08;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate short burst of noise for card snap
    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - (i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * decay * 0.3;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();

    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.08);
  }, [audioContext]);

  const playCardDraw = useCallback(() => {
    if (!audioContext) return;

    // Smooth card slide sound
    const osc = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();

    osc.type = 'sine';
    filter.type = 'lowpass';

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.frequency.setValueAtTime(300, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);

    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.2);
  }, [audioContext]);

  const playWin = useCallback(() => {
    if (!audioContext) return;

    // Bright, cheerful victory melody
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },      // C5
      { freq: 659.25, time: 0.15, duration: 0.15 },   // E5
      { freq: 783.99, time: 0.3, duration: 0.15 },    // G5
      { freq: 1046.50, time: 0.45, duration: 0.4 }    // C6
    ];

    notes.forEach(note => {
      setTimeout(() => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = note.freq;

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.duration);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + note.duration);
      }, note.time * 1000);
    });
  }, [audioContext]);

  const playLose = useCallback(() => {
    if (!audioContext) return;

    // Gentle descending tones
    const notes = [
      { freq: 392, time: 0, duration: 0.25 },
      { freq: 349.23, time: 0.2, duration: 0.25 },
      { freq: 293.66, time: 0.4, duration: 0.4 }
    ];

    notes.forEach(note => {
      setTimeout(() => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = note.freq;

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.duration);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + note.duration);
      }, note.time * 1000);
    });
  }, [audioContext]);

  const playReverse = useCallback(() => {
    if (!audioContext) return;

    // Whoosh up and down
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.type = 'sine';
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.08);
    osc.frequency.linearRampToValueAtTime(400, audioContext.currentTime + 0.16);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.16);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.16);
  }, [audioContext]);

  const playSkip = useCallback(() => {
    if (!audioContext) return;

    // Subtle double beep
    [0, 0.1].forEach((delay, index) => {
      setTimeout(() => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 880;

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.08);
      }, delay * 1000);
    });
  }, [audioContext]);

  const playDraw2 = useCallback(() => {
    if (!audioContext) return;

    // Two smooth swooshes
    [0, 0.15].forEach((delay) => {
      setTimeout(() => {
        const osc = audioContext.createOscillator();
        const filter = audioContext.createBiquadFilter();
        const gainNode = audioContext.createGain();

        osc.type = 'sine';
        filter.type = 'lowpass';

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc.frequency.setValueAtTime(300, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);

        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.15);
      }, delay * 1000);
    });
  }, [audioContext]);

  const playWild = useCallback(() => {
    if (!audioContext) return;

    // Magical shimmer with bell-like tones
    const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51];

    notes.forEach((freq, index) => {
      setTimeout(() => {
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 2; // Harmonic

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.06, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        osc1.start(audioContext.currentTime);
        osc2.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.15);
        osc2.stop(audioContext.currentTime + 0.15);
      }, index * 50);
    });
  }, [audioContext]);

  const playSpecialCard = useCallback(() => {
    playWild();
  }, [playWild]);

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
