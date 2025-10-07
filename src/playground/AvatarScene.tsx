// src/playground/AvatarScene.tsx
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { useEffect, useRef } from "react"
import * as THREE from "three"

function AvatarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const headRef = useRef<THREE.Object3D | null>(null)
  const eyesRef = useRef<THREE.Object3D[]>([])

  useEffect(() => {
    const foundEyes: THREE.Object3D[] = []

    scene.traverse((obj: any) => {
      if (obj.name === "Head" || obj.name === "Wolf3D_Head") {
        headRef.current = obj
      }
      if (
        obj.name === "LeftEye" ||
        obj.name === "RightEye" ||
        obj.name === "EyeLeft" ||
        obj.name === "EyeRight"
      ) {
        foundEyes.push(obj)
      }
    })

    eyesRef.current = foundEyes
    console.log("🎯 Gefunden:", {
      head: headRef.current?.name,
      eyes: eyesRef.current.map((e) => e.name),
    })
  }, [scene])

  useFrame(() => {
    // Kopf leicht neigen (nachdenklich)
    if (headRef.current) {
      headRef.current.rotation.z = 3
    }

    

    // Augen nach links oben schauen lassen
    eyesRef.current.forEach((eye) => {
      eye.rotation.y = 0.7 // links
      eye.rotation.x = -.40 // oben
    })
  })

  return <primitive object={scene} scale={1.6} />
}

export default function AvatarScene() {
  return (
    <div className="h-screen w-screen bg-gray-900">
      <Canvas camera={{ position: [0, 1.6, 3] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} />
        <AvatarModel url="https://models.readyplayer.me/68dd4a285327e5b9d78e36d2.glb" />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
