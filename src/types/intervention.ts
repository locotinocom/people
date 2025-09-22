export type Intervention = {
  id: number
  title: string
  template: string
  type: "single" | "multi"
  level: number
  order: number
  xp?: number
  props?: {
    slides?: any[]
    [key: string]: any
  }
}
