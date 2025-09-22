import { useGame } from "../../context/GameContext"
import RewardTest from "../RewardTest"

export default function YesNo() {
  const { addXp, addDias } = useGame()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-green-200">
      <p>Willst du das ausprobieren?</p>

      <div className="flex gap-4">
<RewardTest />


        <button
          onClick={() => addXp(20)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          +20 XP
        </button>

        <button
          onClick={() => addDias(1)}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg shadow-md hover:bg-pink-600 transition"
        >
          +1 Dia
        </button>
      </div>
    </div>
  )
}
