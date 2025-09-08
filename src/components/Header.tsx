import React from "react";

type HeaderProps = {
  level: number;
  levelname: string;
};

export default function Header({ level, levelname }: HeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 p-4 text-center">
      <h1 className="font-bold text-yellow-300 text-xl">
        Level {level}: {levelname}
      </h1>
    </div>
  );
}
