import { themes } from "@/lib/themes/config";

interface SettingsScreenProps {
  themeId: string;
  onThemeChange: (themeId: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function SettingsScreen({ themeId, onThemeChange, onLogout }: SettingsScreenProps) {
  return (
    <section className="screen settings-screen">
      <header>
        <p>Особистий простір</p>
        <h1>Налаштування</h1>
      </header>

      <section className="card settings-section">
        <div className="section-heading">
          <h2>Тема</h2>
          <span>Збережено локально</span>
        </div>

        <div className="theme-list" role="radiogroup" aria-label="Вибір теми">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={themeId === theme.id ? "theme-option active" : "theme-option"}
              onClick={() => {
                void onThemeChange(theme.id);
              }}
              role="radio"
              aria-checked={themeId === theme.id}
            >
              <span className="theme-swatch" style={{ background: theme.swatch }} />
              <span>{theme.name}</span>
              <small>{themeId === theme.id ? "Активна" : "Обрати"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="soft-card settings-section compact">
        <div className="section-heading">
          <h2>Денні цілі</h2>
          <span>Скоро</span>
        </div>
        <p>Калорії, білки, жири та вуглеводи будуть налаштовуватися тут.</p>
      </section>

      <button className="secondary-button logout-button" type="button" onClick={() => void onLogout()}>
        Вийти
      </button>
    </section>
  );
}
