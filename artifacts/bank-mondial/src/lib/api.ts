export class ApiError extends Error {
  code?: string;
  whatsapp?: string | null;

  constructor(public status: number, message: string, extra?: { code?: string; whatsapp?: string | null }) {
    super(message);
    this.code = extra?.code;
    this.whatsapp = extra?.whatsapp;
  }
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  method: "POST" | "PATCH" | "PUT" = "POST"
): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || "Erreur inattendue", {
      code: data?.code,
      whatsapp: data?.whatsapp,
    });
  }

  return data as T;
}
