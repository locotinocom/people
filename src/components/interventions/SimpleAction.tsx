import AvatarRender from "../AvatarRender"
import { useRef, useState, useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@store/hooks"
import { useReduxApi } from "@api/reduxApi"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useSlideManager } from "@context/SlideManagerContext"
import { useAnimation } from "@context/AnimationContext"

type SimpleActionData = {
  id: number
  title?: string
  message?: string
  buttonText?: string
  xp?: number
  camera?: "portrait" | "fullbody" | "head"
  pose?: "standing" | "relaxed" | "thumbs-up" | "power-stance" | "waving"
  timerSeconds?: number
}

export default function SimpleAction({ data }: { data: SimpleActionData }) {
  const {
    id,
    title,
    message,
    buttonText,
    xp = 5,
    camera = "fullbody",
    pose = "relaxed",
    timerSeconds,
  } = data

  const avatar = useAppSelector((state) => state.session.avatar)
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  const rawName = avatar?.name || "dein Begleiter"
  const avatarName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timerSeconds ?? null
  )
  const [isTimerActive, setIsTimerActive] = useState(false)

  useEffect(() => {
    if (timerSeconds && isTimerActive && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timerSeconds, isTimerActive, timeRemaining])

  const startTimer = () => {
    if (timerSeconds) {
      setIsTimerActive(true)
    }
  }

  const handleComplete = async () => {
    if (!api) return

    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        api,
        playAnimation: startAnimation,
      })
    )

    await new Promise((resolve) => setTimeout(resolve, 400))

    await dispatch(
      handleActionThunk({
        action: {
          type: "next",
          goNext: () => slideManager.goNext(),
        },
        playAnimation: startAnimation,
        api,
      })
    )
  }

  return (
    <div className="flex h-full w-full min-h-0 items-center gap-4 px-4 py-4 md:px-8">
      <div className="w-2/5 h-full min-h-0 flex items-center justify-center">
        <AvatarRender
          name={rawName}
          emotion="neutral"
          pose={pose}
          camera={camera}
          className="w-full h-full max-h-[60vh]"
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0 justify-center gap-4">
        {title && (
          <h2 className="text-[clamp(1.4rem,3.8vw,2.2rem)] font-bold text-white leading-tight">
            {title}
          </h2>
        )}

        {message && (
          <p className="text-[clamp(1rem,2.8vw,1.25rem)] leading-relaxed text-gray-300 whitespace-pre-line">
            {message.replace(/\{\{avatarName\}\}/g, avatarName)}
          </p>
        )}

        {timerSeconds && !isTimerActive && (
          <button
            onClick={startTimer}
            className="mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white shrink-0"
          >
            Timer starten ({timerSeconds}s)
          </button>
        )}

        {timerSeconds && isTimerActive && timeRemaining !== null && timeRemaining > 0 && (
          <div className="mt-2 px-6 py-4 bg-gray-800 rounded-lg text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400">Nimm dir Zeit...</div>
          </div>
        )}

        {(!timerSeconds || (isTimerActive && timeRemaining === 0)) && (
          <button
            ref={btnRef}
            onClick={handleComplete}
            className="mt-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white shrink-0"
          >
            {buttonText ?? "Weiter"}
          </button>
        )}

        {xp > 0 && (
          <p className="text-sm text-gray-400">
            Aufgabe erledigen bringt +{xp} XP
          </p>
        )}
      </div>
    </div>
  )
}
