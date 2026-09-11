import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"

const API_BASE = import.meta.env.VITE_API_URL

interface SlideData {
  id: string
  title: string
  template: string
  type: string
  xp: number
  skippable: boolean
  props: Record<string, any>
}

type Step = "slide0" | "slide1_form" | "slide2" | "slide3_complete"

function TextSlide({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      {message && (
        <p className="text-sm text-gray-300 whitespace-pre-line">{message}</p>
      )}
    </div>
  )
}

export default function RelapseToolStandalone() {
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  const [slides, setSlides] = useState<SlideData[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>("slide0")
  const [reflection, setReflection] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const response = await fetch(API_BASE + "/tools/tool-relapse.json")
        const data = await response.json()
        setSlides(data.tool_relapse || [])
      } catch (error) {
        console.error("Fehler beim Laden der Rückfall-Tool-Slides:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSlides()
  }, [])

  if (loading || slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Wird geladen...
      </div>
    )
  }

  const getSlideForStep = (currentStep: Step): SlideData | null => {
    switch (currentStep) {
      case "slide0":
        return slides[0] ?? null
      case "slide1_form":
        return slides[1] ?? null
      case "slide2":
        return slides[2] ?? null
      case "slide3_complete":
        return slides[3] ?? null
      default:
        return null
    }
  }

  const currentSlide = getSlideForStep(step)

  const handleNext = async () => {
    if (step === "slide1_form" && reflection.trim() && api) {
      setSaving(true)
      try {
        await dispatch(
          patchUserProfile({
            api,
            patch: {
              meta: {
                tool_relapse_reflection: reflection.trim(),
              },
            },
          })
        ).unwrap()
      } catch (error) {
        console.error("Fehler beim Speichern:", error)
      } finally {
        setSaving(false)
      }
    }

    switch (step) {
      case "slide0":
        setStep("slide1_form")
        break
      case "slide1_form":
        setStep("slide2")
        break
      case "slide2":
        setStep("slide3_complete")
        break
    }
  }

  const handlePrev = () => {
    switch (step) {
      case "slide1_form":
        setStep("slide0")
        break
      case "slide2":
        setStep("slide1_form")
        break
      case "slide3_complete":
        setStep("slide2")
        break
    }
  }

  const stepNumbers = { slide0: 1, slide1_form: 2, slide2: 3, slide3_complete: 4 }
  const isFirstStep = step === "slide0"
  const isLastStep = step === "slide3_complete"
  const canProceed = step !== "slide1_form" || (reflection.trim().length >= 3 && !saving)

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-white/10">
        <h2 className="text-lg font-bold">🔁 Rückfall-Tool</h2>
        <p className="text-xs text-white/40 mt-0.5">Schritt {stepNumbers[step]}/4</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {step === "slide0" && currentSlide && (
            <motion.div key="0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TextSlide title={currentSlide.props.title} message={currentSlide.props.message} />
            </motion.div>
          )}

          {step === "slide1_form" && currentSlide && (
            <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h3 className="text-xl font-semibold mb-4">{currentSlide.props.title}</h3>
              {currentSlide.props.message && <p className="text-sm text-gray-300 mb-4">{currentSlide.props.message}</p>}
              <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Schreib hier auf..." 
                className={clsx("w-full p-4 rounded-lg bg-gray-800 border transition resize-none focus:outline-none focus:ring-2", 
                reflection.trim().length >= 3 ? "border-gray-600 focus:ring-green-500" : "border-gray-700 focus:ring-gray-600")} 
                rows={5} />
              <div className="text-xs text-gray-400 mt-2">{reflection.length} Zeichen
                {reflection.trim().length < 3 && <span className="ml-2 text-orange-400">(min. 3)</span>}
              </div>
            </motion.div>
          )}

          {step === "slide2" && currentSlide && (
            <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TextSlide title={currentSlide.props.title} message={currentSlide.props.message} />
            </motion.div>
          )}

          {step === "slide3_complete" && currentSlide && (
            <motion.div key="3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TextSlide title={currentSlide.props.title} message={currentSlide.props.message} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-white/10 px-5 py-4 flex gap-3">
        {!isFirstStep && (
          <button onClick={handlePrev} className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 transition text-sm">
            ← Zurück
          </button>
        )}
        <button onClick={handleNext} disabled={!canProceed}
          className={clsx("flex-1 px-4 py-2 rounded-lg font-medium text-sm transition",
          canProceed ? (isLastStep ? "bg-green-600 hover:bg-green-500" : "bg-white/10 hover:bg-white/20") : "bg-gray-700 text-gray-500")}>
          {saving ? "Speichert..." : isLastStep ? "Fertig ✓" : "Weiter"}
        </button>
      </div>
    </div>
  )
}
