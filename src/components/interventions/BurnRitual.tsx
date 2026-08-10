import { useRef, useState, useCallback, memo, useEffect } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "../../ui/AvatarBubble"
import CampfireAnimation from "../animations/CampfireAnimation"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { useTemplateContext } from "@helpers/useTemplateContext"
import { applyTemplate } from "@helpers/template"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types & Helpers
======================= */

type BurnRitualData = {
  id: number
  xp?: number
  slug: string
  title: string
  burnText: string
  instructionBefore: string
  burnButtonText: string
  instructionAfter: string
  saveTo: string
  chunkCount?: number
}

type Phase = "idle" | "igniting" | "ready" | "burning" | "complete"

function assignPatchValue(patch: Record<string, unknown>, saveTo: string, value: unknown): void {
  const dotIndex = saveTo.indexOf(".")
  if (dotIndex === -1) {
    patch[saveTo] = value
  } else {
    const top = saveTo.slice(0, dotIndex)
    const rest = saveTo.slice(dotIndex + 1)
    if (!patch[top] || typeof patch[top] !== "object" || Array.isArray(patch[top])) {
      patch[top] = {}
    }
    assignPatchValue(patch[top] as Record<string, unknown>, rest, value)
  }
}

function splitTextIntoChunks(text: string, n: number): string[] {
  const words = text.split(" ")
  const size = Math.ceil(words.length / n)
  const chunks: string[] = []
  
  for (let i = 0; i < n; i++) {
    const chunk = words.slice(i * size, (i + 1) * size).join(" ")
    if (chunk) chunks.push(chunk)
  }
  return chunks.length > 0 ? chunks : [text]
}

/* =======================
   Animation Variants
======================= */

/* =======================
   Globale Animation-Variants (Jetzt streng typisiert)
======================= */

const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: "easeInOut" } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } },
}

const buttonVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 5 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, y: -5, transition: { duration: 0.2, ease: "easeIn" } },
}

/* =======================
   BurnRitualNew
======================= */

