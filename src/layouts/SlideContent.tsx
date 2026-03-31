import type { ReactNode } from "react"

/**
 * SlideContent-Komponente (Optimiert für Mobile Viewports)
 */
type SlideContentProps = {
  children: ReactNode
  align?: "top" | "center" | "bottom"
  variant?: "default" | "light" | "dark"
  className?: string
}

export default function SlideContent({
  children,
  align = "center",
  variant = "default",
  className = "",
}: SlideContentProps) {
  
  // Vertikale Ausrichtung bestimmen
  // FIX: Wir nutzen justify-between für "center", damit Header und Footer-Buttons 
  // im Slide immer an den Rand gedrückt werden, wenn der Text dazwischen groß ist.
  const alignment =
    align === "top"
      ? "justify-start"
      : align === "bottom"
      ? "justify-end"
      : "justify-between" // "center" wird zu "between" für bessere Platznutzung

  // Farb-/Themevariante bestimmen
  const variantClass =
    variant === "light"
      ? "bg-zinc-100 text-zinc-900"
      : variant === "dark"
      ? "bg-zinc-900 text-white"
      : ""

  return (
    <div
      className={`
        flex flex-col 
        h-full w-full 
        items-center 
        ${alignment} 
        text-center 
        px-6 
        py-4 
        relative 
        overflow-hidden 
        ${variantClass} 
        ${className}
      `}
    >
      {children}
    </div>
  )
}