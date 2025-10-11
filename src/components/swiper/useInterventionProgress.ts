import { useEffect, useState } from "react"
import { api } from "../../api"

/**
 * Verwaltet den Fortschritt (aktuellen Slide-Index) einer Intervention.
 * ⚙️ Optimiert, um unnötige Re-Renders zu vermeiden.
 */
export function useInterventionProgress(
  externalSetStepIndex?: (idx: number) => void,
  externalSetInitialSlide?: (idx: number) => void
) {
  // interner State nur einmal initialisiert – keine Updates mehr pro Swipe
  const [stepIndex, setStepIndex] = useState(0)
  const [initialSlide, setInitialSlide] = useState(0)

  useEffect(() => {
    if (import.meta.env.DEV) console.log("🧠 useInterventionProgress init")

    // Beim ersten Laden aktuellen Fortschritt holen
    api.getCurrentStep().then((res: any) => {
      if (res?.stepIndex !== undefined) {
        setStepIndex(res.stepIndex)
        setInitialSlide(res.stepIndex)
        externalSetStepIndex?.(res.stepIndex)
        externalSetInitialSlide?.(res.stepIndex)

        if (import.meta.env.DEV)
          console.log("📍 Fortschritt geladen:", res.stepIndex)
      }
    })
  }, [])

  /**
   * Fortschritt speichern (z. B. bei Slide-Wechsel)
   * 💡 Kein React-State-Update → kein Re-Render
   */
  const setProgress = async (idx: number) => {
    await api.updateCurrentStep(idx)
    if (import.meta.env.DEV) console.log("💾 Fortschritt gespeichert:", idx)
  }

  /**
   * Fortschritt komplett zurücksetzen.
   * Hier wird bewusst der State aktualisiert, da das ein echter Reset ist.
   */
  const resetProgress = async (swiperRef?: React.RefObject<any>) => {
    await api.resetProgress()
    setStepIndex(0)
    setInitialSlide(0)
    externalSetStepIndex?.(0)
    externalSetInitialSlide?.(0)
    swiperRef?.current?.slideTo?.(0, 0)

    if (import.meta.env.DEV) console.log("♻️ Fortschritt zurückgesetzt")
  }

  useEffect(() => {
    if (import.meta.env.DEV)
      console.log("✅ useInterventionProgress bereit:", { stepIndex, initialSlide })
  }, [])

  return { stepIndex, initialSlide, setProgress, resetProgress }
}
