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
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe("shouldReduceMotion", () => {
    it("returns false when prefers-reduced-motion is false", () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
      } as MediaQueryList);
      expect(shouldReduceMotion()).toBe(false);
    });

    it("returns true when prefers-reduced-motion is true", () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      } as MediaQueryList);
      expect(shouldReduceMotion()).toBe(true);
    });
  });

  describe("animateEntrance", () => {
    it("returns null if element is null", () => {
      expect(animateEntrance(null)).toBeNull();
    });

    it("immediately sets styles if shouldReduceMotion is true", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
      const div = document.createElement("div");
      const setSpy = vi.spyOn(gsap, "set");

      animateEntrance(div, { direction: "up" });
      expect(setSpy).toHaveBeenCalledWith(div, expect.objectContaining({
        opacity: 1,
        y: 0,
      }));
    });

    it("calls gsap.fromTo with up direction when motion is enabled", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
      const div = document.createElement("div");
      const fromToSpy = vi.spyOn(gsap, "fromTo");

      animateEntrance(div, { direction: "up", distance: 20 });
      expect(fromToSpy).toHaveBeenCalledWith(
        div,
        expect.objectContaining({ opacity: 0, y: 20 }),
        expect.objectContaining({ opacity: 1, y: 0 })
      );
    });

    it("calls gsap.fromTo with scale direction", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
      const div = document.createElement("div");
      const fromToSpy = vi.spyOn(gsap, "fromTo");

      animateEntrance(div, { direction: "scale" });
      expect(fromToSpy).toHaveBeenCalledWith(
        div,
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
      window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
      const div1 = document.createElement("div");
      const div2 = document.createElement("div");
      const setSpy = vi.spyOn(gsap, "set");

      animateStagger([div1, div2], { stagger: 0.1 });
      expect(setSpy).toHaveBeenCalledWith([div1, div2], expect.objectContaining({
        opacity: 1,
        y: 0,
      }));
    });

    it("animates elements with stagger when motion is enabled", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
      const div1 = document.createElement("div");
      const div2 = document.createElement("div");
      const fromToSpy = vi.spyOn(gsap, "fromTo");

      animateStagger([div1, div2], { stagger: 0.08, direction: "down", distance: 10 });
      expect(fromToSpy).toHaveBeenCalledWith(
        [div1, div2],
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
      window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
      const div = document.createElement("div");
      const setSpy = vi.spyOn(gsap, "set");

      animateContentSwitch(div, "left");
      expect(setSpy).toHaveBeenCalledWith(div, expect.objectContaining({ opacity: 1, x: 0 }));
    });
  });

  describe("animateTabIndicator", () => {
    it("returns null if indicator or target is null", () => {
      expect(animateTabIndicator(null, null)).toBeNull();
    });

    it("sets position immediately if reduce motion is active", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
      const ind = document.createElement("div");
      const btn = document.createElement("button");
      Object.defineProperty(btn, "offsetLeft", { value: 40 });
      Object.defineProperty(btn, "offsetWidth", { value: 80 });

      const setSpy = vi.spyOn(gsap, "set");
      animateTabIndicator(ind, btn);

      expect(setSpy).toHaveBeenCalledWith(ind, { x: 40, width: 80 });
    });
  });
});
