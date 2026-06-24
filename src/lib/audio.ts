"use client";

let audioUnlocked = false;
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  sharedContext ??= new AudioContextCtor();
  return sharedContext;
}

async function unlockAudio() {
  if (audioUnlocked) {
    return;
  }

  const context = getAudioContext();
  if (context && context.state !== "running") {
    try {
      await context.resume();
    } catch {}
  }

  try {
    const audio = new Audio("/sounds/notification.wav");
    audio.volume = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  } catch {}

  audioUnlocked = true;
}

export function setupAudioUnlock() {
  if (typeof window === "undefined") {
    return () => {};
  }

  const events: Array<keyof WindowEventMap> = [
    "pointerdown",
    "keydown",
    "touchstart",
  ];

  const handleUnlock = () => {
    void unlockAudio();
  };

  events.forEach((eventName) => {
    window.addEventListener(eventName, handleUnlock, {
      passive: true,
      once: true,
    });
  });

  return () => {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handleUnlock);
    });
  };
}

export function playAudioFile(src: string, volume = 0.55) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {}
}

export function playToneSequence(
  tones: Array<{ frequency: number; offset: number; duration: number; gain: number }>,
) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const schedule = async () => {
    if (context.state !== "running") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }

    const now = context.currentTime;

    tones.forEach(({ frequency, offset, duration, gain }) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const startTime = now + offset;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration,
      );

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  };

  void schedule();
}
