const DEFAULT_DELAY_MS = 120;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockResponse<T>(data: T, delayMs: number = DEFAULT_DELAY_MS): Promise<T> {
  await delay(delayMs);
  return JSON.parse(JSON.stringify(data)) as T;
}

export const nowIso = (minutesAgo = 0) => {
  const timestamp = new Date(Date.now() - minutesAgo * 60_000);
  return timestamp.toISOString();
};
