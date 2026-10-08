/** First focusable element: jumps over the navigation to `#main-content`. */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-full bg-accent px-5 py-2.5 font-medium text-on-accent focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      Saltar al contenido principal
    </a>
  );
}
