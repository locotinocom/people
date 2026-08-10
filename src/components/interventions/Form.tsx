import {
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react"
import { motion } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "../../ui/AvatarBubble"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { patchUserProfile, selectSession } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import type { UserProfilePatch } from "@api/types"
import { useContentPool } from "@helpers/useContentPool"

/* =======================
   Types
======================= */

type BaseElement = {
  id: string
  label: string
  required?: boolean
  title: string
  /**
   * Gibt an, wohin der Wert im Profil gespeichert werden soll.
   * Beispiele:
   *   "name"                      → profile.name
   *   "opponent_animal"           → profile.opponent_animal
   *   "meta.trigger_person_role"  → profile.meta.trigger_person_role
   *   "meta.client_text"          → profile.meta.client_text
   */
  saveTo?: string
}

type ScaleElement = BaseElement & {
  type: "scale"
  min: number
  max: number
  step?: number
}

type BooleanElement = BaseElement & {
  type: "boolean"
  yesText?: string
  noText?: string
}

type SingleSelectElement = BaseElement & {
  type: "single_select"
  options: { value: string; label: string }[]
}

type TextElement = BaseElement & {
  type: "text"
  placeholder?: string
  maxLength?: number
}

type TextareaElement = BaseElement & {
  type: "textarea"
  placeholder?: string
  maxLength?: number
}

type FormElement =
  | ScaleElement
  | BooleanElement
  | SingleSelectElement
  | TextElement
  | TextareaElement

/* =======================
   Hilfsfunktion: assignPatchValue
   Schreibt einen Wert anhand eines "saveTo"-Pfads in ein verschachteltes Objekt.
   Beispiel: assignPatchValue(patch, "meta.client_text", "Hallo")
   → { meta: { client_text: "Hallo" } }
======================= */

function assignPatchValue(
  patch: Record<string, unknown>,
  saveTo: string,
  value: unknown
): void {
  const dotIndex = saveTo.indexOf(".")
  if (dotIndex === -1) {
    // Top-Level-Feld: z.B. "name", "opponent_animal"
    patch[saveTo] = value
  } else {
    // Verschachteltes Feld: z.B. "meta.trigger_person_role"
    const top = saveTo.slice(0, dotIndex)
    const rest = saveTo.slice(dotIndex + 1)
    if (!patch[top] || typeof patch[top] !== "object" || Array.isArray(patch[top])) {
      patch[top] = {}
    }
    assignPatchValue(patch[top] as Record<string, unknown>, rest, value)
  }
}

/* =======================
   Hilfsfunktion: getProfileValue
   Liest einen Wert aus dem Profil anhand eines "saveTo"-Pfads.
   Beispiel: getProfileValue(profile, "meta.trigger_person_role")
   → profile.meta?.trigger_person_role
======================= */

function getProfileValue(
  profile: Record<string, unknown> | null | undefined,
  saveTo: string
): unknown {
  if (!profile) return undefined
  const parts = saveTo.split(".")
  let current: unknown = profile
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

type FormData = {
  id: number
  title: string
  elements: FormElement[]
  xp?: number,
  contentPoolId?: string
}

/* =======================
   Validation (zentral)
======================= */

function isElementValid(element: FormElement, value: any): boolean {
  if (!element.required) return true

  switch (element.type) {
    case "scale":
      return typeof value === "number"

    case "boolean":
      return typeof value === "boolean"

    case "single_select":
      return typeof value === "string" && value.length > 0

    case "text":
    case "textarea":
      if (typeof value !== "string") return false
      if (element.maxLength && value.length > element.maxLength) return false
      return value.trim().length > 0

    default:
      return true
  }
}

/* =======================
   Element Renderer
======================= */

const FormElementRenderer = memo(function FormElementRenderer({
  element,
  value,
  onChange,
  title
}: {
  element: FormElement
  value: any
  onChange: (v: any) => void
  title: string
}) {
  const valid = isElementValid(element, value)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      {/* Avatar spricht */}
    
   <AvatarBubble
  title={
    element.required
      ? `${title}`
      : title
  }
/>

{/*  {element.required && (
            <span className="ml-1 text-red-400">*</span>
          )} */}
      {/* User antwortet */}
      <motion.div
        animate={{
          opacity: valid ? 1 : 0.85,
        }}
        transition={{ duration: 0.15 }}
        className="flex flex-col gap-2"
      >
        {/* SCALE */}
        {element.type === "scale" && (
          <>
            <input
              type="range"
              min={element.min}
              max={element.max}
              step={element.step ?? 1}
              value={value ?? element.min}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="text-sm text-gray-400">
              {value ?? element.min}
            </div>
          </>
        )}

        {/* BOOLEAN */}
        {element.type === "boolean" && (
          <div className="flex gap-4">
            <button
              onClick={() => onChange(true)}
              className={clsx(
                "px-4 py-2 rounded-lg border transition",
                value === true
                  ? "bg-green-600 border-green-500"
                  : "border-gray-600 text-gray-300"
              )}
            >
              {element.yesText ?? "Ja"}
            </button>
            <button
              onClick={() => onChange(false)}
              className={clsx(
                "px-4 py-2 rounded-lg border transition",
                value === false
                  ? "bg-green-600 border-green-500"
                  : "border-gray-600 text-gray-300"
              )}
            >
              {element.noText ?? "Nein"}
            </button>
          </div>
        )}

        {/* SINGLE SELECT */}
        {element.type === "single_select" && (
          <div className="flex flex-col gap-2">
            {element.options.map((o) => (
              <button
                key={o.value}
                onClick={() => onChange(o.value)}
                className={clsx(
                  "px-4 py-2 rounded-lg border text-left transition",
                  value === o.value
                    ? "bg-green-600 border-green-500"
                    : "border-gray-600 text-gray-300"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* TEXT */}
        {element.type === "text" && (
          <input
            type="text"
            value={value ?? ""}
            placeholder={element.placeholder}
            maxLength={element.maxLength}
            onChange={(e) => onChange(e.target.value)}
            className={clsx(
              "w-full p-3 rounded-lg bg-gray-800 border transition",
              valid
                ? "border-gray-700"
                : "border-red-500"
            )}
          />
        )}

        {/* TEXTAREA */}
        {element.type === "textarea" && (
          <textarea
            value={value ?? ""}
            placeholder={element.placeholder}
            maxLength={element.maxLength}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={clsx(
              "w-full p-3 rounded-lg bg-gray-800 border resize-none transition",
              valid
                ? "border-gray-700"
                : "border-red-500"
            )}
          />
        )}
      </motion.div>
    </motion.div>
  )
})


/* =======================
   Form
======================= */

function Form({ data }: { data: FormData }) {
  const { id, title, contentPoolId, elements, xp = 0 } = data

  
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const resolvedTitle = useContentPool(contentPoolId, title) ?? title
  // E1: Profil aus Redux-Store für Vorausfüllen
  const { profile } = useAppSelector(selectSession)

  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})

  // E1: Beim Laden der Slide Werte aus session.profile vorausfüllen
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Form] data geladen:", data)
    }

    const prefilled: Record<string, unknown> = {}
    for (const el of elements) {
      if (!el.saveTo) continue
      const existing = getProfileValue(
        profile as Record<string, unknown> | null,
        el.saveTo
      )
      if (existing !== undefined && existing !== null && existing !== "") {
        prefilled[el.id] = existing
      }
    }

    if (import.meta.env.DEV && Object.keys(prefilled).length > 0) {
      console.log("[Form] Vorausgefüllte Werte aus session.profile:", prefilled)
    }

    setValues(prefilled)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id])

  const updateValue = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const hasRequiredElements = useMemo(
    () => elements.some((el) => el.required),
    [elements]
  )

  const isFormValid = useMemo(() => {
    if (!hasRequiredElements) return true
    return elements.every((el) => isElementValid(el, values[el.id]))
  }, [elements, values, hasRequiredElements])

  // D3 + D4: Generisches Patch-Objekt aus saveTo-Feldern bauen
  const handleComplete = useCallback(async () => {
    if (!api || !isFormValid) return

    // Patch-Objekt dynamisch aus allen Elementen mit saveTo aufbauen
    const profilePatch: Record<string, unknown> = {}

    for (const el of elements) {
      if (!el.saveTo) continue
      const val = values[el.id]
      if (val === undefined || val === null) continue
      if (typeof val === "string" && val.trim() === "") continue
      // String-Werte trimmen, andere Typen direkt übernehmen
      const cleanVal = typeof val === "string" ? val.trim() : val
      assignPatchValue(profilePatch, el.saveTo, cleanVal)
    }

    if (import.meta.env.DEV) {
      console.log("[Form] Patch-Objekt gebaut:", JSON.stringify(profilePatch, null, 2))
      console.log("[Form] Sende an patchUserProfile:", profilePatch)
    }

    // 1) Profil über Redux patchen (nur wenn es etwas zu patchen gibt)
    if (Object.keys(profilePatch).length > 0) {
      try {
        const result = await dispatch(
          patchUserProfile({
            api,
            patch: profilePatch as UserProfilePatch,
          })
        ).unwrap()

        if (import.meta.env.DEV) {
          console.log("[Form] patchUserProfile erfolgreich – Store aktualisiert:", result)
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[Form] patchUserProfile fehlgeschlagen:", err)
        }
        return
      }
    }

    // 2) Intervention abschließen (XP-Animation + API-Call + Level-Reload im Thunk)
    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()

    await new Promise((r) => setTimeout(r, 400))

    // 4) Weiter zur nächsten Slide
    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
  }, [api, isFormValid, values, elements, xp, id, dispatch, startAnimation, slideManager])


  return (
    <div className="flex flex-col h-full p-6 text-white">
    

      <div className="flex flex-col gap-6 flex-1">
        {elements.map((el) => (
          <FormElementRenderer
            key={el.id}
            element={el}
            value={values[el.id]}
            onChange={(v) => updateValue(el.id, v)}
            title={resolvedTitle} 
            
          />
        ))}
      </div>

      <motion.button
        ref={btnRef}
        onClick={handleComplete}
        disabled={!isFormValid}
        animate={{ opacity: isFormValid ? 1 : 0.5 }}
        className={clsx(
          "mt-6 px-6 py-3 rounded-lg font-bold transition",
          isFormValid
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-700 cursor-not-allowed"
        )}
      >
        Weiter
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(Form)
