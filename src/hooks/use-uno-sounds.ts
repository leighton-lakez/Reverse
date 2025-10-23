import { useCallback } from 'react';

export const useUnoSounds = () => {
  const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

  const playCardPlace = useCallback(() => {
    if (!audioContext) return;

    // Ultra-realistic card snap - layered sounds
    const now = audioContext.currentTime;

    // Layer 1: Initial impact (high-frequency snap)
    const snapBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.05, audioContext.sampleRate);
    const snapData = snapBuffer.getChannelData(0);
    for (let i = 0; i < snapData.length; i++) {
      const decay = Math.exp(-i / (snapData.length * 0.3));
      snapData[i] = (Math.random() * 2 - 1) * decay * 0.5;
    }

    const snap = audioContext.createBufferSource();
    const snapFilter = audioContext.createBiquadFilter();
    const snapGain = audioContext.createGain();

    snap.buffer = snapBuffer;
    snapFilter.type = 'highpass';
    snapFilter.frequency.value = 3000;
    snapFilter.Q.value = 1;

    snap.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(audioContext.destination);

    snapGain.gain.setValueAtTime(0.25, now);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    snap.start(now);

    // Layer 2: Card body resonance (mid-frequency thump)
    const thumpOsc = audioContext.createOscillator();
    const thumpFilter = audioContext.createBiquadFilter();
    const thumpGain = audioContext.createGain();

    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(180, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    thumpFilter.type = 'lowpass';
    thumpFilter.frequency.value = 400;
    thumpFilter.Q.value = 2;

    thumpOsc.connect(thumpFilter);
    thumpFilter.connect(thumpGain);
    thumpGain.connect(audioContext.destination);

    thumpGain.gain.setValueAtTime(0.15, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    thumpOsc.start(now);
    thumpOsc.stop(now + 0.15);

    // Layer 3: Table surface contact (low rumble)
    const rumbleBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
    const rumbleData = rumbleBuffer.getChannelData(0);
    for (let i = 0; i < rumbleData.length; i++) {
      const decay = Math.exp(-i / (rumbleData.length * 0.5));
      rumbleData[i] = (Math.random() * 2 - 1) * decay * 0.2;
    }

    const rumble = audioContext.createBufferSource();
    const rumbleFilter = audioContext.createBiquadFilter();
    const rumbleGain = audioContext.createGain();

    rumble.buffer = rumbleBuffer;
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 200;
    rumbleFilter.Q.value = 3;

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(audioContext.destination);

    rumbleGain.gain.setValueAtTime(0.12, now + 0.01);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    rumble.start(now + 0.01);
  }, [audioContext]);

  const playCardDraw = useCallback(() => {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Layer 1: Card friction against other cards (textured noise)
    const frictionBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.25, audioContext.sampleRate);
    const frictionData = frictionBuffer.getChannelData(0);
    for (let i = 0; i < frictionData.length; i++) {
      const envelope = 1 - (i / frictionData.length);
      const texture = Math.sin(i * 0.1) * 0.3; // Add texture
      frictionData[i] = ((Math.random() * 2 - 1) * envelope + texture) * 0.15;
    }

    const friction = audioContext.createBufferSource();
    const frictionFilter = audioContext.createBiquadFilter();
    const frictionGain = audioContext.createGain();

    friction.buffer = frictionBuffer;
    frictionFilter.type = 'bandpass';
    frictionFilter.frequency.setValueAtTime(2500, now);
    frictionFilter.frequency.exponentialRampToValueAtTime(1500, now + 0.25);
    frictionFilter.Q.value = 2;

    friction.connect(frictionFilter);
    frictionFilter.connect(frictionGain);
    frictionGain.connect(audioContext.destination);

    frictionGain.gain.setValueAtTime(0.12, now);
    frictionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    friction.start(now);

    // Layer 2: Air displacement (swoosh)
    const swooshOsc = audioContext.createOscillator();
    const swooshFilter = audioContext.createBiquadFilter();
    const swooshGain = audioContext.createGain();

    swooshOsc.type = 'sine';
    swooshOsc.frequency.setValueAtTime(250, now);
    swooshOsc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

    swooshFilter.type = 'lowpass';
    swooshFilter.frequency.setValueAtTime(800, now);
    swooshFilter.frequency.exponentialRampToValueAtTime(150, now + 0.22);
    swooshFilter.Q.value = 1.5;

    swooshOsc.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(audioContext.destination);

    swooshGain.gain.setValueAtTime(0.08, now);
    swooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    swooshOsc.start(now);
    swooshOsc.stop(now + 0.22);

    // Layer 3: Subtle card bend/flex sound
    const flexOsc = audioContext.createOscillator();
    const flexGain = audioContext.createGain();

    flexOsc.type = 'triangle';
    flexOsc.frequency.value = 90;

    flexOsc.connect(flexGain);
    flexGain.connect(audioContext.destination);

    flexGain.gain.setValueAtTime(0.04, now + 0.05);
    flexGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    flexOsc.start(now + 0.05);
    flexOsc.stop(now + 0.18);
  }, [audioContext]);

  const playWin = useCallback(() => {
    if (!audioContext) return;

    // Epic victory fanfare with harmonics
    const notes = [
      { freq: 523.25, time: 0, duration: 0.12 },      // C5
      { freq: 659.25, time: 0.12, duration: 0.12 },   // E5
      { freq: 783.99, time: 0.24, duration: 0.12 },   // G5
      { freq: 1046.50, time: 0.36, duration: 0.5 }    // C6 (held)
    ];

    notes.forEach((note, index) => {
      setTimeout(() => {
        const now = audioContext.currentTime;

        // Fundamental frequency
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = note.freq;
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);

        // Harmonic (adds brightness)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = note.freq * 2;
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        // Third harmonic (richness)
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.type = 'triangle';
        osc3.frequency.value = note.freq * 1.5;
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);

        const volume = index === notes.length - 1 ? 0.18 : 0.15;

        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(volume, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + note.duration);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(volume * 0.4, now + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + note.duration);

        gain3.gain.setValueAtTime(0, now);
        gain3.gain.linearRampToValueAtTime(volume * 0.25, now + 0.01);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + note.duration);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + note.duration);
        osc2.stop(now + note.duration);
        osc3.stop(now + note.duration);
      }, note.time * 1000);
    });

    // Add celebration "sparkle" sounds
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const now = audioContext.currentTime;
        const freq = 1000 + Math.random() * 1500;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioContext.destination);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
      }, 200 + i * 80);
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

    const now = audioContext.currentTime;

    // Spinning/swooshing sound with doppler effect
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    filter.type = 'lowpass';

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    // Rising swoosh
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.linearRampToValueAtTime(900, now + 0.12);
    osc1.frequency.linearRampToValueAtTime(300, now + 0.22);

    // Lower harmonic for depth
    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.linearRampToValueAtTime(450, now + 0.12);
    osc2.frequency.linearRampToValueAtTime(150, now + 0.22);

    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.12);
    filter.frequency.linearRampToValueAtTime(400, now + 0.22);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  }, [audioContext]);

  const playSkip = useCallback(() => {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Quick jump/hop sounds
    [0, 0.08].forEach((delay, index) => {
      setTimeout(() => {
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 950;
        osc2.frequency.value = 1250; // Harmony

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);

        const t = audioContext.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.06);
        osc2.stop(t + 0.06);
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
