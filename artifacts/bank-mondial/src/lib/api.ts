export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || "Erreur inattendue");
  }

  return data as T;
}
