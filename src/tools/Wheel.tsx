import Picker from "react-mobile-picker"
import clsx from "clsx"

const range = (min: number, max: number, step = 1) => {
  const out: string[] = []
  for (let i = min; i <= max; i += step) out.push(String(i))
  return out
}

type WheelProps = {
  value: number
  min: number
  max: number
  step?: number
  disabled?: boolean
  unit?: string
  widthClass?: string
  onChange: (v: number) => void
}

export function Wheel({
  value,
  min,
  max,
  step = 1,
  disabled,
  unit,
  widthClass = "w-24",
  onChange,
}: WheelProps) {
  const values = range(min, max, step)

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          widthClass,
          "rounded-xl border border-white/10 bg-black/20 px-2 py-1"
        )}
      >
        <Picker
          value={{ v: String(value) }}
          onChange={(val) => onChange(Number(val.v))}
          wheelMode="natural"
          disabled={!!disabled}
        >
          <Picker.Column name="v">
            {values.map((v) => (
              <Picker.Item key={v} value={v}>
                <div className="text-center text-white font-semibold py-1 tabular-nums">
                  {v}
                </div>
              </Picker.Item>
            ))}
          </Picker.Column>
        </Picker>
      </div>

      {unit ? <div className="text-white/50 text-xs w-8">{unit}</div> : null}
    </div>
  )
}
