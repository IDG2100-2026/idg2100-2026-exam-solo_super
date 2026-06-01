export const playSound = (path) => {
  const enabled =
    localStorage.getItem("soundEnabled") !== "false";

  if (!enabled) return;

  const audio = new Audio(path);
  audio.volume = 0.4;
  audio.play().catch(() => {});
};

export const playClick = () => {
  playSound("/sounds/click.mp3");
};