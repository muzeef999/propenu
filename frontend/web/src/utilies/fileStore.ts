const fileStore = new Map<string, File[]>();

export const setFileStoreFiles = (key: string, files: File[]) => {
  fileStore.set(key, files);
};

export const getFileStoreFiles = (key: string): File[] | undefined => {
  return fileStore.get(key);
};

export const clearFileStore = (key: string) => {
  fileStore.delete(key);
};