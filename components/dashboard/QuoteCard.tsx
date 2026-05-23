"use client";

import { useEffect, useState } from "react";
import { getRandomQuote } from "@/lib/utils/get-random-quote";
import type { Quote } from "@/lib/constants/quotes";

export function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  function showAnotherQuote() {
    setQuote((current) => getRandomQuote(current?.id));
  }

  if (!quote) {
    return <article className="quote-card quote-card-loading" aria-label="Мотиваційна цитата" />;
  }

  const author = quote.author?.trim();

  return (
    <article key={quote.id} className="quote-card" aria-label="Мотиваційна цитата">
      <span className="quote-mark" aria-hidden="true">
        “
      </span>
      <blockquote>«{quote.text}»</blockquote>
      <div className="quote-footer">
        {author ? <cite>— {author}</cite> : null}
        <button type="button" onClick={showAnotherQuote}>
          Ще одна думка
        </button>
      </div>
    </article>
  );
}
