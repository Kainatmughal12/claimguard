"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { OVERALL_RISK_BORDER_CLASS, OVERALL_RISK_LABEL, OVERALL_RISK_TEXT_CLASS } from "@/lib/severity";
import type { OverallRisk } from "@/lib/types";

// The one deliberate risk in this design: the verdict doesn't read like
// another badge among many — it lands like a seal on the review, the way
// a compliance judgment would on a physical document. Angle varies slightly
// per verdict so it doesn't feel like a stamped-out template.
const STAMP_ANGLE: Record<OverallRisk, number> = {
  pass: 2.5,
  needs_revision: -2,
  high_risk: -3.5,
};

interface VerdictStampProps {
  risk: OverallRisk;
  delay?: number;
}

export function VerdictStamp({ risk, delay = 0 }: VerdictStampProps) {
  const reduceMotion = useReducedMotion();
  const angle = STAMP_ANGLE[risk];

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.6, rotate: 0 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: angle }}
      transition={
        reduceMotion
          ? { duration: 0.2, delay }
          : { type: "spring", stiffness: 260, damping: 14, mass: 0.9, delay }
      }
      className={cn(
        "inline-flex shrink-0 flex-col items-center gap-0.5 rounded-md border-[3px] px-4 py-1.5",
        "before:pointer-events-none before:absolute before:inset-[3px] before:rounded-[3px] before:border before:border-current before:opacity-40",
        "relative select-none",
        OVERALL_RISK_BORDER_CLASS[risk],
      )}
      style={{ transformOrigin: "center" }}
    >
      <span
        className={cn(
          "font-heading text-lg leading-none font-semibold tracking-[0.14em] uppercase italic",
          OVERALL_RISK_TEXT_CLASS[risk],
        )}
      >
        {OVERALL_RISK_LABEL[risk]}
      </span>
    </motion.div>
  );
}
