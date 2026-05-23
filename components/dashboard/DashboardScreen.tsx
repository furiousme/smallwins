const macros = [
  { label: "Білки", value: "82 г", percent: "68%" },
  { label: "Жири", value: "48 г", percent: "54%" },
  { label: "Вуглеводи", value: "176 г", percent: "62%" },
];

export function DashboardScreen() {
  return (
    <section className="screen dashboard-screen">
      <header className="home-header">
        <div>
          <p>Привіт 🌿</p>
          <h1>Small Wins</h1>
          <span>Твої маленькі перемоги сьогодні</span>
        </div>
      </header>

      <article className="card calories-card">
        <div className="calories-topline">
          <span>Калорії</span>
          <strong>1 420 / 2 100</strong>
        </div>
        <div className="calories-progress" aria-label="Прогрес калорій">
          <span style={{ width: "68%" }} />
        </div>
        <div className="calories-summary">
          <div>
            <strong>680</strong>
            <span>залишилось</span>
          </div>
          <div>
            <strong>68%</strong>
            <span>плану</span>
          </div>
        </div>
      </article>

      <div className="macro-grid">
        {macros.map((macro) => (
          <article key={macro.label} className="soft-card macro-card">
            <span>{macro.label}</span>
            <strong>{macro.value}</strong>
            <small>{macro.percent}</small>
          </article>
        ))}
      </div>

      <button className="primary-button" type="button">
        + Додати їжу
      </button>

      <section className="soft-card day-note">
        <span>Сьогодні</span>
        <p>Тут скоро зʼявиться швидке логування прийомів їжі та підсумки дня.</p>
      </section>
    </section>
  );
}
