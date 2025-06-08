const fs = require('fs');
const path = require('path');

let totalLines = 0;

function isTextFile(filePath) {
  const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.html', '.css', '.scss', '.yml', '.yaml'];
  return textExtensions.includes(path.extname(filePath).toLowerCase());
}

function countLinesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (e) {
    console.warn(`Не удалось прочитать файл ${filePath}:`, e.message);
    return 0;
  }
}

function walkDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath); // рекурсивный обход
    } else if (entry.isFile() && isTextFile(fullPath)) {
      const lines = countLinesInFile(fullPath);
      console.log(`Файл: ${fullPath} — ${lines} строк`);
      totalLines += lines;
    }
  }
}

const rootDir = path.resolve(__dirname, 'apps');

if (!fs.existsSync(rootDir)) {
  console.error('Папка apps не найдена');
  process.exit(1);
}

walkDir(rootDir);
console.log(`\nОбщее количество строк кода: ${totalLines}`);