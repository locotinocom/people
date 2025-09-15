import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

type Props = {
  number: number
}

function Intervention({ number }: Props) {
  const isHorizontal = number % 3 === 0 // jede 3. Intervention

  return (
    <div className="flex flex-col h-screen">
      {/* Top: Level Info */}
      <div className="p-4 bg-gray-200 text-center">Level Info (oben)</div>

      {/* Middle: Hauptcontent */}
      <div className="flex-1 flex items-center justify-center text-xl">
        {isHorizontal ? (
          <Swiper
            direction="horizontal"
            slidesPerView={1}
            nested={true} // wichtig für verschachtelte Swiper
            className="w-full h-full"
          >
            <SwiperSlide>
              <div className="flex items-center justify-center h-full bg-blue-100">
                Intervention #{number} – Slide 1  
                <br />
                👉 Swipe seitlich
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="flex items-center justify-center h-full bg-blue-200">
                Intervention #{number} – Slide 2
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="flex items-center justify-center h-full bg-blue-300">
                Intervention #{number} – Slide 3
              </div>
            </SwiperSlide>
          </Swiper>
        ) : (
          <div className="flex items-center justify-center h-full bg-green-100">
            Intervention #{number}
          </div>
        )}
      </div>

      {/* Bottom: Menü */}
      <div className="p-4 bg-gray-200 text-center">Menü (unten)</div>
    </div>
  )
}

export default Intervention
