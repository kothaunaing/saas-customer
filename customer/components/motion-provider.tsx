"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { ease } from "@/customer/lib/motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.32, ease }}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={pathname}
            className="app-route-motion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
          >
            {children}
          </m.div>
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
}
