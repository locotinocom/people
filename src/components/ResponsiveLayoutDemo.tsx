import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"


export default function ResponsiveLayoutDemo() {
  return (
    <div className="h-dvh flex items-center justify-center bg-gray-900 text-white">
      {/* Wrapper: auf Desktop begrenzt, auf Mobile full width/height */}
      <div className="h-full w-full flex flex-col bg-gray-900 sm:rounded-lg sm:shadow-lg sm:max-w-3xl sm:max-h-[700px] overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-gray-800 flex items-center justify-between px-4">
          <span className="font-bold">Meine App</span>
          <nav className="space-x-4 hidden sm:block">
            <a href="#" className="hover:underline">Home</a>
            <a href="#" className="hover:underline">Profil</a>
            <a href="#" className="hover:underline">Einstellungen</a>
          </nav>
        </header>

        {/* Content mit Swiper */}
        <main className="flex-1 min-h-0 flex items-center justify-center p-0">
          <div className="w-full h-full bg-blue-800 flex items-center justify-center">
            <Swiper direction="vertical" slidesPerView={1} className="h-full w-full">
              <SwiperSlide>
                <div className="flex items-center justify-center h-full bg-blue-600">
                  <p className="text-xl font-bold">Slide 1 – Dummy Text</p>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="flex items-center justify-center h-full bg-green-600">
                  <p className="text-xl font-bold">Slide 2 – Dummy Text</p>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="flex items-center justify-center h-full bg-purple-600">
                  <p className="text-xl font-bold">Slide 3 – Dummy Text</p>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </main>

        {/* Footer Menü */}
        <footer className="h-16 bg-black/50 backdrop-blur flex justify-around items-center">
          <button className="flex flex-col items-center text-xs">
            🏠
            <span>Home</span>
          </button>
          <button className="flex flex-col items-center text-xs">
            🔍
            <span>Suchen</span>
          </button>
          <button className="flex flex-col items-center text-xs">
            ➕
            <span>Neu</span>
          </button>
          <button className="flex flex-col items-center text-xs">
            👤
            <span>Profil</span>
          </button>
        </footer>
      </div>
    </div>
  )
}
