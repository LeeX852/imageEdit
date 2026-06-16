# Game Asset Processor

AI-powered desktop tool for removing backgrounds from game asset images. Built with Electron + React + Python (rembg).

## Features

- **One-click background removal** — AI-powered (U²-Net) automatic background removal
- **Batch processing** — Import and process 100+ images at once
- **Real-time preview** — Side-by-side comparison with adjustable edge parameters
- **Game-ready export** — PNG (transparent), WebP, TGA formats with custom naming templates
- **Edge optimization** — Adjustable threshold and smoothing for clean cutout edges
- **Multiple models** — Switch between U²-Net, ISNet, Silueta for different use cases

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron |
| Frontend | React 19 + TypeScript + TailwindCSS 4 |
| State Management | Zustand |
| Build Tool | Vite 8 |
| Backend | Python + FastAPI |
| AI Engine | rembg (U²-Net) |
| Image Processing | Pillow + OpenCV |

## Project Structure

```
imageEdit/
├── app/                          # Main application
│   ├── electron/                 # Electron main process
│   │   ├── main.js               # Window management, Python lifecycle
│   │   └── preload.js            # IPC bridge
│   ├── src/                      # React frontend
│   │   ├── api/client.ts         # Backend API client
│   │   ├── store/index.ts        # Zustand state management
│   │   ├── components/           # UI components
│   │   │   ├── DropZone.tsx      # Drag-and-drop import
│   │   │   ├── PreviewCanvas.tsx # Zoomable preview with compare
│   │   │   ├── ControlPanel.tsx  # Parameters & export controls
│   │   │   ├── QueuePanel.tsx    # Batch processing queue
│   │   │   ├── Toolbar.tsx       # Top toolbar
│   │   │   └── SettingsPanel.tsx # Settings modal
│   │   ├── types/index.ts        # TypeScript type definitions
│   │   ├── App.tsx               # Main app layout
│   │   └── main.tsx              # Entry point
│   ├── backend/                  # Python backend
│   │   ├── app/
│   │   │   ├── main.py           # FastAPI application
│   │   │   ├── routers/          # API endpoints
│   │   │   ├── services/         # Business logic
│   │   │   └── models/           # Data models
│   │   ├── tests/                # Backend tests
│   │   └── pyproject.toml        # Python dependencies
│   ├── package.json              # Node.js dependencies
│   └── vite.config.ts            # Vite configuration
└── openspec/                     # OpenSpec change management
```

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- **Windows 10/11** (primary target)

## Quick Start

### 1. Install Frontend Dependencies

```bash
cd app
npm install
```

### 2. Install Python Dependencies

```bash
cd app/backend
pip install -e .
```

### 3. Start Development

```bash
cd app
npm run dev          # Start Vite dev server (frontend only)
```

In a separate terminal, start the Python backend:

```bash
cd app/backend
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Run with Electron

```bash
cd app
npm run electron:dev  # Starts both Vite and Electron
```

## Usage

1. **Import images** — Drag and drop images onto the app, or click "Import" (Ctrl+O)
2. **Remove background** — Select an image and click "Remove Background", or "Process All" for batch
3. **Adjust parameters** — Use edge threshold and smoothing sliders to refine results
4. **Compare results** — Switch between Original/Result/Compare views
5. **Export** — Choose format (PNG/WebP/TGA), set naming template, click "Export"

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Import images |
| `Ctrl+S` | Export selected image |
| `Ctrl+Enter` | Process all pending images |
| `Delete` | Remove selected image from queue |

## Building for Production

```bash
cd app
npm run build        # Build frontend
npm run electron:build  # Build Electron app (.exe installer)
```

## API Endpoints (Python Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/remove-background` | Remove background from single image |
| GET | `/api/models` | List available AI models |
| POST | `/api/models/{id}/activate` | Switch active model |
| POST | `/api/batch/remove-background` | Start batch processing |
| GET | `/api/batch/{id}/status` | Get batch progress |
| GET | `/api/batch/{id}/stream` | SSE progress stream |
| POST | `/api/batch/{id}/cancel` | Cancel batch |
| GET | `/api/batch/{id}/result/{task_id}` | Get processed image |

## License

MIT
