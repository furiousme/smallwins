import { motivationalQuotes, type Quote } from "@/lib/constants/quotes";

const LAST_QUOTE_KEY = "small-wins:last-quote-id";

function readLastQuoteId() {
  try {
    return window.localStorage.getItem(LAST_QUOTE_KEY);
  } catch {
    return null;
  }
}

function rememberQuote(quote: Quote) {
  try {
    window.localStorage.setItem(LAST_QUOTE_KEY, quote.id);
  } catch {
    // Quote rotation still works for this session when localStorage is unavailable.
  }
}

export function getRandomQuote(previousQuoteId = readLastQuoteId()) {
  const availableQuotes =
    motivationalQuotes.length > 1 ? motivationalQuotes.filter((quote) => quote.id !== previousQuoteId) : motivationalQuotes;
  const quote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)] ?? motivationalQuotes[0];

  rememberQuote(quote);
  return quote;
}
