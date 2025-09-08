import React from "react";

type PostProps = {
  backgroundUrl: string;
  message: string;
  username: string;
  level: number;
  levelname: string;
  points: number;
};

export default function Post({
  backgroundUrl,
  message,
  username,
  level,
  levelname,
  points,
}: PostProps) {
  return (
    <div className="relative w-full h-full text-white overflow-hidden">
      {/* Hintergrundbild */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />

      {/* Inhalte */}
      <div className="relative z-10 flex flex-col justify-center h-full p-6">
        <p className="text-lg mb-4">{message}</p>
        <p className="text-sm opacity-70">{username}</p>

        {/* Fortschrittsbalken */}
        <div className="mt-4">
          <div className="w-full h-3 bg-gray-800 rounded-full shadow-inner overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-500"
              style={{ width: `${points}%` }}
            />
          </div>
          <div className="text-sm text-yellow-200 mt-2">
            Noch {100 - points} Punkte bis Level {level + 1}
          </div>
        </div>
      </div>
    </div>
  );
}
