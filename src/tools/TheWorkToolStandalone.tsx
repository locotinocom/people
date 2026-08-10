import { useState, useCallback } from "react"

const STEPS = [
  {
    id: "belief",
    title: "Finde deinen Satz",
    subtitle: "Welcher Glaubenssatz treibt dich gerade an?",
    placeholder: "Zum Beispiel: 'Ich muss immer gefallen, um liebenswert zu sein.'",
  },
  {
    id: "turnaround",
    title: "Drehe den Satz um",
    subtitle: "Wie könnte ein hilfreicher, neuer Satz lauten?",
    placeholder: "Zum Beispiel: 'Ich bin wertvoll, auch wenn ich mich abgrenze.'",
  },
]

export default function TheWorkToolStandalone() {
  const [stepIndex, setStepIndex] = useState(0)
  const [belief, setBelief] = useState("")
  const [turnaround, setTurnaround] = useState("")

  const currentStep = STEPS[stepIndex]

  const handleNext = useCallback(() => {
    if (stepIndex === 0 && belief.trim().length === 0) return
    if (stepIndex === 1 && turnaround.trim().length === 0) return

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((index) => index + 1)
      return
    }

    setStepIndex(STEPS.length)
  }, [stepIndex, belief, turnaround])

  const handleRestart = useCallback(() => {
    setBelief("")
    setTurnaround("")
    setStepIndex(0)
  }, [])

  const progress = (stepIndex / STEPS.length) * 100

  if (stepIndex >= STEPS.length) {
    return (
      <div className="flex flex-col h-full bg-gray-900 text-white px-6 py-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-600/15 text-4xl">
          🧠
        </div>
        <div className="mt-8 max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold">The Work abgeschlossen</h2>
          <p className="mt-3 text-gray-400 leading-relaxed">
            Du hast deinen alten Satz angeschaut und eine neue Perspektive geschrieben.
            Nimm dir einen Moment, um das Wichtigste zu speichern.
          </p>
        </div>

        <div className="mt-8 space-y-4 bg-white/5 rounded-3xl border border-white/10 p-5 text-sm text-gray-200">
          <div>
            <div className="text-white/70 text-xs uppercase tracking-[0.2em] mb-2">Alter Satz</div>
            <div className="font-semibold text-white">{belief}</div>
          </div>
          <div>
            <div className="text-white/70 text-xs uppercase tracking-[0.2em] mb-2">Neuer Satz</div>
            <div className="font-semibold text-white">{turnaround}</div>
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="mt-8 mx-auto rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500 transition"
        >
          Noch einmal
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">The Work</h2>
          <p className="mt-1 text-sm text-gray-400 max-w-xl">
            Eine kurze Übung für Glaubenssätze: benennen, prüfen, umdrehen.
          </p>
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-green-300/80">
          Schritt {stepIndex + 1}/{STEPS.length}
        </div>
      </div>

      <div className="mt-6 h-full overflow-y-auto pr-1">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">{currentStep.title}</h3>
          <p className="mt-3 text-gray-300 whitespace-pre-line">{currentStep.subtitle}</p>

          <textarea
            value={stepIndex === 0 ? belief : turnaround}
            onChange={(event) =>
              stepIndex === 0
                ? setBelief(event.target.value)
                : setTurnaround(event.target.value)
            }
            placeholder={currentStep.placeholder}
            className="mt-6 min-h-[220px] w-full rounded-3xl bg-gray-950 border border-gray-700 p-4 text-sm text-white resize-none focus:border-green-500 focus:outline-none"
          />

          {stepIndex === 0 && belief.trim().length > 0 && (
            <div className="mt-4 rounded-3xl bg-green-900/20 p-4 text-sm text-green-200 border border-green-500/20">
              Super. Du kannst jetzt eine neue, unterstützende Aussage formulieren.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={handleNext}
          disabled={stepIndex === 0 ? belief.trim().length === 0 : turnaround.trim().length === 0}
          className={
            "rounded-full px-6 py-3 text-sm font-semibold transition " +
            (stepIndex === 0
              ? belief.trim().length > 0
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
              : turnaround.trim().length > 0
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-gray-700 text-gray-400 cursor-not-allowed")
          }
        >
          {stepIndex < STEPS.length - 1 ? "Weiter" : "Fertig"}
        </button>
      </div>
    </div>
  )
}
