const memoryStore = new Map();

export function getMemory(sessionId: string) {
  if (
    !memoryStore.has(sessionId)
  ) {
    memoryStore.set(sessionId, {});
  }

  return memoryStore.get(sessionId);
}