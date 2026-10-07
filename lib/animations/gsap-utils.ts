import { gsap } from "gsap";

/**
 * 客户端环境安全校验，防止 SSR 水合报错
 */
export const isClient = typeof window !== "undefined";

/**
 * GSAP 丝滑滑动下划线 / 胶囊指示器补间
 * @param indicatorEl 指示器 DOM 元素
 * @param targetEl 当前激活的 Tab 按钮 DOM 元素
 */
export function animateTabIndicator(
  indicatorEl: HTMLElement | null,
  targetEl: HTMLElement | null
) {
  if (!isClient || !indicatorEl || !targetEl) return;

  const { offsetLeft, offsetWidth } = targetEl;

  gsap.to(indicatorEl, {
    x: offsetLeft,
    width: offsetWidth,
    duration: 0.35,
    ease: "power3.out",
    overwrite: "auto",
  });
}

/**
 * 内容平滑淡入滑入过渡（适用于 Tab / 场景切换）
 * @param element 目标容器 DOM
 * @param direction 滑动方向（'left' | 'right' | 'up'）
 */
export function animateContentSwitch(
  element: HTMLElement | null,
  direction: "left" | "right" | "up" = "up"
) {
  if (!isClient || !element) return;

  const yOffset = direction === "up" ? 12 : 0;
  const xOffset = direction === "left" ? -16 : direction === "right" ? 16 : 0;

  gsap.fromTo(
    element,
    {
      opacity: 0,
      x: xOffset,
      y: yOffset,
    },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: 0.38,
      ease: "power2.out",
      overwrite: "auto",
    }
  );
}

/**
 * 卡片 / 消息列表瀑布流轻度 Stagger 进场
 * @param elements DOM 元素列表
 */
export function animateStagger(
  elements: (HTMLElement | null)[],
  staggerTime = 0.05
) {
  if (!isClient || !elements.length) return;

  const validElements = elements.filter(Boolean) as HTMLElement[];
  if (!validElements.length) return;

  gsap.fromTo(
    validElements,
    {
      opacity: 0,
      y: 10,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.3,
      stagger: staggerTime,
      ease: "power2.out",
      overwrite: "auto",
    }
  );
}

/**
 * 徽章 / 按钮点击即时回弹强调
 * @param element 目标元素
 */
export function animatePulseTap(element: HTMLElement | null) {
  if (!isClient || !element) return;

  gsap.timeline()
    .to(element, { scale: 0.94, duration: 0.1, ease: "power1.in" })
    .to(element, { scale: 1, duration: 0.2, ease: "back.out(2)" });
}
