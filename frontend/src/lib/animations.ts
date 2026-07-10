/**
 * Shared Framer Motion variants & transitions.
 *
 * Performance principles:
 * - Only animate `transform` and `opacity` (GPU-composited, no reflow).
 * - Use spring physics sparingly (only for interactive elements).
 * - Keep durations short for perceived speed.
 * - `lazyMotion` + `domAnimation` feature bundle is used in layout.tsx
 *   so only ~15KB of motion features are shipped (not the full ~50KB).
 */

import type { Variants, Transition } from 'framer-motion';

// ── Easings ──────────────────────────────────────────────
export const EASE = [0.2, 0, 0, 1] as const; // Apple-like ease

// ── Page-level entrance ──────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: EASE },
  },
};

// ── Stagger container (parent) ───────────────────────────
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// ── Stagger children ─────────────────────────────────────
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE },
  },
};

// ── Card hover + tap ─────────────────────────────────────
export const cardHover = {
  whileHover: { y: -3 },
  whileTap: { scale: 0.99 },
  transition: { type: 'spring', stiffness: 400, damping: 30 },
} as const;

// ── Button tap ───────────────────────────────────────────
export const buttonTap = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 600, damping: 30 },
} as const;

// ── Modal ────────────────────────────────────────────────
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const modalPanel: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: 0.12, ease: EASE },
  },
};

// ── Chat message ─────────────────────────────────────────
export const messageBubbleInbound: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE } },
};

export const messageBubbleOutbound: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE } },
};

// ── Nav link hover ───────────────────────────────────────
export const navLinkHover = {
  whileHover: { x: 3 },
  transition: { type: 'spring', stiffness: 500, damping: 30 },
} as const;

// ── Collapse / expand ────────────────────────────────────
export const collapseVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { height: { duration: 0.25, ease: EASE }, opacity: { duration: 0.2, delay: 0.05 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: 0.2, ease: EASE }, opacity: { duration: 0.1 } },
  },
};

// ── Tab indicator (shared layoutId) ──────────────────────
export const tabIndicator: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// ── Spring for interactive feedback ──────────────────────
export const springSoft: Transition = { type: 'spring', stiffness: 400, damping: 30 };
export const springSnappy: Transition = { type: 'spring', stiffness: 600, damping: 25 };

// ── Reduced motion check ─────────────────────────────────
// Respects user's prefers-reduced-motion — returns instant transitions
export const reducedMotionTransition: Transition = { duration: 0 };