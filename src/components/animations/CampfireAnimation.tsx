// src/components/animations/CampfireAnimation.tsx
// Lagerfeuer-Animation mit Flammen und Ember-Partikeln

import { useEffect, useRef, memo } from "react"

interface CampfireAnimationProps {
  isLit: boolean
  isIntense?: boolean
}

function CampfireAnimation({ isLit, isIntense = false }: CampfireAnimationProps) {
  const embersRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<number | null>(null)

  // Ember-Partikel spawnen
  useEffect(() => {
    if (!isLit || !embersRef.current) return

    const spawnEmbers = (count: number, intense: boolean) => {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!embersRef.current) return

          const ember = document.createElement("div")
          ember.className = "absolute rounded-full pointer-events-none"
          
          const dx = (Math.random() - 0.5) * (intense ? 100 : 60)
          ember.style.setProperty("--dx", `${dx}px`)
          ember.style.left = `${70 + Math.random() * 80}px`
          ember.style.top = `${40 + Math.random() * 60}px`
          ember.style.animationDelay = `${Math.random() * 0.3}s`
          ember.style.background = Math.random() > 0.4 ? "#ff6b00" : "#ffcc00"
          
          const size = (intense ? 4 : 3) + "px"
          ember.style.width = size
          ember.style.height = size
          ember.style.animation = "ember 2s ease-out forwards"

          embersRef.current?.appendChild(ember)

          setTimeout(() => ember.remove(), 2300)
        }, i * (intense ? 130 : 280))
      }
    }

    // Normale Ember-Produktion
    intervalRef.current = window.setInterval(() => {
      spawnEmbers(2, false)
    }, 1100)

    // Intensive Ember-Produktion wenn isIntense
    if (isIntense) {
      spawnEmbers(10, true)
      setTimeout(() => spawnEmbers(8, true), 1500)
      setTimeout(() => spawnEmbers(6, true), 3000)
      setTimeout(() => spawnEmbers(4, true), 5000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLit, isIntense])

  return (
    <div className="relative w-[220px] h-[160px]">
      {/* SVG Lagerfeuer */}
      <svg className="w-[220px] h-[160px] overflow-visible" viewBox="0 0 220 160">
        {/* Holzscheite */}
        <line x1="60" y1="145" x2="110" y2="128" stroke="#5a2e0e" strokeWidth="7" strokeLinecap="round"/>
        <line x1="160" y1="145" x2="110" y2="128" stroke="#5a2e0e" strokeWidth="7" strokeLinecap="round"/>
        <line x1="55" y1="148" x2="165" y2="148" stroke="#4a2408" strokeWidth="7" strokeLinecap="round"/>
        <line x1="70" y1="144" x2="110" y2="130" stroke="#6b3a1f" strokeWidth="5" strokeLinecap="round"/>
        <line x1="150" y1="144" x2="110" y2="130" stroke="#6b3a1f" strokeWidth="5" strokeLinecap="round"/>

        {/* Glut */}
        <circle cx="95" cy="134" r="4" fill="#c0390b" opacity="0.85"/>
        <circle cx="110" cy="130" r="3.5" fill="#e85c1a" opacity="0.75"/>
        <circle cx="124" cy="134" r="3" fill="#c0390b" opacity="0.8"/>
        <circle cx="102" cy="138" r="3" fill="#8b3010" opacity="0.9"/>
        <circle cx="118" cy="138" r="2.5" fill="#c0390b" opacity="0.7"/>

        {/* Flammen */}
        <g 
          id="flames" 
          style={{
            opacity: isLit ? 1 : 0,
            transition: "opacity 1.5s, transform 0.3s",
            transform: isIntense ? "scaleY(1.45) scaleX(1.18)" : "scaleY(1) scaleX(1)",
            transformOrigin: "110px 148px"
          }}
        >
          {/* Äußere Flammen (orange) */}
          <ellipse 
            cx="88" cy="108" rx="13" ry="26" 
            fill="#e85c1a" 
            style={{
              animation: "flame2 1.7s ease-in-out infinite 0.3s",
              transformOrigin: "88px 128px"
            }}
          />
          <ellipse 
            cx="132" cy="110" rx="13" ry="24" 
            fill="#e85c1a" 
            style={{
              animation: "flame1 1.9s ease-in-out infinite 0.5s",
              transformOrigin: "132px 128px"
            }}
          />

          {/* Mittlere Flammen (gelb-orange) */}
          <ellipse 
            cx="94" cy="100" rx="9" ry="20" 
            fill="#f5a623" 
            style={{
              animation: "flame3 1.4s ease-in-out infinite 0.2s",
              transformOrigin: "94px 125px"
            }}
          />
          <ellipse 
            cx="126" cy="102" rx="9" ry="18" 
            fill="#f5a623" 
            style={{
              animation: "flame2 1.6s ease-in-out infinite 0.6s",
              transformOrigin: "126px 125px"
            }}
          />

          {/* Zentrale Flamme (groß) */}
          <ellipse 
            cx="110" cy="88" rx="22" ry="42" 
            fill="#e85c1a" 
            style={{
              animation: "flame1 1.8s ease-in-out infinite",
              transformOrigin: "110px 128px"
            }}
          />

          {/* Innere Flammen (hell) */}
          <ellipse 
            cx="110" cy="86" rx="13" ry="32" 
            fill="#f5a623" 
            style={{
              animation: "flame2 1.4s ease-in-out infinite 0.1s",
              transformOrigin: "110px 122px"
            }}
          />
          <ellipse 
            cx="110" cy="84" rx="7" ry="22" 
            fill="#ffd166" 
            style={{
              animation: "flame3 1.1s ease-in-out infinite 0.15s",
              transformOrigin: "110px 118px"
            }}
          />
        </g>
      </svg>

      {/* Ember-Partikel Container */}
      <div 
        ref={embersRef}
        className="absolute top-0 left-0 w-[220px] h-[160px] pointer-events-none"
      />

      {/* Keyframe-Animationen */}
      <style>{`
        @keyframes flame1 {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          30% { transform: scaleY(1.12) scaleX(0.92); }
          60% { transform: scaleY(0.93) scaleX(1.08); }
        }
        @keyframes flame2 {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          40% { transform: scaleY(1.18) scaleX(0.88); }
          70% { transform: scaleY(0.9) scaleX(1.1); }
        }
        @keyframes flame3 {
          0%, 100% { transform: scaleY(1); }
          35% { transform: scaleY(1.22) translateY(-5px); }
          65% { transform: scaleY(0.88); }
        }
        @keyframes ember {
          0% { 
            opacity: 1; 
            transform: translateY(0) translateX(0) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-80px) translateX(var(--dx)) scale(0.2); 
          }
        }
      `}</style>
    </div>
  )
}

export default memo(CampfireAnimation)
