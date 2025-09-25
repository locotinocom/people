export default function Footer() {
  return (
    <footer className="h-16 bg-black/50 backdrop-blur flex justify-around items-center">
      <button className="flex flex-col items-center text-xs hover:text-blue-400 transition">
        🏠
        <span>Home</span>
      </button>
      <button className="flex flex-col items-center text-xs hover:text-blue-400 transition">
        🔍
        <span>Suchen</span>
      </button>
      <button className="flex flex-col items-center text-xs hover:text-blue-400 transition">
        ➕
        <span>Neu</span>
      </button>
      <button className="flex flex-col items-center text-xs hover:text-blue-400 transition">
        👤
        <span>Profil</span>
      </button>
    </footer>
  )
}
