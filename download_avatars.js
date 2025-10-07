import fs from "fs"
import path from "path"
import fetch from "node-fetch"

const presets = JSON.parse(fs.readFileSync("./src/assets/avatars/presets/all_presets.json", "utf8"))

// 💡 deine Avatar-IDs
const maleId = "68dd4a29ec2156db9ff2f5eb"
const femaleId = "68dd4a285327e5b9d78e36d2"

// 💬 Emotionen, Posen, Kameras
const emotions = Object.keys(presets)
const defaultExpressions = ["happy", "sad", "rage", "scared", "lol"] // 🆕 Standard-Expressions von RPM
const poses = ["standing", "relaxed", "thumbs-up", "power-stance"]
const cameras = ["portrait", "fullbody"]

const baseOutDir = path.resolve("./avatar_cache")

// 🔧 Hilfsfunktion, um eine Datei herunterzuladen
async function downloadImage(url, filePath) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn("❌ Fehler:", res.status, url)
      return
    }
    const buffer = await res.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(buffer))
    console.log("✅", path.basename(filePath))
  } catch (err) {
    console.error("⚠️ Download-Fehler:", err.message)
  }
}

// 🧩 Bild-URL mit Blendshapes oder Expression bauen
function buildUrl(avatarId, emotion, pose, camera, useExpression = false) {
  const blendParts = []

  if (!useExpression) {
    const data = presets[emotion]?.["1"]
    if (data) {
      for (const key in data) {
        blendParts.push(`blendShapes[${key}]=${data[key]}`)
      }
    }
  } else {
    blendParts.push(`expression=${emotion}`)
  }

  const query = [
    ...blendParts,
    `pose=${pose}`,
    `camera=${camera === "head" ? "portrait" : camera}`,
    `size=1024`
  ].join("&")

  return `https://models.readyplayer.me/${avatarId}.png?${query}`
}

// 🧠 Hauptfunktion
async function generateSet(avatarId, gender) {
  const outDir = path.join(baseOutDir, gender)
  fs.mkdirSync(outDir, { recursive: true })

  // 🧩 1. Eigene Blendshape-Emotionen
  for (const emo of emotions) {
    for (const pose of poses) {
      for (const cam of cameras) {
        const url = buildUrl(avatarId, emo, pose, cam, false)
        const filename = `${emo}_${pose}_${cam}.png`
        const filePath = path.join(outDir, filename)
        if (fs.existsSync(filePath)) continue
        await downloadImage(url, filePath)
      }
    }
  }

  // 🧩 2. Standard Expressions (happy, sad, etc.)
  for (const exp of defaultExpressions) {
    for (const pose of poses) {
      for (const cam of cameras) {
        const url = buildUrl(avatarId, exp, pose, cam, true)
        const filename = `${exp}_default_${pose}_${cam}.png` // 🆕 unterscheidbar speichern
        const filePath = path.join(outDir, filename)
        if (fs.existsSync(filePath)) continue
        await downloadImage(url, filePath)
      }
    }
  }
}

// 🚀 Start
;(async () => {
  console.log("⬇️  Downloading male avatar set...")
  await generateSet(maleId, "male")

  console.log("⬇️  Downloading female avatar set...")
  await generateSet(femaleId, "female")

  console.log("🎉 Alle Avatare wurden gespeichert unter:", baseOutDir)
})()
