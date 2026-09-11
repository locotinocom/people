// src/components/praxis/PraxisItemCard.tsx
import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { useReduxApi } from "@api/reduxApi"
import {
  acceptPraxisItem,
  dismissPraxisItem,
  fetchPraxisItems,
  selectPraxisLoading,
  selectPraxisError,
} from "@store/slices/praxisSlice"
import type { PraxisItem, PraxisContentItem } from "@api/types"
import PraxisItemResponseDialog from "./PraxisItemResponseDialog"
import toast from "react-hot-toast"

type Props = {
  item: PraxisItem
  contentDef?: PraxisContentItem
}

/** Formatiert die verbleibende Zeit bis availableAt als "Xh Ym" bzw. "Xt Yh" */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "0m"
  const totalMinutes = Math.ceil(ms / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}t ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/** Formatiert die Gesamt-Wartezeit (aus followUpAfterHours/durationDays) für den Bestätigungsdialog */
function formatDuration(hours: number): string {
  if (hours <= 0) return "sofort"
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes} Minute${minutes === 1 ? "" : "n"}`
  }
  if (hours < 24) {
    const h = Math.round(hours)
    return `${h} Stunde${h === 1 ? "" : "n"}`
  }
  const days = Math.round(hours / 24)
  return `${days} Tag${days === 1 ? "" : "e"}`
}

/** Abwechslungsreiche Bestätigungstexte fürs Annehmen - {duration} wird ersetzt */
const ACCEPT_CONFIRM_TEXTS = [
  "Cool, dass du dich selbst challengest! Du hast {duration} Zeit, die Aufgabe zu erfüllen.",
  "Mutiger Schritt. Ab jetzt läuft der Countdown - {duration} sind dein Zeitfenster.",
  "Nice. Die Uhr tickt ab sofort - in {duration} kannst du reflektieren, wie's gelaufen ist.",
  "Gut, dass du dranbleibst. {duration} Zeit, dann geht's ans Auswerten.",
]

function getRandomAcceptText(duration: string): string {
  const template = ACCEPT_CONFIRM_TEXTS[Math.floor(Math.random() * ACCEPT_CONFIRM_TEXTS.length)]
  return template.replace("{duration}", duration)
}

export default function PraxisItemCard({ item, contentDef }: Props) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const isLoading = useAppSelector(selectPraxisLoading)
  const error = useAppSelector(selectPraxisError)

  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [acceptConfirmText, setAcceptConfirmText] = useState("")
  const [now, setNow] = useState(() => Date.now())

  // Countdown: nur ticken, solange ein active-Item mit availableAt läuft
  useEffect(() => {
    if (item.status !== "active" || !item.availableAt) return
    const interval = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(interval)
  }, [item.status, item.availableAt])

  // Status-Anzeige
  const isCompleted = item.status === "completed"
  const isPending = item.status === "pending"
  const isActive = item.status === "active"

  const availableAtMs = item.availableAt ? new Date(item.availableAt).getTime() : null
  const remainingMs = availableAtMs !== null ? availableAtMs - now : 0
  const isAvailableNow = isActive && (availableAtMs === null || remainingMs <= 0)
  const isWaiting = isActive && !isAvailableNow

  // Gesamt-Wartezeit für den Annehmen-Bestätigungsdialog (spiegelt Backend-Berechnung in praxisAccept)
  const totalWaitHours = contentDef?.durationDays
    ? contentDef.durationDays * 24
    : contentDef?.followUpAfterHours ?? 0
  
  // Icon für Item-Type
  const typeIcon: Record<string, string> = {
    micro_commitment: "💪",
    situation_reflection: "🤔",
    challenge: "🎯",
  }
  const icon = typeIcon[item.type] || "📌"
  
  // Title fallback
  const title = contentDef?.title || item.contentKey
  const description = contentDef?.description || "Aufgabe ohne Beschreibung"
  const difficulty = item.difficulty || 1
  
  const handleRespond = () => {
    if (isAvailableNow) {
      setShowResponseDialog(true)
    }
  }

  const openAcceptConfirm = () => {
    setAcceptConfirmText(getRandomAcceptText(formatDuration(totalWaitHours)))
    setShowAcceptConfirm(true)
  }

  const confirmAccept = async () => {
    setShowAcceptConfirm(false)
    const result = await dispatch(acceptPraxisItem({ api, praxisItemId: item.id }))
    if (acceptPraxisItem.fulfilled.match(result)) {
      toast.success("Aufgabe angenommen – Countdown läuft!")
    } else {
      toast.error("Annehmen fehlgeschlagen")
    }
  }

  const handleDismiss = async () => {
    const result = await dispatch(dismissPraxisItem({ api, praxisItemId: item.id }))
    if (dismissPraxisItem.fulfilled.match(result)) {
      toast.success("Aufgabe weggeklickt")
      // Backend hat force_respawn gesetzt - sofort neu laden, damit die neue Aufgabe direkt erscheint
      dispatch(fetchPraxisItems(api))
    } else {
      toast.error("Ablehnen fehlgeschlagen")
    }
  }
  
  // Difficulty-Indikator (Sterne)
  const difficultyStars = Array(3)
    .fill(0)
    .map((_, i) => (i < difficulty ? "⭐" : "☆"))
    .join("")

  return (
    <>
      {/* Response-Dialog */}
      <PraxisItemResponseDialog
        item={item}
        contentDef={contentDef}
        isOpen={showResponseDialog}
        onClose={() => setShowResponseDialog(false)}
      />

      {/* Annehmen-Bestätigungsdialog */}
      {showAcceptConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAcceptConfirm(false)
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-gray-800 border border-gray-700 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <p className="text-white text-base leading-relaxed mb-6">{acceptConfirmText}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAcceptConfirm(false)}
                className="flex-1 py-2 rounded-xl font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white transition"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmAccept}
                className="flex-1 py-2 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className={`relative rounded-2xl border p-4 flex flex-col gap-3 transition-all
          ${
            isCompleted
              ? "bg-gray-800/50 border-green-600/40 opacity-75"
              : isPending
              ? "bg-gray-800 border-blue-600/60 shadow-lg shadow-blue-900/20"
              : "bg-gray-800 border-gray-600"
          }
        `}
      >
        {/* Completed Badge */}
        {isCompleted && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
            ✓ ERLEDIGT
          </span>
        )}

        {/* Icon + Name + Schwierigkeit */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className="text-3xl select-none w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl flex-shrink-0">
              {icon}
            </div>
            
            {/* Name & Difficulty */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight">{title}</h3>
              <div className="text-xs text-amber-400 mt-0.5">
                Schwierigkeit: {difficultyStars}
              </div>
            </div>
          </div>
          
          {/* Diamond-Reward */}
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-blue-300">
              {item.diamondReward} 💎
            </div>
          </div>
        </div>

        {/* Beschreibung */}
        <p className="text-sm text-white/60 leading-relaxed">{description}</p>

        {/* Type-Hinweis */}
        <div className="text-xs text-white/40">
          {item.type === "micro_commitment" && "📝 Kleine Aufgabe"}
          {item.type === "situation_reflection" && "💭 Reflexions-Frage"}
          {item.type === "challenge" && "🏆 Mehrtägige Challenge"}
        </div>

        {/* Status-Info */}
        {isCompleted && item.completedAt && (
          <div className="text-xs text-green-400">
            ✓ Abgeschlossen am{" "}
            {new Date(item.completedAt).toLocaleDateString("de-DE")}
          </div>
        )}

        {/* Countdown-Info, solange Item aktiv aber noch nicht verfügbar */}
        {isWaiting && (
          <div className="text-xs text-amber-300 bg-amber-900/20 rounded-lg px-3 py-2">
            ⏳ Verfügbar in {formatRemaining(remainingMs)}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          {isPending && (
            <>
              <button
                onClick={openAcceptConfirm}
                disabled={isLoading}
                className="flex-1 py-2 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition disabled:bg-gray-600 disabled:cursor-wait"
              >
                {isLoading ? "..." : "Annehmen →"}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="flex-1 py-2 rounded-xl font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white transition"
              >
                Später
              </button>
            </>
          )}

          {isWaiting && (
            <button
              disabled
              className="w-full py-2 rounded-xl font-semibold text-sm bg-gray-700/50 text-white/40 cursor-default"
            >
              Countdown läuft...
            </button>
          )}

          {isAvailableNow && (
            <button
              onClick={handleRespond}
              disabled={isLoading}
              className="w-full py-2 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition disabled:bg-gray-600 disabled:cursor-wait"
            >
              {isLoading ? "..." : "Reflektieren & abschließen →"}
            </button>
          )}

          {isCompleted && (
            <button
              disabled
              className="w-full py-2 rounded-xl font-semibold text-sm bg-green-600/50 text-green-200 cursor-default"
            >
              ✓ Erledigt
            </button>
          )}
        </div>

        {/* Error-Message */}
        {error && (
          <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}
      </div>
    </>
  )
}
