// src/api/types.ts

// ------------------------------------------------------------
// GENERIC API RESPONSE WRAPPER
// ------------------------------------------------------------
export interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  message?: string
  error?: string | null
}

// ------------------------------------------------------------
// USER & PROFILE
// ------------------------------------------------------------
export type AuthProvider = "local" | "google" | "facebook" | "apple"
export type Gender = "m" | "f" | "divers" | "unbekannt"


export interface AvatarStatus {
  hasAvatar: boolean
  avatar_id?: string
  gender?: string
}

export interface AvatarStatusResponse {
  hasAvatar: boolean
  avatar_id?: string
  gender?: string
}


export interface User {
  id: number
  email: string
  /* password?: string | null */
  name: string | null
  provider: AuthProvider
  provider_id: string | null
  avatar_id: string | null
  role: string
  is_verified: boolean
  created: string | null
  modified: string | null
}


// ------------------------------------------------------------
// AVATAR (READY PLAYER ME)
// ------------------------------------------------------------
export interface UserAvatar {
  id: number
  user_id: number
  avatar_id: string
  name: string
  emotion: string | null
  pose: string | null
  camera: string
  meta: unknown | null
  created: string
  modified: string
  gender: "male" | "female" | "neutral"
   glbUrl: string
}

// ------------------------------------------------------------
// INTERVENTIONS
// ------------------------------------------------------------
export type InterventionType = "single" | "multi"

export interface Intervention {
  id: number
  user_id: number
  level: number
  title: string
  template: string
  type: InterventionType
  xp: number
  skippable: boolean
  ai_relevance: boolean
  ai_topic: string | null
  props: unknown | null
  slides: unknown | null
  completed: boolean
  xp_earned: number
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// DIAMONDS
// ------------------------------------------------------------
export interface DiamondState {
  id: number
  user_id: number
  balance: number
  updated_at: string
}

// ------------------------------------------------------------
// LEVEL STATS
// ------------------------------------------------------------
export interface ProgressResponse {
  intervention_id: number | null
  completed_at: string | null
}

export interface LevelStatsResponse {
  level: number
  total_xp: number
  xp_needed: number
  xp_in_level: number
  xp_remaining: number
  progress_percent: number
  level_completed: boolean
   avatarId?: string | null
}

// checkAndRender response
export interface CheckAndRenderResponse {
  changed: boolean
}


// ------------------------------------------------------------
// GAME STATE BUNDLE
// ------------------------------------------------------------

export interface PendingLevelUpReward {
  dias: number
  transaction_id: number
  level: number
  asset_ids: string[]
  tool_ids: string[]
}

export interface PendingLevelUp {
  level: number
  reward: PendingLevelUpReward
}

export interface GameStateBundle {
  user: User
  profile: UserProfile | null
  avatar: UserAvatar | null
  avatar_items: AvatarItem[]
  interventions: Intervention[]
  level: number
  xp: number
  dias: number
  completed_ids: number[]
  current_intervention_id: number | null
  last_completed_at: string | null
  levelStats: LevelStatsResponse | null
  /** Offene (pending) LevelUp-Transaction – null wenn bereits eingelöst */
  pending_levelup: PendingLevelUp | null
}

// ------------------------------------------------------------
// AVATAR ITEMS / ASSETS (BackEnd-Daten)
// ------------------------------------------------------------
export interface AvatarItem {
  id: number
  user_id: number
  category: string
  item_key: string
  cost: number
  level_required: number
  unlocked: boolean
  equipped: boolean
  meta: unknown | null
  created: string
  modified: string
}

// FULL USER ASSET WITH JOINED ASSET INFO
export interface UserAssetWithMeta {
  user_id: number
  asset_id: number
  unlocked: boolean
  owned: boolean
  equipped: boolean
  is_new: boolean
  created: string
  modified: string

  asset: {
    id: number
    name: string
    description: string | null
    type: string
    gender: string | null
    icon_url: string | null
    price_dias: number
    required_level: number
    external_id: string | null
  }
}

// ------------------------------------------------------------
// INVENTORY RAW API RESPONSE (CakePHP /inventory/get)
// ------------------------------------------------------------
export interface RawAsset {
  id: number
  external_id: string | null
  name: string
  description: string | null
  type: string
  gender: string | null
  icon_url: string | null
  required_level: number
  price_dias: number
  owned: boolean
  unlocked: boolean
  equipped: boolean
  is_new: boolean
}

export interface InventoryItem {
  id: number
  asset_id: number
  external_id: string
  name: string
  description: string | null
  type: string
  gender: "male" | "female" | "neutral"
  icon_url: string
  required_level: number
  price_dias: number
  meta: any

