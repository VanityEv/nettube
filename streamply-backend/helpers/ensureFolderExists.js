import fs from 'fs';

export const ensureFolderExists = folderPath => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};
