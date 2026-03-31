import { useState, useCallback } from "react";

export function useCreatePermanentAvatar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CREATE ANONYMOUS RPM USER
  const createUserToken = async () => {
    const res = await fetch(
      `https://${import.meta.env.VITE_RPM_APP_SUBDOMAIN}.readyplayer.me/api/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { applicationId: import.meta.env.VITE_RPM_APP_ID },
        }),
      }
    );
    const json = await res.json();
    return json.data.token as string;
  };

  // CREATE DRAFT
  const createDraft = async (token: string, templateId: string) => {
    const res = await fetch(
      `https://api.readyplayer.me/v2/avatars/templates/${templateId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            partner: import.meta.env.VITE_RPM_APP_SUBDOMAIN,
            bodyType: "fullbody",
          },
        }),
      }
    );
    const json = await res.json();
    return json.data.id as string;
  };

  // MAKE PERMANENT
  const makePermanent = async (token: string, draftId: string) => {
    const res = await fetch(
      `https://api.readyplayer.me/v2/avatars/${draftId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
        },
      }
    );
    const json = await res.json();
    return json.data.id as string;
  };

  // MAIN FUNCTION
  const createPermanentAvatar = useCallback(
    async (templateId: string): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = await createUserToken();
        const draftId = await createDraft(token, templateId);
        const avatarId = await makePermanent(token, draftId);
        return avatarId;
      } catch (err: any) {
        setError("Fehler beim Erstellen des Avatars");
        console.error("RPM Avatar Error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createPermanentAvatar, loading, error };
}
