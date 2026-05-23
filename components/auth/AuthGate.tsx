"use client";

import { useCallback, useMemo, useState } from "react";
import { LOCAL_PIN, PIN_LENGTH } from "@/lib/auth/config";

interface AuthGateProps {
  onUnlock: () => Promise<void>;
}

const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"];

export function AuthGate({ onUnlock }: AuthGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const dots = useMemo(() => Array.from({ length: PIN_LENGTH }, (_, index) => index < pin.length), [pin]);

  const submit = useCallback(async (nextPin: string) => {
    if (nextPin === LOCAL_PIN) {
      setError("");
      await onUnlock();
      return;
    }

    setPin("");
    setError("Невірний PIN. Спробуй ще раз.");
    setIsShaking(true);
    window.setTimeout(() => setIsShaking(false), 520);
  }, [onUnlock]);

  function handleDigit(digit: string) {
    setPin((value) => {
      if (value.length >= PIN_LENGTH) {
        return value;
      }

      const nextPin = `${value}${digit}`;

      if (nextPin.length === PIN_LENGTH) {
        window.setTimeout(() => {
          void submit(nextPin);
        }, 120);
      }

      return nextPin;
    });
    setError("");
  }

  function handleDelete() {
    setPin((value) => value.slice(0, -1));
    setError("");
  }

  return (
    <main className="pin-screen">
      <section className="pin-panel">
        <div className="pin-copy">
          <p className="pin-kicker">Small Wins</p>
          <h1>Введи PIN</h1>
          <p>Твій приватний щоденник харчування захищено локально на цьому пристрої.</p>
        </div>

        <div className={`pin-dots ${isShaking ? "shake" : ""}`} aria-label="Введені цифри PIN">
          {dots.map((isFilled, index) => (
            <span key={index} className={isFilled ? "filled" : ""} />
          ))}
        </div>

        <p className="pin-error" aria-live="polite">
          {error}
        </p>

        <div className="keypad" aria-label="PIN клавіатура">
          {keypad.map((key, index) => {
            if (!key) {
              return <span key={`empty-${index}`} />;
            }

            if (key === "delete") {
              return (
                <button key={key} className="keypad-action" type="button" onClick={handleDelete} aria-label="Видалити цифру">
                  <span aria-hidden="true">⌫</span>
                </button>
              );
            }

            return (
              <button key={key} className="keypad-button" type="button" onClick={() => handleDigit(key)} aria-label={`Цифра ${key}`}>
                {key}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
