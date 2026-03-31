export const debug = (...args: any[]) => {
  if (import.meta.env.VITE_MOCK_MODE === "true") {
    console.log("[DEBUG]", ...args)
  }
}
