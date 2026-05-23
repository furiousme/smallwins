export interface AppTheme {
  id: string;
  name: string;
  swatch: string;
  colors: {
    background: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    muted: string;
    primary: string;
    primaryStrong: string;
    accent: string;
    danger: string;
    ring: string;
  };
}

export const themes: AppTheme[] = [
  {
    id: "sage-calm",
    name: "Sage Calm",
    swatch: "#8fae9b",
    colors: {
      background: "#f7f4ed",
      surface: "#fffaf3",
      surfaceStrong: "#ffffff",
      text: "#26342d",
      muted: "#718174",
      primary: "#8fae9b",
      primaryStrong: "#5e866e",
      accent: "#e7b98a",
      danger: "#c86b62",
      ring: "rgba(94, 134, 110, 0.2)",
    },
  },
  {
    id: "peach-glow",
    name: "Peach Glow",
    swatch: "#e9a27f",
    colors: {
      background: "#fbf1ea",
      surface: "#fff8f1",
      surfaceStrong: "#ffffff",
      text: "#382b27",
      muted: "#8a746a",
      primary: "#e9a27f",
      primaryStrong: "#c77558",
      accent: "#9bb9a3",
      danger: "#bd5f65",
      ring: "rgba(199, 117, 88, 0.2)",
    },
  },
  {
    id: "lavender-mist",
    name: "Lavender Mist",
    swatch: "#a89bd7",
    colors: {
      background: "#f4f0f8",
      surface: "#fffaff",
      surfaceStrong: "#ffffff",
      text: "#2f2b3a",
      muted: "#7b7387",
      primary: "#a89bd7",
      primaryStrong: "#7f72b7",
      accent: "#d8a87d",
      danger: "#c16978",
      ring: "rgba(127, 114, 183, 0.2)",
    },
  },
];

export const defaultThemeId = "sage-calm";

export function getTheme(themeId: string) {
  return themes.find((theme) => theme.id === themeId) ?? themes[0];
}
