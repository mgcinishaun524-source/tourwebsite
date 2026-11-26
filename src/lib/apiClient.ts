export class ApiError extends Error {
  public readonly status: number;
  public readonly missingVars?: string[];

  constructor(message: string, status: number, missingVars?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.missingVars = missingVars;
  }
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = { error: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      String(parsed.error || `Request failed with status ${response.status}`),
      response.status,
      Array.isArray(parsed.missingVars) ? (parsed.missingVars as string[]) : undefined,
    );
  }

  return parsed as T;
}
