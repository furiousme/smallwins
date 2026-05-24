"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { BottomNavigation, type AppTab } from "@/components/layout/BottomNavigation";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { FoodsScreen } from "@/components/foods/FoodsScreen";
import { ProgressScreen } from "@/components/progress/ProgressScreen";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { ReminderScheduler } from "@/components/reminders/ReminderScheduler";
import { createAuthSession, getValidAuthSession, clearAuthSession } from "@/lib/auth/session";
import { registerServiceWorker } from "@/lib/pwa/registerServiceWorker";
import { getSettings, updateTheme } from "@/lib/db/settings";
import { applyTheme } from "@/lib/themes/applyTheme";
import { defaultThemeId, getTheme } from "@/lib/themes/config";

type AuthState = "checking" | "locked" | "unlocked";

export function SmallWinsApp() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [activeTab, setActiveTab] = useState<AppTab>("today");
  const [themeId, setThemeId] = useState(defaultThemeId);

  const activeTheme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const [session, settings] = await Promise.all([getValidAuthSession(), getSettings()]);

      if (!isMounted) {
        return;
      }

      setThemeId(settings.themeId);
      setAuthState(session ? "unlocked" : "locked");
    }

    bootstrap().catch(() => {
      if (isMounted) {
        setAuthState("locked");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleUnlock() {
    await createAuthSession();
    setAuthState("unlocked");
  }

  async function handleThemeChange(nextThemeId: string) {
    setThemeId(nextThemeId);
    await updateTheme(nextThemeId);
  }

  async function handleLogout() {
    await clearAuthSession();
    setActiveTab("today");
    setAuthState("locked");
  }

  if (authState === "checking") {
    return (
      <main className="app-shell">
        <div className="screen loading-screen">
          <div className="loading-mark" />
          <p>Small Wins</p>
        </div>
      </main>
    );
  }

  if (authState === "locked") {
    return <AuthGate onUnlock={handleUnlock} />;
  }

  return (
    <main className="app-shell">
      <ReminderScheduler />
      {activeTab === "today" ? <DashboardScreen /> : null}
      {activeTab === "foods" ? <FoodsScreen /> : null}
      {activeTab === "progress" ? <ProgressScreen /> : null}
      {activeTab === "settings" ? (
        <SettingsScreen themeId={themeId} onThemeChange={handleThemeChange} onLogout={handleLogout} />
      ) : null}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
