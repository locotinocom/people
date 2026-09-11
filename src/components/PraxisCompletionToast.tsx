// src/components/PraxisCompletionToast.tsx
import toast from "react-hot-toast"

export function showPraxisCompletionToast(diamondAmount: number, itemTitle: string) {
  toast.custom(
    () => (
      <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg">
        <span className="text-xl">✓</span>
        <div className="flex-1">
          <div className="font-semibold text-sm">{itemTitle} erledigt!</div>
          <div className="text-xs text-green-100">+{diamondAmount} 💎</div>
        </div>
      </div>
    ),
    { duration: 3000, position: "top-center" }
  )
}
