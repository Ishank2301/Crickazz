import { Variants, Transition } from 'framer-motion';

export const standardSpring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
};

export const smoothEase: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1], // Cubic bezier for athletic fluid feel
};

export const containerStaggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const cardEntryVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const cardHoverProps = {
  whileHover: { y: -2, transition: { duration: 0.2 } },
};

export const accordionVariants: Variants = {
  collapsed: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
    transition: {
      duration: 0.25,
      ease: [0.33, 1, 0.68, 1],
    },
  },
  expanded: {
    opacity: 1,
    height: 'auto',
    overflow: 'visible',
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const tabTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const scoreUpdateVariants: Variants = {
  initial: { scale: 0.95, opacity: 0.8 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

export const commentaryItemVariants: Variants = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};
