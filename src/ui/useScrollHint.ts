// src/helpers/useScrollHint.ts
// Wiederverwendbarer Hook für Container mit "no-scrollbar" (ausgeblendetem
// nativen Scrollbalken): zeigt an, ob noch mehr Inhalt unterhalb liegt, und
// bietet eine scrollDown()-Hilfsfunktion für einen optionalen Klick-Pfeil.
//
// Nutzung:
//   const scroll = useScrollHint<HTMLDivElement>()
//   <div ref={scroll.ref} className="overflow-y-auto no-scrollbar">...</div>
//   {scroll.canScrollDown && <ScrollHintArrow onClick={scroll.scrollDown} />}
//
// WICHTIG fürs Markup: der Pfeil darf NICHT innerhalb des scrollenden Elements
// selbst liegen (position:absolute würde dann mitscrollen). Der scrollende
// Container und der Pfeil müssen Geschwister sein, innerhalb eines
// gemeinsamen, NICHT scrollenden position:relative-Wrappers. Siehe
// ScrollHintArrow.tsx für das erwartete Markup-Pattern.

import { useState, useCallback, useEffect, useRef } from "react"

export function useScrollHint<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
    setCanScrollDown(remaining > 8) // kleine Toleranz gegen Rundungsfehler
  }, [])

  useEffect(() => {
    check()
    const el = ref.current
    if (!el) return
    el.addEventListener("scroll", check, { passive: true })
    const resizeObserver = new ResizeObserver(check)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener("scroll", check)
      resizeObserver.disconnect()
    }
  }, [check])

  const scrollDown = useCallback((amount = 120) => {
    ref.current?.scrollBy({ top: amount, behavior: "smooth" })
  }, [])

  return { ref, canScrollDown, recheck: check, scrollDown }
}
