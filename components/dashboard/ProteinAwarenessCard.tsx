import type { DailyTarget, NutritionTotals } from "@/types/models";
import { getProteinAwarenessMessage } from "@/lib/wellness/proteinAwareness";
import { formatMacro } from "@/lib/nutrition/format";

interface ProteinAwarenessCardProps {
  totals: NutritionTotals;
  target?: DailyTarget;
}

export function ProteinAwarenessCard({ totals, target }: ProteinAwarenessCardProps) {
  const message = getProteinAwarenessMessage(totals, target);

  if (!message || !target) {
    return null;
  }

  return (
    <aside className="protein-awareness-card" aria-label="М'яка підказка про білок">
      <span aria-hidden="true">🌿</span>
      <div>
        <strong>{message}</strong>
        <p>
          Зараз {formatMacro(totals.protein)} з {formatMacro(target.protein)}. Без поспіху, просто як маленька підказка.
        </p>
      </div>
    </aside>
  );
}
