import { motion } from "framer-motion"
import { useEffect, useState } from "react"

type Props = {
  value: number
}

export default function DiamondCounter({ value }: Props) {
  const [count, setCount] = useState(value)
  const [animateKey, setAnimateKey] = useState(0)

  useEffect(() => {
    if (count < value) {
      const timer = setTimeout(() => {
        setCount((prev) => prev + 1)
        setAnimateKey((k) => k + 1)
      }, 100) // Geschwindigkeit
      return () => clearTimeout(timer)
    }
    if (count > value) {
      const timer = setTimeout(() => {
        setCount((prev) => prev - 1)
        setAnimateKey((k) => k + 1)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [count, value])

  return (
    <motion.span
      key={animateKey}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.4, 1] }}
      transition={{ duration: 0.25 }}
      className="text-cyan-300 font-bold text-2xl"
    >{count}
    </motion.span>
  )
}
