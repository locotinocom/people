import clsx from "clsx"

export function SettingRow({
  label,
  children,
  controlsClassName,
}: {
  label: string
  children: React.ReactNode
  controlsClassName?: string
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Label links fix */}
      <div className="text-white/80 text-sm w-24 shrink-0">{label}</div>

      {/* Controls rechts: nimmt Restbreite und zentriert */}
      <div className={clsx("flex-1 flex justify-center", controlsClassName)}>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}
