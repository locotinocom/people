export interface ThunkExtraArgument {
  api: {
    getFullGameState: () => Promise<any>
    // falls du später weitere API-Funktionen willst → hier ergänzen
  }
}