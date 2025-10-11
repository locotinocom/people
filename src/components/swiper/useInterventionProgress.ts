import { useEffect, useState } from "react"
import { api } from "../../api"

/**
 * Verwaltet den Fortschritt (aktuellen Slide-Index) einer Intervention.
 * Speichert Fortschritt getrennt pro Level, damit beim Levelwechsel
 * korrekt fortgesetzt oder neu gestartet wird.
 */
export function useInterventionProgress(
  externalSetStepIndex?: (idx: number) => void,
  externalSetInitialSlide?: (idx: number) => void
) {
  const [stepIndex, setStepIndex] = useState(0)
  const [initialSlide, setInitialSlide] = useState(0)

  // 🧠 Initial: Fortschritt pro Level laden
  useEffect(() => {
    if (import.meta.env.DEV) console.log("🧠 useInterventionProgress init")

    const currentLevel = Number(localStorage.getItem("currentLevel") || "1")

    // Fortschritt für das aktuelle Level abrufen
    ;(async () => {
      try {
        const res = await api.getCurrentStep()
        if (res?.stepIndex !== undefined) {
          setStepIndex(res.stepIndex)
          setInitialSlide(res.stepIndex)

          externalSetStepIndex?.(res.stepIndex)
          externalSetInitialSlide?.(res.stepIndex)

          if (import.meta.env.DEV)
            console.log(`📍 Fortschritt für Level ${currentLevel} geladen:`, res.stepIndex)
        }
      } catch (err) {
        console.warn("⚠️ Fortschritt konnte nicht geladen werden:", err)
      }
    })()
  }, [externalSetStepIndex, externalSetInitialSlide])

  /**
   * Fortschritt speichern (z. B. bei Slide-Wechsel)
   * 💡 Kein React-State-Update → kein Re-Render
   */
  const setProgress = async (idx: number) => {
    try {
      const currentLevel = Number(localStorage.getItem("currentLevel") || "1")
      await api.updateCurrentStep(idx)

      if (import.meta.env.DEV)
        console.log(`💾 Fortschritt gespeichert (Level ${currentLevel}):`, idx)
    } catch (err) {
      console.warn("⚠️ Fortschritt konnte nicht gespeichert werden:", err)
    }
  }

  /**
   * Fortschritt komplett zurücksetzen (z. B. nach Levelwechsel)
   */
  const resetProgress = async (swiperRef?: React.RefObject<any>) => {
    try {
      const currentLevel = Number(localStorage.getItem("currentLevel") || "1")
      await api.resetProgress() 

      setStepIndex(0)
      setInitialSlide(0)
      externalSetStepIndex?.(0)
      externalSetInitialSlide?.(0)
      swiperRef?.current?.slideTo?.(0, 0)

      if (import.meta.env.DEV)
        console.log(`♻️ Fortschritt für Level ${currentLevel} zurückgesetzt`)
    } catch (err) {
      console.warn("⚠️ Fortschritt konnte nicht zurückgesetzt werden:", err)
    }
  }

  // Nur Debug-Ausgabe beim Mount
  useEffect(() => {
    if (import.meta.env.DEV)
      console.log("✅ useInterventionProgress bereit:", { stepIndex, initialSlide })
  }, [])

  return { stepIndex, initialSlide, setProgress, resetProgress }
}
