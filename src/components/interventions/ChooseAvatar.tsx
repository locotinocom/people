import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import AvatarRender from "../AvatarRender"
import { useGame } from "../../context/GameContext"

const EVA_NAME = "eva"
const TIM_NAME = "tim"

type Props = { onComplete: (avatarName: string) => void }

export default function ChooseAvatar({ onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const swiperRef = useRef<SwiperType | null>(null)
  const { setAvatarName, setAvatarId } = useGame()

  // ------------------------
  // Avatar speichern (API)
  // ------------------------
  const handleChoose = async (name: string) => {
    try {
      setLoading(true)
      setSelected(name)

      // Speichere Avatar in Context (triggert automatisch API-Aufruf)
      setAvatarName(name)
      setAvatarId(name)

      // Simulierter kurzer Delay für UX
      await new Promise((r) => setTimeout(r, 400))

      // Weiter zur nächsten Slide
      swiperRef.current?.slideNext()
    } catch (err) {
      console.warn("⚠️ Avatar konnte nicht gespeichert werden:", err)
    } finally {
      setLoading(false)
    }
  }

  // ------------------------
  // Rendering
  // ------------------------
  return (
    <Swiper
      allowTouchMove={false}
      onSwiper={(swiper) => (swiperRef.current = swiper)}
      className="h-full w-full overflow-hidden"
    >
      {/* --- Auswahl-Slide --- */}
      <SwiperSlide className="!h-full overflow-hidden">
        <div className="relative h-full w-full flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold mb-6">
            Von wem möchtest du begleitet und beraten werden?
          </h2>

          <div className="flex justify-center items-start gap-4 w-full max-w-[600px] mx-auto">
            {/* Eva */}
            <button
              onClick={() => handleChoose(EVA_NAME)}
              disabled={loading}
              className={`flex flex-col items-center flex-1 min-w-[140px] max-w-[260px] p-3 rounded-xl transition ${
                selected === EVA_NAME
                  ? "bg-green-700"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              <div className="w-full aspect-[3/4] mb-3 overflow-hidden rounded-lg">
                <AvatarRender
                  name={EVA_NAME}
                  emotion="happy"
                  pose="standing"
                  camera="portrait"
                  className="object-cover object-top w-full h-full"
                />
              </div>
              <p className="mt-1 font-semibold">Eva</p>
              <p className="text-xs text-gray-400 text-center">
                Sie ist liebevoll streng, beherzt und tritt dir in den Hintern,
                wenn es sein muss 🔥
              </p>
            </button>

            {/* Tim */}
            <button
              onClick={() => handleChoose(TIM_NAME)}
              disabled={loading}
              className={`flex flex-col items-center flex-1 min-w-[140px] max-w-[260px] p-3 rounded-xl transition ${
                selected === TIM_NAME
                  ? "bg-green-700"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              <div className="w-full aspect-[3/4] mb-3 overflow-hidden rounded-lg">
                <AvatarRender
                  name={TIM_NAME}
                  emotion="happy"
                  pose="power-stance"
                  camera="portrait"
                  className="object-cover object-top w-full h-full"
                />
              </div>
              <p className="mt-1 font-semibold">Tim</p>
              <p className="text-xs text-gray-400 text-center">
                Der zarte Fels in der Brandung 🪨 – sanft, verständnisvoll und
                immer da, wenn du ihn brauchst.
              </p>
            </button>
          </div>
        </div>
      </SwiperSlide>

      {/* --- Bestätigungs-Slide --- */}
      <SwiperSlide className="!h-full overflow-hidden">
        <div className="relative h-full w-full flex flex-col items-center justify-center p-6 text-center">
          {selected ? (
            <>
              <h2 className="text-xl font-bold mb-4">
                🎉 Cool, du hast dich für{" "}
                {selected === EVA_NAME ? "Eva" : "Tim"} entschieden!
              </h2>

              <div className="w-48 aspect-square mb-4 overflow-hidden rounded-lg">
                <AvatarRender
                  name={selected}
                  emotion="happy"
                  pose="thumbs-up"
                  camera="head"
                  className="object-cover object-top w-full h-full"
                />
              </div>

              <p className="text-gray-300 max-w-xs">
                {selected === EVA_NAME
                  ? "Eva wird dich mit Klarheit, Herz und Humor begleiten – liebevoll, aber bestimmt. 🔥"
                  : "Tim begleitet dich ruhig, geduldig und mitfühlend – ein echter Anker in stürmischen Zeiten. 🌊"}
              </p>

              <button
                onClick={() => onComplete(selected)}
                disabled={loading}
                className="mt-6 px-6 py-2 bg-green-600 rounded-lg hover:bg-green-500"
              >
                {loading ? "Speichere..." : "Weiter"}
              </button>
            </>
          ) : (
            <p className="text-gray-400">Bitte zuerst einen Avatar auswählen</p>
          )}
        </div>
      </SwiperSlide>
    </Swiper>
  )
}
