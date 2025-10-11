export type Intervention = {
  /** Wird automatisch anhand der Reihenfolge im JSON generiert */
  id?: number

  /** Interner oder sichtbarer Titel der Intervention */
  title: string

  /** Name der React-Komponente, die gerendert werden soll */
  template: string

  /** Typ der Intervention – standardmäßig "single" */
  type?: "single" | "multi"

  /** Level, zu dem diese Intervention gehört */
  level: number

  /** Wird automatisch anhand der Reihenfolge im JSON generiert */
  order?: number

  /** Erfahrungspunkte, die vergeben werden (optional) */
  xp?: number

  /** Ob der Nutzer zur nächsten Folie wischen darf */
  skippable?: boolean

  /** Alle spezifischen Eigenschaften der Komponente */
  props?: {
    slides?: any[]
    [key: string]: any
  }
}
