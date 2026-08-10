// src/features/feelingExercise/components/FeelingBubbles.tsx
// Animierte Sprechblasen während des Fühl-Prozesses
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { EmotionType } from "../types"
import { FEELING_BUBBLE_TEXTS } from "../constants/feelingBubbleTexts"

interface Props {
  emotion: EmotionType
  accentColor?: string
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function FeelingBubbles({ emotion, accentColor = "#7FB3D3" }: Props) {
  const texts = FEELING_BUBBLE_TEXTS[emotion]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleNext = (index: number) => {
    // Text für ~4s halten, dann fade out
    timeoutRef.current = setTimeout(() => {
      setVisible(false)

      // Nach fade-out (~1.5s) nächsten Text einblenden
      timeoutRef.current = setTimeout(() => {
        const nextIndex = (index + 1) % texts.length
        setCurrentIndex(nextIndex)
        setVisible(true)
        // Nächste Runde nach 5–8s
        scheduleNext(nextIndex)
      }, 1500)
    }, randomBetween(4000, 6000))
  }

  useEffect(() => {
    setCurrentIndex(0)
    setVisible(true)
    scheduleNext(0)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion])

  return (
    <div className="flex items-center justify-center min-h-[80px] px-6">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={`${emotion}-${currentIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="text-center text-lg font-light leading-relaxed max-w-xs"
            style={{ color: accentColor }}
          >
            {texts[currentIndex]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
