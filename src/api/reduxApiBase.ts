// src/api/createBaseApi.ts
import { request, invalidateCacheFor } from "./request"
import type {
  ApiInterface,
  GameStateBundle,
  User,
  ProgressResponse,
  LevelStatsResponse,
  DiamondState,
  InventoryItem,
  SyncAvatarItemsResponse,
  SyncAvatarItemsInput,
  CheckAndRenderResponse,
  UserAvatar,
  AvatarStatusResponse,
  UserProfilePatch,
  GetToolsResponse,
  BuyToolResponse,
} from "./types"

export function createBaseApi(getAuthHeader: () => string | undefined): ApiInterface {
  return {
    // -------------------------------------------------------------------------
    // USER
    // -------------------------------------------------------------------------
    getUser() {
      return request<User>("/user", {}, getAuthHeader())
    },

    setAvatar(
  name: string,
  avatar_id: string,
  gender: string
) {
  return request<{ avatar: UserAvatar }>(
    "/avatars/setAvatar",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        avatar_id: avatar_id,
        gender,
      }),
    },
    getAuthHeader()
  )
},

 patchProfile(patch: UserProfilePatch) {
      // Cache für getFullGameState invalidieren, damit das neue Profil
      // beim nächsten fetchSessionState frisch vom Server geladen wird
      invalidateCacheFor("/game/state")
      return request(
        "/users/patch-profile",
        {
          method: "POST",
          body: JSON.stringify(patch),
        },
        getAuthHeader()
      )
    },

buyAsset(assetId: number) {
  return request(
    `/inventory/buy/${assetId}`,
    { method: "POST" },
    getAuthHeader()
  )
},

equipItem({ assetId }: { assetId: number }) {
  return request(
    `/inventory/equip/${assetId}`,
    { method: "POST" },
    getAuthHeader()
  )
},

unequipItem({ assetId }: { assetId: number }) {
  return request(
    `/inventory/unequip/${assetId}`,
    { method: "POST" },
    getAuthHeader()
  )
},

getEquippedAssets() {
  return request(
    `/inventory/getEquipped`,
    { method: "GET" },
    getAuthHeader()
  )
},

    // -------------------------------------------------------------------------
    // GAME STATE
    // -------------------------------------------------------------------------
    getFullGameState() {
      return request<GameStateBundle>(
        "/game/state",
        { method: "GET" },
        getAuthHeader()
      )
    },

    addDiamonds(amount: number, reason?: string, relatedId?: number) {
      return request(
        "/game/addDiamonds",
        {
          method: "POST",
          body: JSON.stringify({ amount, reason, related_id: relatedId }),
        },
        getAuthHeader()
      )
    },

    // -------------------------------------------------------------------------
    // PROGRESS
    // -------------------------------------------------------------------------
    getProgress() {
      return request<ProgressResponse | null>(
        "/game/getProgress",
        { method: "GET" },
        getAuthHeader()
      )
    },

    saveInterventionProgress(interventionId: number, xp: number) {
      return request<{ success: boolean }>(
        "/game/saveInterventionProgress",
        {
          method: "POST",
          body: JSON.stringify({ interventionId, xp }),
        },
        getAuthHeader()
      )
    },

    // -------------------------------------------------------------------------
    // LEVEL / XP
    // -------------------------------------------------------------------------
    getCurrentLevel() {
      return request<LevelStatsResponse>(
        "/game/getCurrentLevel",
        { method: "GET" },
        getAuthHeader()
      )
    },

    completeIntervention(interventionId: number) {
      return request(
        "/game/completeIntervention",
        {
          method: "POST",
          body: JSON.stringify({ intervention_id: interventionId }),
        },
        getAuthHeader()
      )
    },

    // -------------------------------------------------------------------------
    // DIAMONDS
    // -------------------------------------------------------------------------
    getDiamonds() {
      return request<DiamondState | null>(
        "/game/getDiamonds",
        { method: "GET" },
        getAuthHeader()
      )
    },

    // -------------------------------------------------------------------------
    // INVENTORY
    // -------------------------------------------------------------------------
    getInventory() {
      return request<InventoryItem[]>(
        "/inventory/get",
        { method: "GET" },
        getAuthHeader()
      )
    },

    // inside createBaseApi(...)
syncAvatarItems(input: SyncAvatarItemsInput) {
  return request<SyncAvatarItemsResponse>(
    "/inventory/syncAvatarItems",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    getAuthHeader()
  )
},
getAvatarStatus() {
  return request<AvatarStatusResponse>(
    "/avatars/status",
    { method: "GET" },
    getAuthHeader()
  )
},

checkAndRender() {
  return request<CheckAndRenderResponse>(
    "/inventory/checkAndRender",
    { method: "POST" },
    getAuthHeader()
  )
},




    saveInventory(data) {
      return request<{ success: boolean }>(
        "/inventory/save",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getAuthHeader()
      )
    },
getUserAvatar() {
  return request<{
    pose: string | undefined
    camera: string | undefined
    emotion: string | undefined
    name: string | undefined
    avatarId: string
  }>(
    "/avatars/get",
    { method: "GET" },
    getAuthHeader()
  )
},

    getUserAssetsByIds(ids: number[]) {
      return request<any[]>(
        "/inventory/userAssetsByIds",
        {
          method: "POST",
          body: JSON.stringify({ ids }),
        },
        getAuthHeader()
      )
    },

    // -------------------------------------------------------------------------
    // TOOLS
    // -------------------------------------------------------------------------
    getTools() {
      return request<GetToolsResponse[]>(
        "/tools/getTools",
        { method: "GET" },
        getAuthHeader()
      )
    },

    buyTool(toolKey: string) {
      return request<BuyToolResponse>(
        "/tools/buyTool",
        {
          method: "POST",
          body: JSON.stringify({ tool_key: toolKey }),
        },
        getAuthHeader()
      )
    },

    markToolSeen(toolKey: string) {
      return request<{ ok: boolean }>(
        "/tools/markSeen",
        {
          method: "POST",
          body: JSON.stringify({ tool_key: toolKey }),
        },
        getAuthHeader()
      )
    },
  }
}
