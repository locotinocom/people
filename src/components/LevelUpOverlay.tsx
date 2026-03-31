import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { useRef, useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import {
  clearLevelUp,
  fetchDiamonds,
  fetchProgress,
  fetchLevelStats,
} from "@store/slices/gameSlice"
import {
  fetchSessionState,
  addDiamondsLocally,
} from "@store/slices/sessionSlice"
import { useReduxApi } from "@api/reduxApi"
import AvatarRender from "@components/AvatarRender"
import { useUserAssetsPreview } from "@hooks/useUserAssetsPreview"
import { FlyParticles } from "@components/animations/FlyParticles"
import LoadingDots from "@components/LoadingDots"
import { openOverlay } from "@store/slices/uiOverlaySlice"
import { unlockTools, TOOL_DEFINITIONS } from "@store/slices/toolsSlice"
import { invalidateCacheFor } from "@api/request"

export default function LevelUpOverlay() {
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  const { levelUpPending, levelUpData } = useAppSelector((s) => s.game)
  const avatar = useAppSelector((s) => s.avatar.avatar)

  const level = levelUpData?.level ?? 0
  const reward = levelUpData?.reward ?? {
    dias: 0,
    asset_ids: [],
    tool_ids: [],
    transaction_id: null,
  }

  const hasDiamondReward =
    (reward.dias ?? 0) > 0 && reward.transaction_id != null

  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [flyTriggered, setFlyTriggered] = useState(false)

  const assetIds: string[] =
    typeof reward.asset_ids === "string"
      ? reward.asset_ids
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : Array.isArray(reward.asset_ids)
        ? reward.asset_ids
        : []

  const toolIds: string[] =
    typeof reward.tool_ids === "string"
      ? reward.tool_ids
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : Array.isArray(reward.tool_ids)
        ? reward.tool_ids
        : []

  const newTools = TOOL_DEFINITIONS.filter((t) => toolIds.includes(t.key))
  const { items: userAssets, loading: loadingAssets } =
    useUserAssetsPreview(assetIds)

  const fromRef = useRef<HTMLDivElement | null>(null)
  const toRef = useRef<HTMLButtonElement | null>(null)

  /**
   * WICHTIG:
   * Bei JEDEM neuen Level-Up Overlay lokalen UI-State sauber resetten.
   * Sonst bleibt z. B. claimed=true vom letzten Durchlauf hängen.
   */
  useEffect(() => {
    if (!levelUpPending || !levelUpData) return

    const canClaim =
      (levelUpData.reward?.dias ?? 0) > 0 &&
      levelUpData.reward?.transaction_id != null

    setClaiming(false)
    setFlyTriggered(false)
    setClaimed(!canClaim)

    if (import.meta.env.DEV) {
      console.log("🎉 LevelUpOverlay init", {
        level: levelUpData.level,
        reward: levelUpData.reward,
        canClaim,
      })
    }
  }, [
    levelUpPending,
    levelUpData?.level,
    levelUpData?.reward?.dias,
    levelUpData?.reward?.transaction_id,
  ])

  useEffect(() => {
    if (!hasDiamondReward && toolIds.length > 0) {
      dispatch(unlockTools(toolIds))
    }
  }, [hasDiamondReward, toolIds, dispatch])

  if (!levelUpPending || !levelUpData) return null

  const hasRewards = assetIds.length > 0 || toolIds.length > 0

  const handleClaim = async () => {
    if (claiming || claimed || flyTriggered) return
    if (!api) return

    setClaiming(true)
    setFlyTriggered(true)

    dispatch(addDiamondsLocally(reward.dias))

    try {
      await api.addDiamonds(
        reward.dias,
        `Level ${level} reward`,
        reward.transaction_id ?? undefined
      )

      if (toolIds.length > 0) {
        dispatch(unlockTools(toolIds))
      }
    } catch (err) {
      console.error("💎 Fehler addDiamonds:", err)
      dispatch(addDiamondsLocally(-reward.dias))
    }

    setTimeout(() => {
      setFlyTriggered(false)
      setClaiming(false)
      setClaimed(true)
    }, 2000)
  }

  const handleClose = async () => {
    if (!api) {
      dispatch(clearLevelUp())
      return
    }

    await new Promise((r) => setTimeout(r, 300))

    invalidateCacheFor(
      "/game/state",
      "/game/getProgress",
      "/game/getCurrentLevel",
      "/game/getDiamonds"
    )

    try {
      await Promise.all([
        dispatch(fetchSessionState(api)).unwrap(),
        dispatch(fetchProgress(api)).unwrap(),
        dispatch(fetchLevelStats(api)).unwrap(),
        dispatch(fetchDiamonds(api)).unwrap(),
      ])
    } catch (e) {
      console.error("Fehler beim Sync nach LevelUp:", e)
    }

    dispatch(clearLevelUp())
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[9998] overflow-y-auto py-4">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={true}
        numberOfPieces={200}
        gravity={0.2}
      />

      {flyTriggered && (
        <FlyParticles
          key="levelup-diamond-animation"
          from={fromRef.current}
          to={document.getElementById("loco_DiamondCounter") || document.body}
          content="💎"
          color="#06b6d4"
          count={reward.dias}
          size={12}
          duration={3.2}
          variant="diamond"
        />
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 180 }}
        className="relative bg-white rounded-3xl shadow-2xl p-7 text-center w-[340px] max-w-sm mx-4"
      >
        {claimed && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        )}

        {avatar?.avatar_id && (
          <div className="w-24 h-24 mx-auto mb-3">
            <AvatarRender
              name={avatar.avatar_id}
              emotion="happy_default"
              pose="standing"
              camera="head"
            />
          </div>
        )}

        <h2 className="text-3xl font-extrabold text-purple-600">
          Glückwunsch! 🎉
        </h2>

        <p className="mt-1 text-lg text-gray-700">
          Du hast{" "}
          <span className="font-bold text-purple-600">Level {level}</span>{" "}
          erreicht!
        </p>

        {hasDiamondReward && (
          <div ref={fromRef} className="mt-3">
            <p className="text-gray-700 text-md">
              Belohnung:{" "}
              <span className="text-cyan-500 font-bold">{reward.dias} 💎</span>
            </p>
          </div>
        )}

        {hasRewards && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-gray-600 text-sm font-semibold">
              Neu freigeschaltet:
            </p>

            {loadingAssets ? (
              <LoadingDots />
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {userAssets.map((ua) => (
                  <div
                    key={ua.asset_id}
                    className="flex flex-col items-center p-2 bg-purple-100 rounded-xl w-20 shadow-sm"
                  >
                    <img
                      src={ua.asset.icon_url ?? ""}
                      className="w-14 h-14 object-contain rounded-md"
                      alt={ua.asset.description ?? ""}
                    />
                    <span className="text-xs mt-1 text-purple-700 font-semibold text-center leading-tight">
                      {ua.asset.description}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {newTools.map((tool) => (
              <div
                key={tool.key}
                className="flex flex-col items-center p-2 bg-green-100 rounded-xl w-20 shadow-sm"
              >
                <div className="text-3xl w-14 h-14 flex items-center justify-center bg-green-200 rounded-md">
                  {tool.icon}
                </div>
                <span className="text-xs mt-1 text-green-700 font-semibold text-center leading-tight">
                  {tool.name}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {hasDiamondReward && !claimed && (
            <button
              ref={toRef}
              onClick={handleClaim}
              disabled={claiming}
              className={`px-5 py-2 rounded-lg text-white font-semibold shadow-md ${
                claiming ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {claiming ? "..." : <>{reward.dias} × 💎 Einfordern</>}
            </button>
          )}

          {claimed && (
            <div className="flex flex-col gap-2">
              {assetIds.length > 0 && (
                <button
                  onClick={async () => {
                    await handleClose()
                    dispatch(openOverlay({ type: "inventory" }))
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 shadow"
                >
                  🎒 Zum Inventar
                </button>
              )}

              {newTools.length > 0 && (
                <button
                  onClick={async () => {
                    await handleClose()
                    dispatch(openOverlay({ type: "tools" }))
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 hover:bg-green-200 text-green-700 shadow"
                >
                  🛠 Zu meinen Tools
                </button>
              )}

              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600"
              >
                Schließen
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}