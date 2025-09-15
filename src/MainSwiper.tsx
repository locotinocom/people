import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import interventions from "./data/interventions.json"
import InterventionRenderer from "./InterventionRenderer"
import Header from "./components/Header"
import Footer from "./components/Footer"

export default function MainSwiper() {
  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      {/* Phone Frame */}
      <div className="grid h-full w-full max-w-[500px] rounded-[20px] bg-zinc-900 md:h-[800px] md:w-4/5 grid-rows-[auto,1fr,auto]">
        
        {/* Header nimmt fixen Platz */}
        <Header level={1} levelname="Einführung" />

        {/* Swiper füllt nur den Content-Bereich */}
        <div className="overflow-hidden">
          <Swiper direction="vertical" slidesPerView={1} className="h-full" speed={600} resistanceRatio={0.5}>
            {interventions.map((intervention) => (
              <SwiperSlide key={intervention.id} className="h-full">
                <div className="h-full flex items-center justify-center">
                  <InterventionRenderer intervention={intervention} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Footer nimmt fixen Platz */}
        <Footer />
      </div>
    </div>
  )
}
