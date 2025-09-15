import React from "react";

export default function Footer() {
  return (
    <div className="p-3 flex justify-around bg-black/40 backdrop-blur">
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
    </div>
  );
}
