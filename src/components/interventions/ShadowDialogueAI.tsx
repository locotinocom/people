import { useState, useCallback, useRef, useEffect, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { applyTemplate, applyTemplateText } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

type ShadowPoleType = "active" | "passive"

export interface DialogueOption {
  id: string
  text: string
  next: string // ID des Folgeknotens
}

export interface DialogueNode {
  id: string
  shadowText: string | string[] // Array = zufällige Variante bei jedem Durchlauf
  options: DialogueOption[] // leer = Gesprächsende
}

export interface ShadowDialogueResult {
  poleType: ShadowPoleType
  poleName: string
  path: { nodeId: string; chosenOptionId: string; chosenText: string; wasCustom: boolean }[]
}

type ShadowDialogueAIData = {
  id: number
  xp?: number
  slug: string
  saveTo: string
  dominantPoleTypeTemplate: string
  dominantPoleLabelTemplate: string
  startNodeId: string
  activeNodes: Record<string, DialogueNode>
  passiveNodes: Record<string, DialogueNode>
  allowFreeText?: boolean
}

type VisibleItem =
  | { kind: "typing" }
  | { kind: "shadow_message"; text: string; id: string }
  | { kind: "user_message"; text: string; id: string }

/* =======================
   Hilfsfunktion
======================= */

function assignPatchValue(
  patch: Record<string, unknown>,
  saveTo: string,
  value: unknown
): void {
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

function pickVariant(text: string | string[]): string {
  if (Array.isArray(text)) {
    return text[Math.floor(Math.random() * text.length)]
  }
  return text
}

/* =======================
   Wiederverwendete Bausteine, visuell 1:1 an ChatSimulationCard angelehnt
======================= */

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
        <span className="text-sm">🌑</span>
      </div>
      <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/50"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function ShadowBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-end gap-2 justify-start"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
        <span className="text-sm">🌑</span>
      </div>
      <div className="max-w-[75%]">
        <div className="px-4 py-2.5 text-sm leading-relaxed bg-white/10 rounded-2xl rounded-bl-sm text-white/90">
          {text}
        </div>
      </div>
    </motion.div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-end gap-2 justify-end"
    >
      <div className="max-w-[75%]">
        <div className="px-4 py-2.5 text-sm leading-relaxed bg-green-600 rounded-2xl rounded-br-sm text-white">
          {text}
        </div>
      </div>
    </motion.div>
  )
}

/* =======================
   ShadowDialogueAI
======================= */

