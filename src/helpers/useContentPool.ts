import { useState } from "react"
import contentPools from "@data/content_pools.json"

/**
 * useContentPool
 * ================
 * Liefert einen zufällig ausgewählten Eintrag aus einem zentralen Content-Pool
 * (siehe webapp/src/data/content_pools.json).
 *
 * Generisch: Standardmäßig werden String-Pools erwartet (T = string, wie
 * bisher für Reflexionsfragen/Lob-Texte). Für strukturierte Pools (z.B.
 * Objekte mit eigener Ja/Nein-Polung wie bei RelaxationPicker) kann T
 * explizit angegeben werden: useContentPool<MeinTyp>(poolId, fallback).
 *
 * Beim ERSTEN Render wird EINMALIG zufällig ein Eintrag gezogen (kein
 * Re-Roll bei Re-Renders). Existiert die poolId nicht, ist der Pool leer,
 * oder kein gültiges Array, wird der übergebene fallback zurückgegeben.
 */
export function useContentPool<T = string>(
  poolId?: string,
  fallback?: T
): T | undefined {
  const [resolved] = useState<T | undefined>(() => {
    if (!poolId || poolId === "_meta") return fallback

    const pool = (contentPools as Record<string, unknown>)[poolId]

    if (!Array.isArray(pool) || pool.length === 0) return fallback

    return pool[Math.floor(Math.random() * pool.length)] as T
  })

  return resolved
}