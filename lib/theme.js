export const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "system") {
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    root.classList.toggle("dark", systemDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
};

export const cycleTheme = (currentMode) => {
  const modes = ["light", "dark", "system"];
  const next = modes[(modes.indexOf(currentMode) + 1) % modes.length];
  localStorage.setItem("theme", next);
  applyTheme(next);
  return next;
};
