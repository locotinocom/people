import { SUPPORT_RESOURCES } from "@data/supportResources"

export default function HelpSupportTool() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 text-white">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Hilfe & Unterstützung</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Wenn&apos;s gerade zu viel wird oder du mit jemandem sprechen möchtest:
            Diese Stellen sind kostenlos, anonym und rund um die Uhr erreichbar.
          </p>
        </div>

        <div className="space-y-4">
          {SUPPORT_RESOURCES.countries.map((country) => (
            <div
              key={country.country}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-sm font-semibold text-white">
                {country.country === "Deutschland" ? "🇩🇪" : country.country === "Österreich" ? "🇦🇹" : "🇨🇭"}{" "}
                {country.country}
              </p>

              <div className="mt-2 space-y-1 text-sm text-white/80">
                <p>
                  <span className="font-medium text-white">{country.service}</span>
                  {": "}
                  {country.numbers.join(" oder ")}
                </p>
                <p className="text-white/60">{country.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-200">Hinweis bei akuter Gefahr:</p>
          <p className="mt-1 text-sm text-white/80">
            Wenn du oder jemand anderes in unmittelbarer Gefahr ist: {SUPPORT_RESOURCES.emergencyPhone}{" "}
            (europaweiter Notruf).
          </p>
        </div>

        <p className="pt-2 text-xs text-white/50">
          Locotino ersetzt keine Therapie oder ärztliche Behandlung.
        </p>
      </div>
    </div>
  )
}
