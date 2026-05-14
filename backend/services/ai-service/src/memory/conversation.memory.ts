const memoryStore = new Map();

export function saveMemory(
  sessionId: string,
  data: any
) {

  const existing =
    memoryStore.get(sessionId) || {};

  memoryStore.set(
    sessionId,
    {
      ...existing,
      ...data,
    }
  );
}

export function getMemory(
  sessionId: string
) {
  return memoryStore.get(sessionId);
}