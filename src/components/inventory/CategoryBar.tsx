// src/components/inventory/CategoryBar.tsx

type Props = {
  active: string
  onChange: (key: string) => void
}

const CATEGORIES = [
  { key: "overview",       label: "🎒 Übersicht" },
  { key: "top",            label: "👕 Oberteil" },
  { key: "bottom",         label: "👖 Unterteil" },
  { key: "fullbody",       label: "👘 Outfit" },
  { key: "shoes",          label: "👟 Schuhe" },
  { key: "accessory",      label: "👜 Accessoire" },
  { key: "head_accessory", label: "🕶️ Kopf" },
] as const

export default function CategoryBar({ active, onChange }: Props) {
  return (
    <div className="w-full bg-gray-800 border-b border-gray-700 px-2 flex items-center select-none shrink-0">
      <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1 py-2 px-1">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
              active === key
                ? "bg-blue-600 text-white font-semibold"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}