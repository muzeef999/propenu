const store = new Map<string, File[]>();

export const setFiles = (key: string, files: File[]) => {
  store.set(key, files.slice());
};

export const getFiles = (key: string) => {
  const arr = store.get(key);
  return arr ? arr.slice() : [];
};

export const clearFiles = (key: string) => {
  store.delete(key);
};

export default { setFiles, getFiles, clearFiles };
