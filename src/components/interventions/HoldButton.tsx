type Props = {
  buttonText: string
  holdDuration: number
}

export default function HoldButton({ buttonText, holdDuration }: Props) {
  return (
<div className="h-full w-full flex flex-col items-center justify-center bg-green-200">
      <button className="px-6 py-3 bg-indigo-600 text-white rounded">
        {buttonText} ({holdDuration}s halten)
      </button>
    </div>
  )
}
