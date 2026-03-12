# Zephyr - Vector-based canvas design tool

![CleanShot 2025-12-18 at 23 38 13@2x_result](https://github.com/user-attachments/assets/4e7c3849-bc9e-48a9-bf99-8da2f6ae269c)

A starter design tool interface built with Next.js 15, React 19, and Tailwind CSS 4.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
src/
├── app/
│   ├── (app)/                    # Main application (with toolbars)
│   │   ├── layout.tsx            # App shell with sidebars
│   │   ├── page.tsx              # Canvas page
│   │   └── settings/             # Settings pages
│   │       ├── layout.tsx        # Settings sidebar
│   │       ├── page.tsx          # Redirects to profile
│   │       ├── profile/
│   │       ├── appearance/
│   │       ├── notifications/
│   │       └── account/
│   ├── (auth)/                   # Authentication (no toolbars)
│   │   ├── layout.tsx            # Centered card layout
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── globals.css               # Theme & global styles
│   └── layout.tsx                # Root layout
├── components/
│   ├── canvas/
│   │   ├── infinite-canvas.tsx   # Main canvas with pan/zoom
│   │   ├── canvas-element-renderer.tsx
│   │   ├── command-menu.tsx      # ⌘K menu
│   │   ├── drag-palette.tsx      # Draggable element palette
│   │   └── polish-components.tsx # Context menu, shortcuts, toasts
│   ├── toolbars/
│   │   ├── top-toolbar.tsx
│   │   ├── left-sidebar.tsx
│   │   └── bottom-toolbar.tsx
│   └── shared/
│       ├── toolbar-button.tsx
│       ├── auth-card.tsx
│       ├── form-input.tsx
│       ├── settings-section.tsx
│       └── toggle-switch.tsx
├── hooks/
│   └── use-canvas-store.tsx      # Canvas state management
└── lib/
    └── utils.ts                  # cn() helper
```

## ⌨️ Keyboard Shortcuts

### Tools

| Key | Action      |
| --- | ----------- |
| `V` | Select tool |
| `H` | Hand tool   |
| `R` | Rectangle   |
| `O` | Ellipse     |
| `T` | Text        |
| `F` | Frame       |

### Canvas

| Shortcut       | Action            |
| -------------- | ----------------- |
| `Space + Drag` | Pan canvas        |
| `Scroll`       | Zoom in/out       |
| `⌘ +`          | Zoom in           |
| `⌘ -`          | Zoom out          |
| `⌘ 0`          | Reset view (100%) |

### Selection & Editing

| Shortcut             | Action                  |
| -------------------- | ----------------------- |
| `Click`              | Select element          |
| `Shift + Click`      | Add to selection        |
| `Escape`             | Deselect all            |
| `Delete / Backspace` | Delete selected         |
| `⌘ K`                | Open command menu       |
| `?`                  | Show keyboard shortcuts |

## 🎨 Theme System

The app uses CSS custom properties defined in `globals.css`:

```css
@theme {
  --color-surface0: #0a0a0b; /* Darkest background */
  --color-surface1: #141416; /* Panels, sidebars */
  --color-surface2: #1e1e21; /* Hover states */
  --color-surface3: #28282c; /* Active states */

  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-muted: #52525b;

  --color-accent: #3b82f6; /* Blue accent */
}
```

## 🔧 Key Patterns

### 1. Viewport Layout (No Scroll)

```tsx
<div className='h-screen flex flex-col overflow-hidden'>
  <header style={{ height: 'var(--toolbar-height)' }} />
  <div className='flex-1 flex min-h-0'>
    {' '}
    {/* min-h-0 is critical! */}
    <aside style={{ width: 'var(--sidebar-width)' }} />
    <main className='flex-1 min-w-0 overflow-hidden' />
  </div>
  <footer style={{ height: 'var(--statusbar-height)' }} />
</div>
```

### 2. Canvas Coordinate Systems

```typescript
// Screen → Canvas
canvasX = (screenX - panX) / zoom;
canvasY = (screenY - panY) / zoom;

// Canvas → Screen
screenX = canvasX * zoom + panX;
screenY = canvasY * zoom + panY;
```

### 3. Zoom to Cursor

```typescript
// Keep point under cursor stationary while zooming
const canvasX = (mouseX - panX) / oldZoom;
const canvasY = (mouseY - panY) / oldZoom;
const newPanX = mouseX - canvasX * newZoom;
const newPanY = mouseY - canvasY * newZoom;
```

### 4. Drag with Start Positions

```typescript
// On drag start: store original positions
const startPositions = new Map();
elements.forEach((el) =>
  startPositions.set(el.id, { x: el.x, y: el.y }),
);

// On drag move: calculate from start, not current
const delta = (mouseX - startX) / zoom;
startPositions.forEach((start, id) => {
  updateElement(id, { x: start.x + delta });
});
```

### 5. Route Groups for Different Layouts

```
app/
├── (app)/          # Uses app layout with toolbars
│   └── layout.tsx
├── (auth)/         # Uses auth layout (centered cards)
│   └── layout.tsx
```

### 6. Hydration-Safe Client Positioning

```typescript
const [position, setPosition] = useState({ x: 0, y: 0 });
const hasInitialized = useRef(false);

useEffect(() => {
  if (!hasInitialized.current) {
    setPosition({ x: window.innerWidth - 200, y: 60 });
    hasInitialized.current = true;
  }
}, []);
```

## 📚 Tutorial Modules

1. **Project Setup** - Next.js, Tailwind CSS 4, folder structure
2. **Layout Fundamentals** - CSS variables, viewport layouts
3. **Application Shell** - Three-region layout, min-h-0 trick
4. **Top Toolbar** - Tool buttons, keyboard shortcuts
5. **Left Sidebar** - Tabs, layers panel, collapsible
6. **Bottom Toolbar** - Zoom controls, view toggles
7. **Authentication Pages** - Login, signup, forgot password
8. **Settings Pages** - Nested layouts, profile, appearance
9. **Infinite Canvas Basics** - Grid, coordinate systems, pan
10. **Canvas Pan & Zoom** - Wheel zoom, keyboard shortcuts
11. **Canvas Elements** - Selection, movement, deletion
12. **Command Menu** - ⌘K palette for adding elements
13. **Drag & Drop** - Draggable palette, drop zones
14. **Polish & Integration** - Context menu, shortcuts panel, toasts

## 🛠️ Technologies

- **Next.js 15** - App Router, Server Components
- **React 19** - Hooks, Context API
- **Tailwind CSS 4** - @theme directive, utility classes
- **TypeScript** - Full type safety
- **Lucide React** - Icon library

## 📝 License

MIT - Feel free to use this as a starting point for your own projects!
