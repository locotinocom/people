import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import Post from "./Post";
import Header from "./Header";
import Footer from "./Footer";
import level1bg from "../assets/backgrounds/garden-6097539.svg";

export default function SwipeDeck() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const posts = [
    {
      username: "@people_coach",
      message: "Heute ist der Tag, an dem du zum ersten Mal Nein sagst – ohne Schuld.",
      backgroundUrl: level1bg,
      level: 1,
      levelname: "Überleben",
      points: 45,
    },
    {
      username: "@people_coach",
      message: "Du darfst fühlen, ohne dich zu rechtfertigen.",
      backgroundUrl: level1bg,
      level: 2,
      levelname: "Gefühl",
      points: 60,
    },
    {
      username: "@people_coach",
      message: "Atme. Spüre. Lass los – genau jetzt.",
      backgroundUrl: level1bg,
      level: 3,
      levelname: "Regulation",
      points: 80,
    },
  ];

  const canPrev = index > 0;
  const canNext = index < posts.length - 1;

  const handlers = useSwipeable({
    onSwipedUp: () => {
      if (canNext) {
        setDir(1);
        setIndex((i) => i + 1);
      }
    },
    onSwipedDown: () => {
      if (canPrev) {
        setDir(-1);
        setIndex((i) => i - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const variants = {
    enter: (direction: 1 | -1) => ({
      y: direction === 1 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { y: 0, opacity: 1 },
    exit: (direction: 1 | -1) => ({
      y: direction === 1 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <>
    
   <Header level={posts[index].level} levelname={posts[index].levelname} />
    <div
      
      className="absolute top-16 bottom-16 left-0 right-0"
      {...handlers}
    >
   

      {/* Swipe-Bereich */}
      <AnimatePresence mode="sync" custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="h-full w-full"
        >
          <Post {...posts[index]} />
        </motion.div>
      </AnimatePresence>

     
    </div> <Footer />
     </>
  );
}
