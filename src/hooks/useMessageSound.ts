"use client";

import { playAudioFile, playToneSequence } from "@/lib/audio";

export function playMessageBeep() {
  playAudioFile("/sounds/notification.wav", 0.5);
  playToneSequence([
    { frequency: 600, offset: 0, duration: 0.12, gain: 0.22 },
    { frequency: 420, offset: 0.06, duration: 0.08, gain: 0.15 },
  ]);
}
