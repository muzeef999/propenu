import fs from "fs";

export const cleanupFiles = (files: string[]) => {
  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Deleted: ${file}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${file}`, error);
    }
  }
};