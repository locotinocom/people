import React from "react";

type HeaderProps = {
  level: number;
  levelname: string;
};

export default function Header({ level, levelname }: HeaderProps) {
  return (
    <div className="p-4 text-center bg-black/40 backdrop-blur">
      <h1 className="font-bold text-yellow-300 text-xl">
        Level {level}: {levelname}
      </h1>
    </div>
  );
}
