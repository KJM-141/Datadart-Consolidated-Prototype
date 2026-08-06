"use client";

import { useCallback } from "react";

/**
 * Signature micro-interaction: a gradient packet darts from the ADD TO CART
 * button into the nav cart badge (element tagged with [data-cart-target]).
 * No-op under reduced motion or when the target is off-screen (mobile sheet).
 */
export function useFlyToCart() {
  return useCallback((sourceEl: HTMLElement | null) => {
    if (!sourceEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = document.querySelector<HTMLElement>("[data-cart-target]");
    if (!target) return;
    const t = target.getBoundingClientRect();
    if (t.width === 0) return;

    const s = sourceEl.getBoundingClientRect();
    const start = { x: s.left + s.width / 2, y: s.top + s.height / 2 };
    const end = { x: t.left + t.width / 2, y: t.top + t.height / 2 };

    const dot = document.createElement("span");
    dot.style.cssText = `
      position: fixed; z-index: 100; pointer-events: none;
      left: ${start.x - 7}px; top: ${start.y - 7}px;
      width: 14px; height: 14px; border-radius: 9999px;
      background: linear-gradient(120deg,#8b30f5,#2f6bff);
      box-shadow: 0 4px 14px -2px rgb(91 69 245 / 55%);
    `;
    document.body.appendChild(dot);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const anim = dot.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        {
          transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.9)`,
          opacity: 1,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.4 },
      ],
      { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    anim.onfinish = () => dot.remove();
  }, []);
}
