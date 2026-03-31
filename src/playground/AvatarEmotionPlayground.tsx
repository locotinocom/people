import { useMemo, useState } from "react"
import clsx from "clsx"

const BASE_PATH = "/avatars/eva"

type BottomOption = "default_bottom" | "striped_pencil_skirt_bottom"
type ShoesOption = "none" | "default_shoes" | "shoes_sneakers_white"
type GlassesOption = "none" | "default_head_accessory" | "glasses_round_black"
type HandbagOption = "none" | "default_accessory" | "handbag_black"

type WardrobeState = {
  bottom: BottomOption
  shoes: ShoesOption
  glasses: GlassesOption
  handbag: HandbagOption
}

type AssetOption<T extends string> = {
  id: T
  label: string
  src: string | null
  preview?: string | null
}

const bottomOptions: AssetOption<BottomOption>[] = [
  {
    id: "default_bottom",
    label: "Default",
    src: `${BASE_PATH}/bottom/default_bottom.svg`,
  },
  {
    id: "striped_pencil_skirt_bottom",
    label: "Striped Pencil Skirt",
    src: `${BASE_PATH}/bottom/striped_pencil_skirt_bottom.svg`,
  },
]

const shoesOptions: AssetOption<ShoesOption>[] = [
  {
    id: "none",
    label: "Aus",
    src: null,
  },
  {
    id: "default_shoes",
    label: "Default Shoes",
    src: `${BASE_PATH}/shoes/default_shoes.svg`,
  },
  {
    id: "shoes_sneakers_white",
    label: "White Sneakers",
    src: `${BASE_PATH}/shoes/shoes_sneakers_white.svg`,
  },
]

const glassesOptions: AssetOption<GlassesOption>[] = [
  {
    id: "none",
    label: "Aus",
    src: null,
  },
  {
    id: "default_head_accessory",
    label: "Default",
    src: `${BASE_PATH}/head_accessory/default_head_accessory.svg`,
  },
  {
    id: "glasses_round_black",
    label: "Round Glasses",
    src: `${BASE_PATH}/head_accessory/glasses_round_black.svg`,
  },
]

const handbagOptions: AssetOption<HandbagOption>[] = [
  {
    id: "none",
    label: "Aus",
    src: null,
  },
  {
    id: "default_accessory",
    label: "Default",
    src: `${BASE_PATH}/accessory/default_accessory.svg`,
  },
  {
    id: "handbag_black",
    label: "Black Handbag",
    src: `${BASE_PATH}/accessory/handbag_black.svg`,
  },
]

type RenderLayer = {
  key: string
  src: string | null
  zIndex: number
}

function findAssetSrc<T extends string>(
  options: AssetOption<T>[],
  id: T
): string | null {
  return options.find((item) => item.id === id)?.src ?? null
}

type WardrobeCategoryProps<T extends string> = {
  title: string
  options: AssetOption<T>[]
  selectedId: T
  onSelect: (id: T) => void
}

