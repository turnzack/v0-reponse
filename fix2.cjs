const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');

text = text.replace(
  'LIVE PREVIEW ({fsTree && JSON.stringify(fsTree).includes("next.config") ? "LOCALHOST:3000" : (typeof window !== \\'undefined\\' && window.location.hostname !== \\'localhost\\' && window.location.hostname !== \\'127.0.0.1\\' ? `\\${window.location.hostname}:5173` : "LOCALHOST:5173")})',
  'LIVE PREVIEW ({fsTree && JSON.stringify(fsTree).includes("next.config") ? "3000" : fsTree && JSON.stringify(fsTree).includes("vite.config") ? "5173" : "STATIC HTML API"})'
);

text = text.replace(
  'value={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? "http://localhost:3000" : (typeof window !== \\'undefined\\' && window.location.hostname !== \\'localhost\\' && window.location.hostname !== \\'127.0.0.1\\' ? `http://\\${window.location.hostname}:5173` : "http://localhost:5173"))}',
  'value={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? `http://\\${typeof window !== \\'undefined\\' ? window.location.hostname : \\'localhost\\'}:3000` : fsTree && JSON.stringify(fsTree).includes("vite.config") ? `http://\\${typeof window !== \\'undefined\\' ? window.location.hostname : \\'localhost\\'}:5173` : `/api/projects/\\${activeProject || \\'stitch\\'}/preview/index.html`)}'
);

text = text.replace(
  'src={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? "http://localhost:3000" : (typeof window !== \\'undefined\\' && window.location.hostname !== \\'localhost\\' && window.location.hostname !== \\'127.0.0.1\\' ? `http://\\${window.location.hostname}:5173` : "http://localhost:5173"))}',
  'src={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? `http://\\${typeof window !== \\'undefined\\' ? window.location.hostname : \\'localhost\\'}:3000` : fsTree && JSON.stringify(fsTree).includes("vite.config") ? `http://\\${typeof window !== \\'undefined\\' ? window.location.hostname : \\'localhost\\'}:5173` : `/api/projects/\\${activeProject || \\'stitch\\'}/preview/index.html`)}'
);

fs.writeFileSync('src/App.tsx', text, 'utf8');
