export type NotificationSupportStatus = "unsupported" | "default" | "granted" | "denied";

export function getNotificationStatus(): NotificationSupportStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationSupportStatus> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export function showLocalNotification(title: string, body: string) {
  if (getNotificationStatus() !== "granted") {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "small-wins-gentle-reminder",
  };

  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration) {
            return registration.showNotification(title, options);
          }

          new Notification(title, options);
          return undefined;
        })
        .catch(() => {
          new Notification(title, options);
        });
      return true;
    }

    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
