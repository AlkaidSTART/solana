"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { gsap } from "gsap";
import {
  animateEntrance,
  animateStagger,
  EntranceOptions,
  StaggerOptions,
} from "@/lib/animations/gsap-utils";
import { twMerge } from "tailwind-merge";

export interface GsapEntranceProps extends EntranceOptions {
  children?: React.ReactNode;
  className?: string;
  triggerKey?: unknown;
  as?: React.ElementType;
}

/**
 * 声明式 GSAP 单组件出现过渡容器
 */
export const GsapEntrance = forwardRef<HTMLElement, GsapEntranceProps>(
  (
    {
      children,
      className,
      direction = "up",
      distance = 16,
      duration = 0.38,
      delay = 0,
      ease = "power2.out",
      triggerKey,
      onComplete,
      as: Component = "div",
      ...props
    },
    ref
  ) => {
    const localRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => localRef.current as HTMLElement);

    useEffect(() => {
      const el = localRef.current;
      if (!el) return;

      const ctx = gsap.context(() => {
        animateEntrance(el, {
          direction,
          distance,
          duration,
          delay,
          ease,
          onComplete,
        });
      }, localRef);

      return () => {
        ctx.revert();
      };
    }, [direction, distance, duration, delay, ease, triggerKey, onComplete]);

    return (
      <Component
        ref={localRef}
        className={twMerge("will-change-transform", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
GsapEntrance.displayName = "GsapEntrance";

export interface GsapStaggerProps extends StaggerOptions {
  children?: React.ReactNode;
  selector?: string;
  className?: string;
  triggerKey?: unknown;
  as?: React.ElementType;
}

/**
 * 声明式 GSAP 子节点级联交错（Stagger）出现过渡容器
 */
export const GsapStagger = forwardRef<HTMLElement, GsapStaggerProps>(
  (
    {
      children,
      selector = "> *",
      className,
      stagger = 0.06,
      direction = "up",
      distance = 14,
      duration = 0.32,
      delay = 0,
      ease = "power2.out",
      triggerKey,
      onComplete,
      as: Component = "div",
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => containerRef.current as HTMLElement);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const ctx = gsap.context(() => {
        // 查找满足 selector 的子 DOM 节点
        const items = Array.from(
          container.querySelectorAll(selector)
        ) as HTMLElement[];

        if (items.length > 0) {
          animateStagger(items, {
            stagger,
            direction,
            distance,
            duration,
            delay,
            ease,
            onComplete,
          });
        }
      }, containerRef);

      return () => {
        ctx.revert();
      };
    }, [
      selector,
      stagger,
      direction,
      distance,
      duration,
      delay,
      ease,
      triggerKey,
      onComplete,
    ]);

    return (
      <Component ref={containerRef} className={className} {...props}>
        {children}
      </Component>
    );
  }
);
GsapStagger.displayName = "GsapStagger";

/**
 * Hook: 为指定 DOM 挂载 GSAP 出现过渡
 */
export function useGsapEntrance<T extends HTMLElement = HTMLDivElement>(
  options: EntranceOptions = {},
  deps: React.DependencyList = []
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      animateEntrance(el, options);
    }, ref);

    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Hook: 为容器子元素挂载 GSAP 级联交错过渡
 */
export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(
  selector: string = "> *",
  options: StaggerOptions = {},
  deps: React.DependencyList = []
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const items = Array.from(
        container.querySelectorAll(selector)
      ) as HTMLElement[];
      if (items.length > 0) {
        animateStagger(items, options);
      }
    }, ref);

    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
