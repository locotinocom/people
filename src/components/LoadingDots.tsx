import { ThreeDot } from "react-loading-indicators"

export default function LoadingDots() {
  return (
    <div className="flex justify-center items-center mt-2">
      <ThreeDot
        color="#7c3aed"    // Lila → passt zu deinem Purple UI
        size="medium"
      />
    </div>
  )
}