function WardrobeCategory<T extends string>({
  title,
  options,
  selectedId,
  onSelect,
}: WardrobeCategoryProps<T>) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isSelected = selectedId === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={clsx(
                "rounded-xl border px-3 py-3 text-left text-sm transition",
                isSelected
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white hover:bg-neutral-50"
              )}
            >
              <div className="font-medium">{option.label}</div>
              <div className="mt-1 text-xs opacity-70">{option.id}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function EvaWardrobePlayground() {
  const [wardrobe, setWardrobe] = useState<WardrobeState>({
    bottom: "default_bottom",
    shoes: "default_shoes",
    glasses: "default_head_accessory",
    handbag: "default_accessory",
  })

  const renderLayers = useMemo<RenderLayer[]>(() => {
    return [
      {
        key: "base",
        src: `${BASE_PATH}/base/default_base.svg`,
        zIndex: 0,
      },
      {
        key: "bottom",
        src: findAssetSrc(bottomOptions, wardrobe.bottom),
        zIndex: 10,
      },
      {
        key: "shoes",
        src: findAssetSrc(shoesOptions, wardrobe.shoes),
        zIndex: 20,
      },
      {
        key: "top",
        src: `${BASE_PATH}/top/default_top.svg`,
        zIndex: 30,
      },
      {
        key: "accessory_handbag",
        src: findAssetSrc(handbagOptions, wardrobe.handbag),
        zIndex: 40,
      },
      {
        key: "hair_base",
        src: `${BASE_PATH}/hair_base/default_hair_base.svg`,
        zIndex: 50,
      },
      {
        key: "head_base",
        src: `${BASE_PATH}/head_base/eva_default_head_base.svg`,
        zIndex: 60,
      },
      {
        key: "emotion_fullbody",
        src: `${BASE_PATH}/emotions_fullbody/default_emotion.svg`,
        zIndex: 70,
      },
      {
        key: "hair_top",
        src: `${BASE_PATH}/hair_top/default_hair_top.svg`,
        zIndex: 80,
      },
      {
        key: "head_accessory_glasses",
        src: findAssetSrc(glassesOptions, wardrobe.glasses),
        zIndex: 90,
      },
    ]
  }, [wardrobe])

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* Garderobe */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold">Eva Wardrobe Playground</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Bottom wählen, Schuhe, Brille und Handtasche an- oder ausziehen.
            </p>
          </div>

          <WardrobeCategory
            title="Bottom"
            options={bottomOptions}
            selectedId={wardrobe.bottom}
            onSelect={(id) =>
              setWardrobe((prev) => ({
                ...prev,
                bottom: id,
              }))
            }
          />

          <WardrobeCategory
            title="Shoes"
            options={shoesOptions}
            selectedId={wardrobe.shoes}
            onSelect={(id) =>
              setWardrobe((prev) => ({
                ...prev,
                shoes: id,
              }))
            }
          />

          <WardrobeCategory
            title="Glasses"
            options={glassesOptions}
            selectedId={wardrobe.glasses}
            onSelect={(id) =>
              setWardrobe((prev) => ({
                ...prev,
                glasses: id,
              }))
            }
          />

          <WardrobeCategory
            title="Handbag"
            options={handbagOptions}
            selectedId={wardrobe.handbag}
            onSelect={(id) =>
              setWardrobe((prev) => ({
                ...prev,
                handbag: id,
              }))
            }
          />
        </aside>

        {/* Preview */}
        <main className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Preview</h2>
              <p className="text-sm text-neutral-500">
                Fullbody emotion aktiv, standalone emotions ignoriert.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
            <div className="flex items-center justify-center rounded-3xl bg-neutral-100 p-6">
              <div className="relative h-[720px] w-[340px] overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#fafafa_0%,#f0f0f0_100%)] shadow-inner">
                {renderLayers.map((layer) => {
                  if (!layer.src) return null

                  return (
                    <img
                      key={layer.key}
                      src={layer.src}
                      alt={layer.key}
                      className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                      style={{ zIndex: layer.zIndex }}
                      draggable={false}
                    />
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border bg-neutral-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-600">
                  Aktuell angezogen
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span>Bottom</span>
                    <span className="font-medium">{wardrobe.bottom}</span>
                  </div>

                  <div className="flex items-center justify-between border-b pb-2">
                    <span>Shoes</span>
                    <span className="font-medium">{wardrobe.shoes}</span>
                  </div>

                  <div className="flex items-center justify-between border-b pb-2">
                    <span>Glasses</span>
                    <span className="font-medium">{wardrobe.glasses}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2">
                    <span>Handbag</span>
                    <span className="font-medium">{wardrobe.handbag}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-neutral-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-600">
                  Render Order
                </h3>

                <div className="space-y-2 text-sm">
                  {renderLayers.map((layer) => (
                    <div
                      key={layer.key}
                      className="flex items-center justify-between border-b pb-2 last:border-b-0"
                    >
                      <span>{layer.key}</span>
                      <span className="text-neutral-500">
                        {layer.src ? `z=${layer.zIndex}` : "aus"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}