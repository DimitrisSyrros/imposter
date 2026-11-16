import { useEffect, useRef } from "react";

let firstScreen = true;

// One screen = one <main> with one <h1>. When the screen changes, focus moves to
// the new heading so keyboard and screen-reader users land at the top.
export function Screen({ title, titleClassName = "h", before, children, className = "app" }) {
  const heading = useRef(null);

  useEffect(() => {
    if (firstScreen) {
      firstScreen = false;
      return;
    }
    heading.current?.focus();
  }, []);

  return (
    <main className={className}>
      {before}
      <h1 ref={heading} tabIndex={-1} className={titleClassName}>
        {title}
      </h1>
      {children}
    </main>
  );
}
