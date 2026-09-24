const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replacement 1
content = content.replace(
  `const isNextJs = fsTree && JSON.stringify(fsTree).includes("next.config");
      const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const defaultUrl = isNextJs 
        ? "http://localhost:3000" 
        : (lastPreviewUrlRef.current || (isRemote ? \`http://\${window.location.hostname}:5173\` : "http://localhost:5173"));`,
  `const isNextJs = fsTree && JSON.stringify(fsTree).includes("next.config");
      const isVite = fsTree && JSON.stringify(fsTree).includes("vite.config");
      const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const targetHost = isRemote ? window.location.hostname : 'localhost';
      const defaultUrl = isNextJs 
        ? \`http://\${targetHost}:3000\` 
        : isVite ? \`http://\${targetHost}:5173\` 
        : (lastPreviewUrlRef.current || \`/api/projects/\${activeProject || 'stitch'}/preview/index.html\`);`
);

// Replacement 2
content = content.replace(
  `const isNextJs = fsTree && JSON.stringify(fsTree).includes("next.config");
                    const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
                    const targetHost = isRemote ? window.location.hostname : 'localhost';
                    setPreviewUrl(isNextJs ? \`http://\${targetHost}:3000\` : \`http://\${targetHost}:5173\`);`,
  `const isNextJs = fsTree && JSON.stringify(fsTree).includes("next.config");
                    const isVite = fsTree && JSON.stringify(fsTree).includes("vite.config");
                    const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
                    const targetHost = isRemote ? window.location.hostname : 'localhost';
                    setPreviewUrl(isNextJs ? \`http://\${targetHost}:3000\` : isVite ? \`http://\${targetHost}:5173\` : \`/api/projects/\${activeProject || 'stitch'}/preview/index.html\`);`
);

// Replacement 3
content = content.replace(
  `LIVE PREVIEW ({fsTree && JSON.stringify(fsTree).includes("next.config") ? "LOCALHOST:3000" : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? \`\${window.location.hostname}:5173\` : "LOCALHOST:5173")})`,
  `LIVE PREVIEW ({fsTree && JSON.stringify(fsTree).includes("next.config") ? "3000" : fsTree && JSON.stringify(fsTree).includes("vite.config") ? "5173" : "STATIC HTML API"})`
);

// Replacement 4
content = content.replace(
  `value={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? "http://localhost:3000" : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? \`http://\${window.location.hostname}:5173\` : "http://localhost:5173"))}`,
  `value={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? \`http://\${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000\` : fsTree && JSON.stringify(fsTree).includes("vite.config") ? \`http://\${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5173\` : \`/api/projects/\${activeProject || 'stitch'}/preview/index.html\`)}`
);

// Replacement 5
content = content.replace(
  `src={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? "http://localhost:3000" : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? \`http://\${window.location.hostname}:5173\` : "http://localhost:5173"))}`,
  `src={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? \`http://\${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000\` : fsTree && JSON.stringify(fsTree).includes("vite.config") ? \`http://\${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5173\` : \`/api/projects/\${activeProject || 'stitch'}/preview/index.html\`)}`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
