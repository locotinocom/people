type Props = {
  question: string
  yesText: string
  noText: string
}

export default function YesNo({ question, yesText, noText }: Props) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-green-200">
      <p>{question}</p>
      <div className="flex gap-4 mt-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">{yesText}</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded">{noText}</button>
      </div>
    </div>
  )
}