  owned: boolean
  unlocked: boolean
  equipped: boolean
  is_new: boolean
}

export interface SyncAvatarItemsInput {
  wearables: string[]
}

export interface SyncAvatarItemsResponse {
  equipped_asset_ids: number[]
  count: number
}



// ------------------------------------------------------------
// INVENTORY UI ITEM
// ------------------------------------------------------------
export interface UIItem {
  id: number
  name: string
  iconUrl: string | null
  category: string
  level: number
  priceDias: number
  owned: boolean
  unlocked: boolean
  equipped: boolean
  isNew: boolean
}

// ------------------------------------------------------------
// INVENTORY REDUX SLICE STATE
// ------------------------------------------------------------
export interface InventoryUIState {
  items: UIItem[]
  equipped: Record<string, number>
  loading: boolean
}


// ------------------------------------------------------------
// TOOLS (freischaltbare Standalone-Tools)
// ------------------------------------------------------------
export type ToolKey = "breath_tool" | string  // erweiterbar

export interface ToolDefinition {
  key: ToolKey
  name: string
  description: string
  icon: string          // Emoji oder URL
  previewImage?: string // optionales Vorschaubild
  price_dias: number
  required_level: number
}

export interface UserTool {
  key: ToolKey
  unlocked: boolean
  owned: boolean
  is_new: boolean
}

// Kombiniert: Definition + User-Status
export interface ToolItem extends ToolDefinition {
  unlocked: boolean
  owned: boolean
  is_new: boolean
}

export interface BuyAssetResponse {
  asset_id: number
  new_balance: number
}

export interface EquipAssetResponse {
  asset_id: number
  type: string
}

export interface UnequipAssetResponse {
  asset_id: number
  type: string
}

export interface EquippedMapResponse {
  equipped: Record<
    string,
    {
      asset_id: number
      external_id: string
      name: string
      icon_url: string | null
    }
  >
}

export interface UserProfile {
  id?: number
  user_id: number
  name?: string | null
  opponent_animal?: string | null
  /**
   * Dynamische JSON-Daten (z.B. trigger_person_role, client_text, ...).
   * Kommt vom Backend IMMER als decodiertes Objekt, niemals als JSON-String.
   *
   * Bekannte, aber optionale Felder für den SubTypeFinderAI-Interventionstyp:
   * - subtype_answered_ids: IDs aller bereits beantworteten SUBTYPE_STATEMENTS
   *   (über alle Level hinweg), damit die Frage-Engine keine Frage doppelt zieht.
   * - subtype_all_answers: Alle bisher gesammelten Rohantworten (0/1 statt
   *   boolean, damit JSON-stabil), Key = statementId. Wird verwendet, um das
   *   Primär-/Sekundärprofil kumulativ über alle Level hinweg neu zu berechnen.
   */
  meta?: (Record<string, unknown> & {
    subtype_answered_ids?: string[]
    subtype_all_answers?: Record<string, number>
  }) | null


  // optional (DB hat's, Backend-PATCH evtl. noch nicht freigeschaltet)
  age?: number | null
  gender?: "m" | "f" | "divers" | "unbekannt" | null
  occupation?: string | null
  country?: string | null
}

/**
 * Patch-Payload für PATCH /users/patch-profile.
 * meta wird serverseitig gemergt (nie ersetzt).
 */
export type UserProfilePatch = Partial<
  Pick<UserProfile, "name" | "opponent_animal" | "age" | "gender" | "occupation" | "country">
> & {
  /** Nur die zu ändernden meta-Keys senden – bestehende Keys bleiben erhalten */
  meta?: Record<string, unknown>
}
// ------------------------------------------------------------
// TOOLS API RESPONSES
// ------------------------------------------------------------
export interface BuyToolResponse {
  tool_key: string
  new_balance: number
}

export interface GetToolsResponse {
  key: string
  name: string
  description: string
  icon: string
  preview_image: string | null
  price_dias: number
  required_level: number
  unlocked: boolean
  owned: boolean
  is_new: boolean
}

// ------------------------------------------------------------
// API INTERFACE (alle Endpoints streng typisiert)
// ------------------------------------------------------------
export interface ApiInterface {
  getFullGameState(): Promise<ApiResponse<GameStateBundle>>

  getProgress(): Promise<ApiResponse<ProgressResponse | null>>

  getCurrentLevel(): Promise<ApiResponse<LevelStatsResponse>>

  getDiamonds(): Promise<ApiResponse<DiamondState | null>>

  saveInterventionProgress(
    interventionId: number,
    xp: number
  ): Promise<ApiResponse<{ success: boolean; xp?: number }>>

  getUser(): Promise<ApiResponse<User>>
  getUserAvatar(): Promise<ApiResponse<{
    pose: string | undefined
    camera: string | undefined
    emotion: string | undefined
    name: string | undefined
    avatarId: string
}>>

  completeIntervention(
    interventionId: number
  ): Promise<ApiResponse<any>>

  addDiamonds(
    amount: number,
    reason?: string,
    relatedId?: number
  ): Promise<ApiResponse<any>>

  // Tools
  getTools(): Promise<ApiResponse<GetToolsResponse[]>>
  buyTool(toolKey: string): Promise<ApiResponse<BuyToolResponse>>
  markToolSeen(toolKey: string): Promise<ApiResponse<{ ok: boolean }>>

setAvatar(
  name: string,
  avatarId: string,
  gender: string
): Promise<ApiResponse<{ avatar: UserAvatar }>>


  getInventory(): Promise<ApiResponse<InventoryItem[]>>

  getUserAssetsByIds(
    ids: number[]
  ): Promise<ApiResponse<UserAssetWithMeta[]>>

  saveInventory(data: {
    owned: number[]
    unlocked: number[]
    equipped: Record<string, number>
    newItems: number[]
  }): Promise<ApiResponse<{ success: boolean }>>

  buyAsset(assetId: number): Promise<ApiResponse<BuyAssetResponse>>

equipItem(input: {
  assetId: number
  category: string
}): Promise<ApiResponse<EquipAssetResponse>>

unequipItem(input: {
  assetId: number
  category: string
}): Promise<ApiResponse<UnequipAssetResponse>>
  getAvatarStatus(): Promise<ApiResponse<AvatarStatusResponse>>

syncAvatarItems(
    input: SyncAvatarItemsInput
  ): Promise<ApiResponse<SyncAvatarItemsResponse>>
getEquippedAssets(): Promise<ApiResponse<EquippedMapResponse>>
  checkAndRender(): Promise<ApiResponse<{ changed: boolean }>>
  patchProfile: (patch: UserProfilePatch) => Promise<ApiResponse<{ user_id: number; profile: UserProfile }>>

}
