import { useCallback, useEffect, useMemo } from "react"
import { useGame } from "../../context/GameContext"

// ✅ Dynamisch alle Intervention-Komponenten laden
const modules = import.meta.glob("../interventions/*.tsx", { eager: true })
const componentMap: Record<string, React.ComponentType<any>> = {}

for (const path in modules) {
  const mod: any = modules[path]
  const name = path.split("/").pop()?.replace(".tsx", "") || ""
  if (mod?.default) componentMap[name] = mod.default
}

export function useRenderHelpers(spawnXp: (amount: number, durationOverride?: number) => void) {
  const { grantReward } = useGame()

  useEffect(() => {
    if (import.meta.env.DEV) console.log("🧠 useRenderHelpers initialisiert")
    return () => {
      if (import.meta.env.DEV) console.log("💀 useRenderHelpers unmounted")
    }
  }, [])

  // 👤 Avatarname ersetzen (z. B. {{avatarName}})
  const replaceAvatarName = useCallback((value: any): any => {
    const raw = localStorage.getItem("avatarName") || "dein Begleiter"
    const name = raw.charAt(0).toUpperCase() + raw.slice(1)

    if (typeof value === "string") return value.replace(/\{\{avatarName\}\}/g, name)
    if (typeof value === "object" && value !== null) {
      const result: Record<string, any> = {}
      for (const key in value) result[key] = replaceAvatarName(value[key])
      return result
    }
    return value
  }, [])

  // 🧩 Einzelne Intervention rendern
  const renderSingle = useCallback(
    (intervention: any, onComplete: () => void) => {
      if (import.meta.env.DEV) console.log("🧩 renderSingle:", intervention.title)
      const Component = componentMap[intervention.template]

      if (!Component) {
        console.warn("❌ Template nicht gefunden:", intervention.template, Object.keys(componentMap))
        return <div className="text-gray-400">❌ Template: {intervention.template}</div>
      }

      const props = replaceAvatarName({
        ...intervention.props,
        xp: intervention.xp,
        onComplete,
      })

      return <Component {...props} />
    },
    [replaceAvatarName]
  )

  // 🪄 MultiStep-Intervention rendern
  const renderMultiStep = useCallback(
    (intervention: any, onDone: () => void) => {
      if (import.meta.env.DEV) console.log("🧩 renderMultiStep:", intervention.title)

      const MultiStep = componentMap["MultiStep"]
      if (!MultiStep) {
        console.error("❌ MultiStep-Komponente fehlt in componentMap:", Object.keys(componentMap))
        return <div className="text-red-400">❌ MultiStep-Komponente fehlt</div>
      }

      const xp = typeof intervention.xp === "number" ? intervention.xp : 20

      return (
        <MultiStep
          slides={intervention.props?.slides ?? []}
          successXp={xp}
          onAllDone={() => {
            spawnXp(xp)
            grantReward({ type: "xp", amount: xp })
            onDone()
          }}
        />
      )
    },
    [spawnXp, grantReward]
  )

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("✅ useRenderHelpers bereit mit Templates:", Object.keys(componentMap))
    }
  }, [])

  return useMemo(
    () => ({ renderSingle, renderMultiStep }),
    [renderSingle, renderMultiStep]
  )
}
