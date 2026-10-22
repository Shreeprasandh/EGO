const { app, BrowserWindow, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

app.name = 'EGO';

// Apple Silicon Metal & GPU optimization flags (must be before app.whenReady)
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let server;

// Mime types dictionary
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.hdr': 'application/octet-stream',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

// Start a local loopback server to serve the build flawlessly with zero CORS or file:// protocol bugs
function startLocalServer(distPath) {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';

      // First try distPath
      let filePath = path.join(distPath, reqPath);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, '../dist', reqPath);
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        });
        res.end(data);
      });
    });

    server.on('error', (err) => {
      console.error('Local server error:', err);
      reject(err);
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Local server listening on http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

async function createWindow() {
  const distDir = path.join(__dirname, '../dist');
  let port;
  try {
    port = await startLocalServer(distDir);
  } catch (e) {
    console.error('Failed to start loopback server:', e);
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "EGO — Cursed Born Studio",
    icon: path.join(__dirname, '../dist/favicon.png'),
    backgroundColor: '#000000',
    fullscreenable: true,
    autoHideMenuBar: true,
    show: false, // Show once ready-to-show to prevent white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Maintain 120Hz physics uninterrupted
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Load from the local high-speed loopback server, or fallback to file://
  if (port) {
    mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  } else {
    mainWindow.loadFile(path.join(distDir, 'index.html'));
  }

  // Fullscreen shortcut
  globalShortcut.register('CommandOrControl+F', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) {
      try { server.close(); } catch (_) {}
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Set macOS Dock Icon dynamically to the centered EGO emblem (without text)
  if (process.platform === 'darwin' && app.dock) {
    try {
      const dockIconPath = path.join(__dirname, '../dist/favicon.png');
      if (fs.existsSync(dockIconPath)) {
        const img = nativeImage.createFromPath(dockIconPath);
        if (!img.isEmpty()) {
          app.dock.setIcon(img);
        }
      }
    } catch (err) {
      console.warn('Dock icon setup warning:', err);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (server) {
    try { server.close(); } catch (_) {}
  }
});
