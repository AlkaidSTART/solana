import { gsap } from "gsap";

/**
 * 客户端环境安全校验，防止 SSR 水合报错
 */
export const isClient = () => typeof window !== "undefined";

/**
 * 用户是否启用了“减少动态效果”偏好 (WCAG 2.1 / Accessibility)
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return Boolean(window.matchMedia("(prefers-reduced-motion: reduce)")?.matches);
}

export interface EntranceOptions {
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  distance?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  onComplete?: () => void;
}

export interface StaggerOptions {
  stagger?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  distance?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  onComplete?: () => void;
}

/**
 * 单个元素的出现过渡动画
 * @param element 目标 DOM
 * @param options 配置项
 */
export function animateEntrance(
  element: HTMLElement | null,
  options: EntranceOptions = {}
) {
  if (typeof window === "undefined" || !element) return null;

  const {
    direction = "up",
    distance = 16,
    duration = 0.38,
    delay = 0,
    ease = "power2.out",
    onComplete,
  } = options;

  if (shouldReduceMotion()) {
    return gsap.set(element, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      onComplete,
    });
  }

  let fromProps: gsap.TweenVars = { opacity: 0 };
  let toProps: gsap.TweenVars = {
    opacity: 1,
    duration,
    delay,
    ease,
    overwrite: "auto",
    onComplete,
  };

  switch (direction) {
    case "up":
      fromProps = { ...fromProps, y: distance };
      toProps = { ...toProps, y: 0 };
      break;
    case "down":
      fromProps = { ...fromProps, y: -distance };
      toProps = { ...toProps, y: 0 };
      break;
    case "left":
      fromProps = { ...fromProps, x: distance };
      toProps = { ...toProps, x: 0 };
      break;
    case "right":
      fromProps = { ...fromProps, x: -distance };
      toProps = { ...toProps, x: 0 };
      break;
    case "scale":
      fromProps = { ...fromProps, scale: 0.94 };
      toProps = { ...toProps, scale: 1 };
      break;
    case "fade":
    default:
      break;
  }

  return gsap.fromTo(element, fromProps, toProps);
}

/**
 * GSAP 丝滑滑动下划线 / 胶囊指示器补间
 * @param indicatorEl 指示器 DOM 元素
 * @param targetEl 当前激活的 Tab 按钮 DOM 元素
 */
export function animateTabIndicator(
  indicatorEl: HTMLElement | null,
  targetEl: HTMLElement | null
) {
  if (typeof window === "undefined" || !indicatorEl || !targetEl) return null;

  const { offsetLeft, offsetWidth } = targetEl;

  if (shouldReduceMotion()) {
    return gsap.set(indicatorEl, {
      x: offsetLeft,
      width: offsetWidth,
    });
  }

  return gsap.to(indicatorEl, {
    x: offsetLeft,
    width: offsetWidth,
    duration: 0.32,
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
  if (typeof window === "undefined" || !element) return null;

  if (shouldReduceMotion()) {
    return gsap.set(element, {
      opacity: 1,
      x: 0,
      y: 0,
    });
  }

  const yOffset = direction === "up" ? 12 : 0;
  const xOffset = direction === "left" ? -16 : direction === "right" ? 16 : 0;

  return gsap.fromTo(
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
      duration: 0.32,
      ease: "power2.out",
      overwrite: "auto",
    }
  );
}

/**
 * 卡片 / 消息列表瀑布流轻度 Stagger 级联进场
 * @param elements DOM 元素列表
 * @param optionsOrTime 配置项或简写 stagger 时间
 */
export function animateStagger(
  elements: (HTMLElement | null)[],
  optionsOrTime: StaggerOptions | number = 0.05
) {
  if (typeof window === "undefined" || !elements.length) return null;

  const validElements = elements.filter(Boolean) as HTMLElement[];
  if (!validElements.length) return null;

  const options: StaggerOptions =
    typeof optionsOrTime === "number"
      ? { stagger: optionsOrTime }
      : optionsOrTime;

  const {
    stagger = 0.05,
    direction = "up",
    distance = 12,
    duration = 0.3,
    delay = 0,
    ease = "power2.out",
    onComplete,
  } = options;

  if (shouldReduceMotion()) {
    return gsap.set(validElements, {
      opacity: 1,
      x: 0,
      y: 0,
      onComplete,
    });
  }

  let fromProps: gsap.TweenVars = { opacity: 0 };
  let toProps: gsap.TweenVars = {
    opacity: 1,
    duration,
    delay,
    stagger,
    ease,
    overwrite: "auto",
    onComplete,
  };

  switch (direction) {
    case "up":
      fromProps = { ...fromProps, y: distance };
      toProps = { ...toProps, y: 0 };
      break;
    case "down":
      fromProps = { ...fromProps, y: -distance };
      toProps = { ...toProps, y: 0 };
      break;
    case "left":
      fromProps = { ...fromProps, x: distance };
      toProps = { ...toProps, x: 0 };
      break;
    case "right":
      fromProps = { ...fromProps, x: -distance };
      toProps = { ...toProps, x: 0 };
      break;
    case "fade":
    default:
      break;
  }

  return gsap.fromTo(validElements, fromProps, toProps);
}

/**
 * 徽章 / 按钮点击即时微回弹强调
 * @param element 目标元素
 */
export function animatePulseTap(element: HTMLElement | null) {
  if (typeof window === "undefined" || !element) return null;
  if (shouldReduceMotion()) return null;

  return gsap
    .timeline()
    .to(element, { scale: 0.94, duration: 0.08, ease: "power1.in" })
    .to(element, { scale: 1, duration: 0.18, ease: "back.out(2)" });
}
