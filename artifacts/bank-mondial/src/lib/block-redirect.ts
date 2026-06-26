export type BlockType = "retrait" | "virement" | "operation";

export interface BlockStatus {
  blocked: boolean;
  reason: string;
  whatsapp: string;
}

export async function fetchBlockStatus(): Promise<BlockStatus> {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/wallet/block-status", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return { blocked: false, reason: "", whatsapp: "" };
    return await res.json();
  } catch {
    return { blocked: false, reason: "", whatsapp: "" };
  }
}

export function redirectToBlockPage(type: BlockType, reason: string, whatsapp?: string | null) {
  const params = new URLSearchParams({ type, reason: reason || "" });
  if (whatsapp) params.set("whatsapp", whatsapp);
  window.location.href = `/erreur-bloquage?${params.toString()}`;
}
