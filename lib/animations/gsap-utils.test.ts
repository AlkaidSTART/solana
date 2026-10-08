import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  shouldReduceMotion,
  animateEntrance,
  animateStagger,
  animateContentSwitch,
  animateTabIndicator,
} from "./gsap-utils";
import { gsap } from "gsap";

describe("gsap-utils", () => {
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;

  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { window: unknown }).window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  });

  describe("shouldReduceMotion", () => {
    it("returns false when prefers-reduced-motion is false", () => {
      (globalThis as unknown as { window: { matchMedia: ReturnType<typeof vi.fn> } }).window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
      });
      expect(shouldReduceMotion()).toBe(false);
    });

    it("returns true when prefers-reduced-motion is true", () => {
      (globalThis as unknown as { window: { matchMedia: ReturnType<typeof vi.fn> } }).window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      });
      expect(shouldReduceMotion()).toBe(true);
    });

    it("returns false when window is undefined", () => {
      delete (globalThis as unknown as { window?: unknown }).window;
      expect(shouldReduceMotion()).toBe(false);
    });
  });

  describe("animateEntrance", () => {
    it("returns null if element is null", () => {
      expect(animateEntrance(null)).toBeNull();
    });

    it("returns null if window is undefined", () => {
      delete (globalThis as unknown as { window?: unknown }).window;
      const el = {} as HTMLElement;
      expect(animateEntrance(el)).toBeNull();
    });

    it("immediately sets styles if shouldReduceMotion is true", () => {
      (globalThis as unknown as { window: { matchMedia: ReturnType<typeof vi.fn> } }).window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      });
      const el = {} as HTMLElement;
      const setSpy = vi.spyOn(gsap, "set");

      animateEntrance(el, { direction: "up" });
      expect(setSpy).toHaveBeenCalledWith(
        el,
        expect.objectContaining({
          opacity: 1,
          y: 0,
        })
      );
    });

    it("calls gsap.fromTo with up direction when motion is enabled", () => {
      const el = {} as HTMLElement;
      const fromToSpy = vi.spyOn(gsap, "fromTo");

      animateEntrance(el, { direction: "up", distance: 20 });
      expect(fromToSpy).toHaveBeenCalledWith(
        el,
        expect.objectContaining({ opacity: 0, y: 20 }),
        expect.objectContaining({ opacity: 1, y: 0 })
      );
    });

    it("calls gsap.fromTo with scale direction", () => {
      const el = {} as HTMLElement;
      const fromToSpy = vi.spyOn(gsap, "fromTo");

      animateEntrance(el, { direction: "scale" });
      expect(fromToSpy).toHaveBeenCalledWith(
        el,
        expect.objectContaining({ opacity: 0, scale: 0.94 }),
        expect.objectContaining({ opacity: 1, scale: 1 })
      );
    });
  });

  describe("animateStagger", () => {
    it("returns null for empty elements array", () => {
      expect(animateStagger([])).toBeNull();
      expect(animateStagger([null, null])).toBeNull();
    });

    it("immediately sets styles if shouldReduceMotion is true", () => {
      (globalThis as unknown as { window: { matchMedia: ReturnType<typeof vi.fn> } }).window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      });
      const el1 = {} as HTMLElement;
      const el2 = {} as HTMLElement;
      const setSpy = vi.spyOn(gsap, "set");

      animateStagger([el1, el2], { stagger: 0.1 });
      expect(setSpy).toHaveBeenCalledWith(
        [el1, el2],
        expect.objectContaining({
          opacity: 1,
          y: 0,
        })
      );
    });

    it("animates elements with stagger when motion is enabled", () => {
      const el1 = {} as HTMLElement;
      const el2 = {} as HTMLElement;
      const fromToSpy = vi.spyOn(gsap, "fromTo");

      animateStagger([el1, el2], { stagger: 0.08, direction: "down", distance: 10 });
      expect(fromToSpy).toHaveBeenCalledWith(
        [el1, el2],
        expect.objectContaining({ opacity: 0, y: -10 }),
        expect.objectContaining({ opacity: 1, y: 0, stagger: 0.08 })
      );
    });
  });

  describe("animateContentSwitch", () => {
    it("returns null if element is null", () => {
      expect(animateContentSwitch(null)).toBeNull();
    });

    it("sets immediately when reduceMotion is active", () => {
      (globalThis as unknown as { window: { matchMedia: ReturnType<typeof vi.fn> } }).window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      });
      const el = {} as HTMLElement;
      const setSpy = vi.spyOn(gsap, "set");

      animateContentSwitch(el, "left");
      expect(setSpy).toHaveBeenCalledWith(el, expect.objectContaining({ opacity: 1, x: 0 }));
    });
  });

  describe("animateTabIndicator", () => {
    it("returns null if indicator or target is null", () => {
      expect(animateTabIndicator(null, null)).toBeNull();
    });

    it("sets position immediately if reduce motion is active", () => {
      (globalThis as unknown as { window: { matchMedia: ReturnType<typeof vi.fn> } }).window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      });
      const ind = {} as HTMLElement;
      const btn = { offsetLeft: 40, offsetWidth: 80 } as HTMLElement;

      const setSpy = vi.spyOn(gsap, "set");
      animateTabIndicator(ind, btn);

      expect(setSpy).toHaveBeenCalledWith(
        ind,
        expect.objectContaining({ x: 40, width: 80 })
      );
    });
  });
});
