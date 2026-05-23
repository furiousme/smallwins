"use client";

export type AppTab = "today" | "foods" | "settings";

interface BottomNavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: Array<{ id: AppTab; label: string; icon: string }> = [
  { id: "today", label: "Сьогодні", icon: "◐" },
  { id: "foods", label: "Страви", icon: "＋" },
  { id: "settings", label: "Налаштування", icon: "⌘" },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Основна навігація">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? "active" : ""}
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          <span aria-hidden="true">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
