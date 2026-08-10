// src/features/feelingExercise/components/IntensitySlider.tsx
import { motion } from "framer-motion"
import clsx from "clsx"

interface Props {
  value: number | null
  onChange: (value: number) => void
  accentColor?: string
}

const LABELS: Record<number, string> = {
  1: "Kaum spürbar",
  5: "Deutlich",
  10: "Sehr intensiv",
}

export default function IntensitySlider({ value, onChange, accentColor = "#7FB3D3" }: Props) {
  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Beschriftung */}
      <div className="flex justify-between text-xs text-white/40 mb-3 px-1">
        <span>1 – Kaum spürbar</span>
        <span>10 – Sehr intensiv</span>
      </div>

      {/* Chips 1–10 */}
      <div className="flex gap-2 justify-center flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = value === n
          return (
            <motion.button
              key={n}
              onClick={() => onChange(n)}
              whileTap={{ scale: 0.9 }}
              className={clsx(
                "w-10 h-10 rounded-full font-bold text-sm transition-all duration-200",
                "border focus:outline-none",
                isSelected
                  ? "text-white border-transparent shadow-lg scale-110"
                  : "text-white/50 border-white/15 bg-white/5 hover:bg-white/10 hover:text-white/80"
              )}
              style={
                isSelected
                  ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                      boxShadow: `0 0 16px 4px ${accentColor}55`,
                    }
                  : {}
              }
            >
              {n}
            </motion.button>
          )
        })}
      </div>

      {/* Ausgewähltes Label */}
      {value !== null && (
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm mt-4 font-medium"
          style={{ color: accentColor }}
        >
          {LABELS[value] ?? `Intensität ${value}`}
        </motion.p>
      )}
    </div>
  )
}
