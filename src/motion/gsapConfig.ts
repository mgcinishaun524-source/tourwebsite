import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import type Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, Flip);

export const MOTION_EASE = {
  cinema: 'power3.out',
  silk: 'power2.out',
  expo: 'expo.out',
  inOut: 'power3.inOut',
} as const;

export const MOTION_DURATION = {
  fast: 0.45,
  medium: 0.85,
  cinema: 1.15,
} as const;

let activeLenis: Lenis | null = null;

export function setLenisInstance(instance: Lenis | null) {
  activeLenis = instance;
}

export function getLenisInstance(): Lenis | null {
  return activeLenis;
}

export function pauseLenis() {
  activeLenis?.stop();
}

export function resumeLenis() {
  activeLenis?.start();
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger, Flip };
