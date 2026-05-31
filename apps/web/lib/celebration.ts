import confetti from "canvas-confetti";

interface CelebrationOptions {
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

/**
 * Trigger a confetti celebration
 */
export function celebrate(options: CelebrationOptions = {}) {
  const {
    duration = 2000,
    particleCount = 100,
    spread = 70,
    origin = { x: 0.5, y: 0.6 },
    colors = ["#D7FF3A", "#6EE7A8", "#FFB547", "#7AB8FF"],
  } = options;

  confetti({
    particleCount,
    spread,
    origin,
    colors,
    disableForReducedMotion: true,
    zIndex: 9999,
  });

  // Launch multiple bursts for a more impressive effect
  if (duration > 1000) {
    setTimeout(() => {
      confetti({
        particleCount: particleCount * 0.5,
        spread: spread * 0.8,
        origin: { x: origin.x - 0.2, y: origin.y },
        colors,
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: particleCount * 0.5,
        spread: spread * 0.8,
        origin: { x: origin.x + 0.2, y: origin.y },
        colors,
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    }, 400);
  }
}

/**
 * Celebrate a new badge unlock
 */
export function celebrateBadgeUnlock(tier: "bronze" | "silver" | "gold" | "platinum") {
  const tierColors = {
    bronze: ["#CD7F32", "#B87333", "#A0522D"],
    silver: ["#C0C0C0", "#A8A8A8", "#909090"],
    gold: ["#FFD700", "#DAA520", "#B8860B"],
    platinum: ["#E5E4E2", "#C0C0C0", "#A9A9A9"],
  };

  celebrate({
    particleCount: 150,
    spread: 100,
    colors: tierColors[tier],
  });
}

/**
 * Celebrate leveling up
 */
export function celebrateLevelUp(newLevel: number) {
  celebrate({
    particleCount: 200,
    spread: 120,
    duration: 3000,
    colors: ["#D7FF3A", "#6EE7A8", "#FFB547", "#FF5B5B", "#7AB8FF"],
  });

  // Launch from multiple origins
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.2, y: 0.7 },
      colors: ["#D7FF3A", "#6EE7A8"],
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  }, 300);

  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.8, y: 0.7 },
      colors: ["#FFB547", "#7AB8FF"],
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  }, 500);
}

/**
 * Celebrate achieving a streak milestone
 */
export function celebrateStreakMilestone(days: number) {
  celebrate({
    particleCount: 120,
    spread: 80,
    colors: ["#FF5B5B", "#FFB547", "#FFD700"], // Fire colors
  });

  // Fire burst effect
  const end = Date.now() + 1000;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#FF5B5B", "#FFB547"],
      disableForReducedMotion: true,
      zIndex: 9999,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#FF5B5B", "#FFB547"],
      disableForReducedMotion: true,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
