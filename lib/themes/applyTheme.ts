import type { AppTheme } from "@/lib/themes/config";

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement;

  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--surface", theme.colors.surface);
  root.style.setProperty("--surface-strong", theme.colors.surfaceStrong);
  root.style.setProperty("--text", theme.colors.text);
  root.style.setProperty("--muted", theme.colors.muted);
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-strong", theme.colors.primaryStrong);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--danger", theme.colors.danger);
  root.style.setProperty("--ring", theme.colors.ring);

  const metaThemeColor = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
  metaThemeColor?.setAttribute("content", theme.colors.primary);
}
