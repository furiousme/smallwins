export function FoodsScreen() {
  return (
    <section className="screen placeholder-screen">
      <header>
        <p>Бібліотека</p>
        <h1>Страви</h1>
      </header>
      <article className="card empty-state">
        <div className="empty-icon" aria-hidden="true">
          +
        </div>
        <h2>Тут буде твоя база продуктів</h2>
        <p>У наступних фазах сюди додамо улюблені продукти, порції та швидкий вибір для щоденного логування.</p>
      </article>
    </section>
  );
}
