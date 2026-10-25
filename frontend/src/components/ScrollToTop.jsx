import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollToTop() {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previous;
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (!hash) {
      scrollToTop();
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ block: "start" });
      return;
    }

    scrollToTop();
  }, [pathname, hash]);

  return null;
}
