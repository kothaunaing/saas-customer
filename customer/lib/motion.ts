/**
 * Shared Framer Motion variants for the customer-facing app.
 * All animations are "formal" — purposeful, measured, and non-distracting.
 */

// ─── Transition presets ────────────────────────────────────────────────────

export const ease = [0.22, 1, 0.36, 1] as const;

export const spring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
};

export const gentleSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
};

// ─── Page / section entry ─────────────────────────────────────────────────

/** Full-page fade + subtle upward slide. Used on every route change. */
export const pageVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease, staggerChildren: 0.07 },
  },
};

/** Lightweight fade for secondary sections within a page. */
export const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease },
  },
};

// ─── List / grid children ─────────────────────────────────────────────────

/** Parent that staggers its children. */
export const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

/** Individual list / grid item. */
export const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease },
  },
};

// ─── Slide transitions (step wizard) ─────────────────────────────────────

/** Enter from the right (forward navigation). */
export const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease },
  },
  exit: { opacity: 0, x: -30, transition: { duration: 0.22, ease } },
};

/** Enter from the left (back navigation). */
export const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease },
  },
  exit: { opacity: 0, x: 30, transition: { duration: 0.22, ease } },
};

// ─── Hero overlay ─────────────────────────────────────────────────────────

export const heroContentVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease, staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const heroChildVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

// ─── Banners / toasts ────────────────────────────────────────────────────

export const bannerVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...gentleSpring },
  },
};

// ─── Fade only (subtle, for overlays/dialogs) ────────────────────────────

export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, transition: { duration: 0.2, ease } },
};
