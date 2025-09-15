type Props = {
  duration: number
  instruction?: string
}

export default function SilenceCounter({ duration, instruction }: Props) {
  return (
<div className="h-full w-full flex flex-col items-center justify-center bg-green-200">
      <p>{instruction || "Bleib still und spüre dich selbst"}</p>
      <p className="mt-4 text-2xl font-bold">{duration} Sekunden</p>
    </div>
  )
}
