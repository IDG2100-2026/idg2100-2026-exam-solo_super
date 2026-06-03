export const playSound = (path) => {
  const enabled = localStorage.getItem("soundEnabled") !== "false";
  if (!enabled) return;

  const audio = new Audio(path);
  audio.volume = 0.4;
  audio.play().catch(() => {});
};

export const playGameStart = () => playSound("/sounds/round_start.mp3");
export const playGameEnd = () => playSound("/sounds/end.mp3");
export const playRoundEnd = () => playSound("/sounds/round_end.mp3");
export const playRoll = () => playSound("/sounds/roll.mp3");
export const playHold = () => playSound("/sounds/hold.mp3");