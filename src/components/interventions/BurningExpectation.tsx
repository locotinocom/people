type Props = {
  prompt: string
  buttonText: string
}

export default function BurningExpectation({ prompt, buttonText }: Props) {
  return (
<div className="h-full w-full flex flex-col items-center justify-center bg-green-200">
      <p>{prompt}</p>
      <button className="mt-4 px-6 py-3 bg-red-600 text-white rounded">{buttonText}</button>
    </div>
  )
}