function BurnRitualNew({ data }: { data: BurnRitualData }) {
  const {
    id,
    xp = 0,
    title,
    burnText,
    instructionBefore,
    burnButtonText,
    instructionAfter,
    saveTo,
    chunkCount = 4,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const templateCtx = useTemplateContext()

  const resolvedBurnText = applyTemplate(burnText, templateCtx).join("")
  const chunks = splitTextIntoChunks(resolvedBurnText, chunkCount)

  const [phase, setPhase] = useState<Phase>("idle")
  const [remainingChunks, setRemainingChunks] = useState<string[]>(chunks)
  const [currentChunk, setCurrentChunk] = useState<string | null>(null)
  const [isIntense, setIsIntense] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [igniteProgress, setIgniteProgress] = useState(0)

  const timeoutsRef = useRef<number[]>([])
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      timeoutsRef.current.forEach((id) => clearTimeout(id))
    }
  }, [])

  const handleIgnite = useCallback(() => {
    if (phase !== "idle") return
    setPhase("igniting")
    setIgniteProgress(0)

    const startTime = Date.now()
    const duration = 2500 // Etwas verkürzt (2.5s statt 3s) für besseres Flow-Gefühl

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      setIgniteProgress(progress)

      if (progress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase("ready")
      }
    }, 40)
  }, [phase])

  const handleBurnChunk = useCallback(() => {
    if (phase !== "ready" || remainingChunks.length === 0) return

    const chunk = remainingChunks[0]
    const rest = remainingChunks.slice(1)

    setCurrentChunk(chunk)
    setPhase("burning")
    setIsIntense(true)

    const t1 = window.setTimeout(() => {
      const t2 = window.setTimeout(() => {
        setIsIntense(false)
        setCurrentChunk(null)
        setRemainingChunks(rest)

        if (rest.length === 0) {
          const t3 = window.setTimeout(() => setPhase("complete"), 600)
          timeoutsRef.current.push(t3)
        } else {
          setPhase("ready")
        }
      }, 5000) // Auf 5s herabgesetzt (6s war einen Hauch zu langatmig)
      timeoutsRef.current.push(t2)
    }, 800)
    
    timeoutsRef.current.push(t1)
  }, [phase, remainingChunks])

  const handleComplete = useCallback(async () => {
    if (!api || hasCompleted) return
    setHasCompleted(true)

    const profilePatch: Record<string, unknown> = {}
    const timestamp = new Date().toISOString()
    assignPatchValue(profilePatch, saveTo, timestamp)

    try {
      await dispatch(patchUserProfile({ api, patch: profilePatch as UserProfilePatch })).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[BurnRitualNew] patchUserProfile failed:", err)
      setHasCompleted(false)
      return
    }

    await dispatch(completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })).unwrap()
    await new Promise((r) => setTimeout(r, 300))
    await dispatch(handleActionThunk({ action: { type: "next", goNext: () => slideManager.goNext() }, playAnimation: startAnimation, api })).unwrap()
  }, [api, hasCompleted, saveTo, xp, id, dispatch, startAnimation, slideManager])

  return (
    // OPTIMIERUNG: h-full, p-4 (statt p-6) und flex-col verhindern Überlauf auf Mobilgeräten
    <div className="flex flex-col h-full min-h-0 p-4 pb-6 text-white overflow-hidden justify-between select-none">
      
      <motion.div layout layoutId="burnRitualHeader" className="shrink-0 mb-2">
        <AvatarBubble title={title} />
      </motion.div>

      {/* Hauptbereich nutzt flex-1, um den verfügbaren Platz perfekt auszufüllen ohne zu scrollen */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          
          {/* ─── Phase: Idle & Igniting ─── */}
          {(phase === "idle" || phase === "igniting") && (
            <motion.div
              key="prepPhase"
              layout="position"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-4 items-center w-full max-w-sm text-center"
            >
              <p className="text-sm text-gray-300 leading-relaxed px-2">
                {instructionBefore}
              </p>

              {/* Kompakterer Textrahmen */}
              <div className="relative min-h-[60px] flex items-center justify-center w-full px-4">
                <p className="text-[16px] leading-[1.6] text-gray-200 italic font-light">
                  "{resolvedBurnText}"
                </p>
              </div>

              {/* Skalierung der Animation leicht gezügelt, um Platz zu sparen */}
              <div className="scale-90 my-1">
                <CampfireAnimation isLit={phase === "igniting"} isIntense={false} />
              </div>

              <div className="w-full h-14 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === "idle" && (
                    <motion.button
                      key="igniteBtn"
                      onClick={handleIgnite}
                      whileTap={{ scale: 0.97 }}
                      variants={buttonVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="px-6 py-3 rounded-lg font-bold bg-amber-800 hover:bg-amber-700 transition text-white shadow-md active:bg-amber-900"
                    >
                      🪵 Lagerfeuer anzünden
                    </motion.button>
                  )}

                  {phase === "igniting" && (
                    <motion.div
                      key="igniteProgress"
                      variants={fadeVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="w-[200px]"
                    >
                      <div className="relative h-9 bg-amber-950/60 rounded-lg overflow-hidden border border-amber-800/30">
                        <motion.div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-600 to-amber-500"
                          style={{ width: `${igniteProgress}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold z-10 drop-shadow">
                          🔥 Entfachen...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ─── Phase: Ready & Burning ─── */}
          {(phase === "ready" || phase === "burning") && (
            <motion.div
              key="burnPhase"
              layout="position"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-4 items-center w-full max-w-sm text-center"
            >
              <div className="relative min-h-[60px] flex items-center justify-center w-full px-4">
                
                {/* LOGIK-FIX: Im "ready" Zustand steht hier der KOMPLETTE Text. */}
                {phase === "ready" && (
                  <motion.p
                    key="fullText"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className="text-[16px] leading-[1.6] text-gray-200 italic"
                  >
                    "{remainingChunks.join(" ")}"
                  </motion.p>
                )}

                {/* LOGIK-FIX: Erst während des "burning" wird aufgeteilt */}
                {phase === "burning" && (
                  <div className="w-full relative">
                    {/* Der verbleibende Rest des Textes oben (ausgegraut) */}
                    <motion.p
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0.35 }}
                      transition={{ duration: 0.2 }}
                      className="text-[16px] leading-[1.6] text-gray-400 italic"
                    >
                      {remainingChunks.slice(1).length > 0 ? `"${remainingChunks.slice(1).join(" ")}"` : <span className="opacity-0">&nbsp;</span>}
                    </motion.p>

                    {/* Nur der AKTIVE (erste) Teil fällt jetzt physikalisch runter ins Feuer */}
                    <AnimatePresence>
                      {currentChunk && (
                        <motion.div
                          className="absolute left-1/2 top-0 -translate-x-1/2 text-[15px] italic whitespace-normal w-full max-w-[280px] pointer-events-none font-medium"
                          initial={{ y: 0, rotate: 0, scale: 1, color: "rgb(229, 231, 235)" }}
                          animate={{ 
                            y: 160, // Leicht verringert, da Komponente kompakter ist
                            rotate: -8, 
                            scale: 0.8, 
                            color: "#ff4400",
                            filter: ["blur(0px)", "blur(1px)", "blur(3px)", "blur(6px)"],
                            opacity: [1, 0.9, 0.6, 0]
                          }}
                          transition={{ 
                            y: { duration: 0.8, ease: "easeIn" },
                            rotate: { duration: 0.8, ease: "easeIn" },
                            scale: { duration: 0.8, ease: "easeIn" },
                            color: { duration: 0.8, ease: "easeIn" },
                            filter: { duration: 5, delay: 0.8, ease: "easeIn" },
                            opacity: { duration: 5, delay: 0.8, ease: "easeIn" }
                          }}
                        >
                          "{currentChunk}"
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="scale-90 my-1">
                <CampfireAnimation isLit={true} isIntense={isIntense} />
              </div>

              <div className="w-full h-14 flex flex-col items-center justify-center gap-1">
                <AnimatePresence mode="wait">
                  {phase === "ready" && (
                    <motion.button
                      key="burnBtn"
                      onClick={handleBurnChunk}
                      whileTap={{ scale: 0.97 }}
                      variants={buttonVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="px-8 py-3 rounded-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition text-white shadow-lg shadow-orange-950/20"
                    >
                      🔥 {burnButtonText}
                    </motion.button>
                  )}

                  {phase === "burning" && (
                    <motion.p 
                      key="burnProgress" 
                      variants={fadeVariants} 
                      initial="initial" 
                      animate="animate" 
                      exit="exit" 
                      className="text-xs font-medium text-orange-400/80 tracking-wider uppercase"
                    >
                      {remainingChunks.length} {remainingChunks.length === 1 ? "Teil verbleibt" : "Teile verbleiben"}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ─── Phase: Complete ─── */}
          {phase === "complete" && (
            <motion.div
              key="completePhase"
              layout="position"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-4 items-center w-full max-w-sm text-center"
            >
              <p className="text-sm text-gray-300 leading-relaxed px-4">
                {instructionAfter}
              </p>
              <div className="scale-90 my-1">
                <CampfireAnimation isLit={true} isIntense={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button-Leiste ganz unten verankert */}
      <div className="shrink-0 w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {phase === "complete" && (
            <motion.div
              key="finalActions"
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex flex-col items-center"
            >
              <button
                onClick={handleComplete}
                disabled={hasCompleted}
                className={clsx(
                  "px-6 py-3 rounded-lg font-bold transition w-full max-w-[280px] shadow-md",
                  hasCompleted
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 text-white"
                )}
              >
                Weiter →
              </button>
              {xp > 0 && (
                <p className="mt-2 text-xs text-gray-400 font-semibold tracking-wide">
                  +{xp} XP ERHALTEN
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default memo(BurnRitualNew)