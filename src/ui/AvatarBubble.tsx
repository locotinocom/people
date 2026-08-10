import clsx from "clsx"
import AvatarRender from "@components/AvatarRender"

type Props = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  size?: number
  className?: string
}

export default function AvatarBubble({
  title,
  subtitle,
  size = 72,
  className,
}: Props) {
  return (
    <div className={clsx("flex items-start gap-3", className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <AvatarRender
          variant="bubble"
          camera="head"
          emotion="happy_default"
          className="w-full h-full"
        />
      </div>

      <div className="relative max-w-[320px] min-h-[72px] rounded-[22px] bg-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-900 shadow-sm">
        <span
          className="
            absolute
            left-[-10px]
            top-6
            h-0
            w-0
            border-y-[10px]
            border-y-transparent
            border-r-[12px]
            border-r-gray-100
          "
          aria-hidden="true"
        />
        <div className="font-semibold">{title}</div>
        {subtitle && (
          <div className="mt-1 text-xs text-gray-600">{subtitle}</div>
        )}
      </div>
    </div>
  )
}