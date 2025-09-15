type Props = {
  options: string[]
}

export default function Choice({ options }: Props) {
  return (
<div className="h-full w-full flex flex-col items-center justify-center bg-green-200">
      <p>Wähle eine Option:</p>
      <div className="flex flex-col gap-2 mt-4">
        {options.map((opt, i) => (
          <button key={i} className="px-4 py-2 bg-blue-500 text-white rounded">
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
