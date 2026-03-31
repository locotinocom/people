import { useEffect, useRef } from "react"

export function useClickPosition() {
  const pos = useRef<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  useEffect(() => {
    const update = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        pos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else if ("clientX" in e) {
        pos.current = { x: e.clientX, y: e.clientY }
      }
    }

    window.addEventListener("click", update, { passive: true })
    window.addEventListener("touchstart", update, { passive: true })

    return () => {
      window.removeEventListener("click", update)
      window.removeEventListener("touchstart", update)
    }
  }, [])

  return pos
}
