// src/ui/ScrollHintArrow.tsx
// Dezenter, pulsierender Pfeil, der anzeigt, dass in einem Container mit
// ausgeblendetem Scrollbalken (no-scrollbar) noch mehr Inhalt unterhalb liegt.
// Bewusst als eigene, kleine Komponente gehalten, damit sie in jeder
// Intervention wiederverwendbar ist (siehe useScrollHint.ts für den Hook).
//
// WICHTIG fürs Markup, damit der Pfeil beim Scrollen an derselben Stelle
// stehen bleibt statt mitzuscrollen:
//
//   <div className="relative flex-1 min-h-0">           ← nicht scrollend, position:relative
//     <div ref={scroll.ref} className="h-full overflow-y-auto no-scrollbar">
//       ...scrollender Inhalt...
//     </div>
//     <AnimatePresence>
//       {scroll.canScrollDown && (
//         <ScrollHintArrow onClick={() => scroll.scrollDown()} />
//       )}
//     </AnimatePresence>
//   </div>
//
// Der Pfeil MUSS außerhalb des scrollenden div liegen (Geschwister, nicht
// Kind) — sonst wird er als position:absolute-Nachkomme des scrollenden
// Elements mitgescrollt, statt fix zu bleiben.

import { motion } from "framer-motion"

interface ScrollHintArrowProps {
  onClick?: () => void
}

export default function ScrollHintArrow({ onClick }: ScrollHintArrowProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, 4, 0] }}
      exit={{ opacity: 0 }}
      transition={{ y: { repeat: Infinity, duration: 1.4, ease: "easeInOut" } }}
      onClick={onClick}
      className="pointer-events-auto absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 cursor-pointer z-10"
      aria-hidden="true"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </motion.div>
  )
}
