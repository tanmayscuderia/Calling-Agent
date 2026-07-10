'use client';

/**
 * Reusable Framer Motion wrapper components.
 *
 * These use `m` (lazy) components + `LazyMotion` from layout.tsx,
 * so they stay tree-shakeable and lightweight.
 * Only `transform` + `opacity` are animated for 60fps performance.
 */

import { m } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';
import {
  pageVariants,
  staggerContainer,
  staggerItem,
  cardHover,
  buttonTap,
  navLinkHover,
} from '@/lib/animations';

// ── Page wrapper — fades + slides on mount ───────────────
export function MotionPage({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <m.div variants={pageVariants} initial="initial" animate="animate" style={style}>
      {children}
    </m.div>
  );
}

// ── Stagger container — staggers children on mount ───────
export function MotionStagger({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <m.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={style}
      className={className}
    >
      {children}
    </m.div>
  );
}

// ── Stagger child — must be inside <MotionStagger> ───────
export function MotionStaggerItem({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <m.div variants={staggerItem} style={style} className={className}>
      {children}
    </m.div>
  );
}

// ── Card with hover lift + tap ───────────────────────────
export function MotionCard({
  children,
  style,
  className,
  onClick,
  hover = true,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <m.div
      {...(hover ? cardHover : {})}
      style={style}
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </m.div>
  );
}

// ── Button with tap spring ───────────────────────────────
export function MotionButton({
  children,
  style,
  className,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <m.button
      {...buttonTap}
      style={style}
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </m.button>
  );
}

// ── Nav link with hover slide ────────────────────────────
export function MotionNavLink({
  children,
  style,
  className,
  onClick,
  href,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  href: string;
}) {
  return (
    <m.a {...navLinkHover} style={style} className={className} onClick={onClick} href={href}>
      {children}
    </m.a>
  );
}