function ShadowDialogueAI({ data }: { data: ShadowDialogueAIData }) {
  const {
    id,
    xp = 0,
    saveTo,
    dominantPoleTypeTemplate,
    dominantPoleLabelTemplate,
    startNodeId,
    activeNodes,
    passiveNodes,
    allowFreeText = false,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  const poleType = (applyTemplateText(dominantPoleTypeTemplate, ctx) || "passive") as ShadowPoleType
  const poleLabel = applyTemplateText(dominantPoleLabelTemplate, ctx) || "dein Schatten"
  const nodes = poleType === "active" ? activeNodes : passiveNodes
  const extendedCtx = { ...ctx, pole_name: poleLabel }

  const [currentNodeId, setCurrentNodeId] = useState(startNodeId)
  const [visibleItems, setVisibleItems] = useState<VisibleItem[]>([])
  const [path, setPath] = useState<ShadowDialogueResult["path"]>([])
  const [customMode, setCustomMode] = useState(false)
  const [customText, setCustomText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const hasMountedRef = useRef(false)

  const currentNode = nodes[currentNodeId]
  const isDone = currentNode ? currentNode.options.length === 0 : true

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 60)
  }, [])

  // Beim Mount + bei jedem Knotenwechsel: Schatten "tippt" kurz, dann erscheint sein Text
  useEffect(() => {
    if (!currentNode) return
    setIsTyping(true)
    setVisibleItems((prev) => [...prev, { kind: "typing" }])
    scrollToBottom()

    const delay = hasMountedRef.current ? 900 : 500
    hasMountedRef.current = true

    const timeout = setTimeout(() => {
      const text = applyTemplateText(pickVariant(currentNode.shadowText), extendedCtx)
      setVisibleItems((prev) => {
        const clean = prev.filter((i) => i.kind !== "typing")
        return [...clean, { kind: "shadow_message", text, id: `shadow-${currentNode.id}` }]
      })
      setIsTyping(false)
      scrollToBottom()
    }, delay)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId])

  const handleOptionSelect = useCallback(
    (option: DialogueOption) => {
      const chosenText = applyTemplateText(option.text, extendedCtx)
      setVisibleItems((prev) => [...prev, { kind: "user_message", text: chosenText, id: `user-${option.id}` }])
      setPath((prev) => [...prev, { nodeId: currentNodeId, chosenOptionId: option.id, chosenText, wasCustom: false }])
      setCustomMode(false)
      setCustomText("")
      scrollToBottom()
      setCurrentNodeId(option.next)
    },
    [currentNodeId, extendedCtx, scrollToBottom]
  )

  const handleCustomSend = useCallback(() => {
    if (!customText.trim() || !currentNode || currentNode.options.length === 0) return
    // Freitext bleibt im Baum – nutzt trotzdem die erste definierte Option als Pfad,
    // damit das Gespräch weiterläuft. Die eingetippte Formulierung wird separat
    // im Result-Path als "wasCustom: true" mit dem echten Freitext gespeichert.
    const fallbackOption = currentNode.options[0]
    setVisibleItems((prev) => [...prev, { kind: "user_message", text: customText.trim(), id: `user-custom-${Date.now()}` }])
    setPath((prev) => [
      ...prev,
      { nodeId: currentNodeId, chosenOptionId: fallbackOption.id, chosenText: customText.trim(), wasCustom: true },
    ])
    setCustomMode(false)
    setCustomText("")
    scrollToBottom()
    setCurrentNodeId(fallbackOption.next)
  }, [customText, currentNode, currentNodeId, scrollToBottom])

  const handleComplete = useCallback(async () => {
    if (!api || hasCompleted) return
    setHasCompleted(true)

    const result: ShadowDialogueResult = { poleType, poleName: poleLabel, path }

    const profilePatch: Record<string, unknown> = {}
    assignPatchValue(profilePatch, saveTo, result)

    if (import.meta.env.DEV) {
      console.log("[ShadowDialogueAI] Ergebnis:", result)
      console.log("[ShadowDialogueAI] Patch:", JSON.stringify(profilePatch, null, 2))
    }

    try {
      await dispatch(patchUserProfile({ api, patch: profilePatch as UserProfilePatch })).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[ShadowDialogueAI] patchUserProfile fehlgeschlagen:", err)
      setHasCompleted(false)
      return
    }

    await dispatch(
      completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
    ).unwrap()

    await new Promise((r) => setTimeout(r, 400))

    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
  }, [api, hasCompleted, poleType, poleLabel, path, saveTo, id, xp, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header, exakt im Stil von ChatSimulationCard */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-white/90 text-sm font-medium leading-relaxed">
            Ein Gespräch mit {poleLabel} – dem Anteil in dir, der gerade lauter ist.
          </p>
        </div>
      </div>

      {/* Chat-Verlauf */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {visibleItems.map((item, index) => {
            if (item.kind === "typing") return <TypingIndicator key={`typing-${index}`} />
            if (item.kind === "shadow_message") return <ShadowBubble key={item.id} text={item.text} />
            if (item.kind === "user_message") return <UserBubble key={item.id} text={item.text} />
            return null
          })}
        </AnimatePresence>
      </div>

      {/* Antwortbereich */}
      {!isDone && !isTyping && currentNode && (
        <div className="shrink-0 px-5 pb-4 pt-2 flex flex-col gap-2">
          {!customMode && (
            <>
              {currentNode.options.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition-all duration-200"
                >
                  {applyTemplateText(option.text, extendedCtx)}
                </motion.button>
              ))}

              {allowFreeText && (
                <button
                  onClick={() => setCustomMode(true)}
                  className="text-xs text-white/40 hover:text-white/70 transition self-center mt-1"
                >
                  Eigene Worte finden
                </button>
              )}
            </>
          )}

          {customMode && (
            <div className="flex items-end gap-2">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Schreib, was du sagen willst..."
                rows={2}
                className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm resize-none focus:border-green-500 focus:outline-none"
              />
              <motion.button
                onClick={handleCustomSend}
                disabled={!customText.trim()}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  "shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition",
                  customText.trim() ? "bg-green-600 hover:bg-green-500" : "bg-gray-700 cursor-not-allowed"
                )}
              >
                ➤
              </motion.button>
            </div>
          )}
        </div>
      )}

      {isDone && !isTyping && (
        <div className="shrink-0 px-5 pb-5 pt-2">
          <button
            onClick={handleComplete}
            disabled={hasCompleted}
            className={clsx(
              "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all",
              hasCompleted ? "bg-green-600/50 text-white/50 cursor-not-allowed" : "bg-green-600 text-white shadow-lg"
            )}
          >
            {hasCompleted ? "Wird gespeichert..." : "Weiter →"}
          </button>
          {xp > 0 && <p className="mt-2 text-xs text-white/40 text-center">+{xp} XP</p>}
        </div>
      )}
    </div>
  )
}

export default memo(ShadowDialogueAI)