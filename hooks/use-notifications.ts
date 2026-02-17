import { useEffect, useRef, useState } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification sound
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.warn("Unable to request notification permission", error);
    }
  };

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        // Create a pleasant notification sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();

        // Play a pleasant two-tone chime
        const playTone = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);

          gainNode.gain.setValueAtTime(0.001, audioContext.currentTime + startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(audioContext.currentTime + startTime);
          oscillator.stop(audioContext.currentTime + startTime + duration);
        };

        // Play a pleasant melody: C5 -> E5 -> G5
        playTone(523.25, 0, 0.3);    // C5
        playTone(659.25, 0.15, 0.3); // E5
        playTone(783.99, 0.3, 0.5);  // G5
      }
    } catch (error) {
      console.warn("Unable to play notification sound", error);
    }
  };

  const showNotification = (title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    // Play sound regardless of notification permission
    playNotificationSound();

    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "cultivate-focus-timer",
          requireInteraction: false,
        });
      } catch (error) {
        console.warn("Unable to show notification", error);
      }
    }
  };

  return { permission, requestPermission, showNotification };
}
