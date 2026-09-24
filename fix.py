import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'const isNextJs = fsTree && JSON\.stringify\(fsTree\)\.includes\(" next\.config\\);\s+const isRemote = typeof window !== \'undefined\' && window\.location\.hostname !== \'localhost\' && window\.location\.hostname !== \'127\.0\.0\.1\';\s+const defaultUrl = isNextJs\s+\? \http://localhost:3000\\s+: \(lastPreviewUrlRef\.current \|\| \(isRemote \? http://\$\{window\.location\.hostname\}:5173 : \http://localhost:5173\\)\);',
 'const isNextJs = fsTree && JSON.stringify(fsTree).includes(\next.config\);\n const isVite = fsTree && JSON.stringify(fsTree).includes(\vite.config\);\n const isRemote = typeof window !== \'undefined\' && window.location.hostname !== \'localhost\' && window.location.hostname !== \'127.0.0.1\';\n const targetHost = isRemote ? window.location.hostname : \'localhost\';\n const defaultUrl = isNextJs \n ? http://:3000 \n : isVite ? http://:5173\n : (lastPreviewUrlRef.current || /api/projects//preview/index.html);',
 content
)

content = re.sub(
 r'const isNextJs = fsTree && JSON\.stringify\(fsTree\)\.includes\(\next\.config\\);\s+const isRemote = typeof window !== \'undefined\' && window\.location\.hostname !== \'localhost\' && window\.location\.hostname !== \'127\.0\.0\.1\';\s+const targetHost = isRemote \? window\.location\.hostname : \'localhost\';\s+setPreviewUrl\(isNextJs \? http://\$\{targetHost\}:3000 : http://\$\{targetHost\}:5173\);',
 'const isNextJs = fsTree && JSON.stringify(fsTree).includes(\next.config\);\n const isVite = fsTree && JSON.stringify(fsTree).includes(\vite.config\);\n const isRemote = typeof window !== \'undefined\' && window.location.hostname !== \'localhost\' && window.location.hostname !== \'127.0.0.1\';\n const targetHost = isRemote ? window.location.hostname : \'localhost\';\n setPreviewUrl(isNextJs ? http://:3000 : isVite ? http://:5173 : /api/projects//preview/index.html);',
 content
)

content = re.sub(
 r'LIVE PREVIEW \(\{fsTree && JSON\.stringify\(fsTree\)\.includes\(\next\.config\\) \? \LOCALHOST:3000\ : \(typeof window !== \'undefined\' && window\.location\.hostname !== \'localhost\' && window\.location\.hostname !== \'127\.0\.0\.1\' \? \$\{window\.location\.hostname\}:5173 : \LOCALHOST:5173\\)\}\)',
 'LIVE PREVIEW ({fsTree && JSON.stringify(fsTree).includes(\next.config\) ? \3000\ : fsTree && JSON.stringify(fsTree).includes(\vite.config\) ? \5173\ : \STATIC HTML API\})',
 content
)

content = re.sub(
 r'value=\{previewUrl \|\| \(fsTree && JSON\.stringify\(fsTree\)\.includes\(\next\.config\\) \? \http://localhost:3000\ : \(typeof window !== \'undefined\' && window\.location\.hostname !== \'localhost\' && window\.location\.hostname !== \'127\.0\.0\.1\' \? http://\$\{window\.location\.hostname\}:5173 : \http://localhost:5173\\)\)\}',
 'value={previewUrl || (fsTree && JSON.stringify(fsTree).includes(\next.config\) ? http://:3000 : fsTree && JSON.stringify(fsTree).includes(\vite.config\) ? http://:5173 : /api/projects//preview/index.html)}',
 content
)

content = re.sub(
 r'src=\{previewUrl \|\| \(fsTree && JSON\.stringify\(fsTree\)\.includes\(\next\.config\\) \? \http://localhost:3000\ : \(typeof window !== \'undefined\' && window\.location\.hostname !== \'localhost\' && window\.location\.hostname !== \'127\.0\.0\.1\' \? http://\$\{window\.location\.hostname\}:5173 : \http://localhost:5173\\)\)\}',
 'src={previewUrl || (fsTree && JSON.stringify(fsTree).includes(\next.config\) ? http://:3000 : fsTree && JSON.stringify(fsTree).includes(\vite.config\) ? http://:5173 : /api/projects//preview/index.html)}',
 content
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
 f.write(content)
