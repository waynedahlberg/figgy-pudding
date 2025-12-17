# CanvasForge Quick Reference

## Layout Patterns

```tsx
// Full viewport, no scroll
<div className="h-screen overflow-hidden flex flex-col">
  <header className="shrink-0" style={{ height: 48 }} />
  <main className="flex-1 min-h-0" />  // min-h-0 prevents overflow!
</div>

// Horizontal split with sidebar
<div className="flex-1 flex min-h-0">
  <aside className="shrink-0 w-64" />
  <main className="flex-1 min-w-0" />  // min-w-0 prevents overflow!
</div>
```

## Canvas Math

```typescript
// Screen to Canvas coordinates
const canvasX = (screenX - rect.left - panX) / zoom;
const canvasY = (screenY - rect.top - panY) / zoom;

// Canvas to Screen coordinates
const screenX = canvasX * zoom + panX + rect.left;
const screenY = canvasY * zoom + panY + rect.top;

// Zoom toward cursor (keep point stationary)
const canvasX = (mouseX - panX) / oldZoom;
const canvasY = (mouseY - panY) / oldZoom;
const newPanX = mouseX - canvasX * newZoom;
const newPanY = mouseY - canvasY * newZoom;

// Move elements (drag delta in canvas units)
const canvasDelta = pixelDelta / zoom;
newPosition = startPosition + canvasDelta;
```

## State Patterns

```typescript
// Drag state with start positions
interface DragState {
  isDragging: boolean;
  startX: number;           // Mouse position at drag start
  startY: number;
  startPanX: number;        // Pan position at drag start
  startPanY: number;
  elementStartPositions: Map<string, { x: number; y: number }>;
}

// On mouse down
setDragState({
  isDragging: true,
  startX: e.clientX,
  startY: e.clientY,
  startPanX: panX,
  startPanY: panY,
  elementStartPositions: /* store current positions */,
});

// On mouse move
const deltaX = e.clientX - dragState.startX;
const deltaY = e.clientY - dragState.startY;
// Always calculate from START position, not current!
newPan = dragState.startPanX + deltaX;
```

## Hydration-Safe Client Code

```typescript
// Pattern 1: Don't render until mounted
const [isMounted, setIsMounted] = useState(false);
useEffect(() => {
  setIsMounted(true);
}, []);
if (!isMounted) return null;

// Pattern 2: Update position after mount
const [position, setPosition] = useState({ x: 0, y: 0 });
const hasInitialized = useRef(false);
useEffect(() => {
  if (!hasInitialized.current) {
    setPosition({ x: window.innerWidth - 200, y: 60 });
    hasInitialized.current = true;
  }
}, []);
```

## Keyboard Shortcuts

```typescript
useEffect(
  () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (e.target instanceof HTMLInputElement) return;

      // Modifier + key
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandMenu();
      }

      // Single key (no modifiers)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'v') setTool('select');
        if (e.key === 'Delete') deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  },
  [
    /* dependencies */
  ]
);
```

## HTML5 Drag & Drop

```typescript
// Drag source
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
  }}
  onDragEnd={() => setIsDragging(false)}
/>

// Drop target
<div
  onDragOver={(e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }}
  onDrop={(e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    // Handle drop...
  }}
/>
```

## Tailwind CSS 4 Theme

```css
/* globals.css */
@import 'tailwindcss';

@theme {
  /* Colors go here - creates utilities like bg-surface0 */
  --color-surface0: #0a0a0b;
  --color-accent: #3b82f6;
}

:root {
  /* Non-color values go here */
  --toolbar-height: 48px;
  --sidebar-width: 280px;
}
```

## Component Patterns

```tsx
// Toolbar button with tooltip
<button
  onClick={onClick}
  title={`${label} (${shortcut})`}
  className={cn(
    "p-2 rounded transition-colors",
    isActive ? "bg-accent text-white" : "hover:bg-surface2"
  )}
>
  {icon}
</button>

// Toggle switch (accessible)
<button
  role="switch"
  aria-checked={checked}
  onClick={() => setChecked(!checked)}
  className={cn(
    "w-10 h-6 rounded-full transition-colors",
    checked ? "bg-accent" : "bg-surface3"
  )}
>
  <span className={cn(
    "block w-4 h-4 rounded-full bg-white transition-transform",
    checked ? "translate-x-5" : "translate-x-1"
  )} />
</button>

// Selection box with handles
{isSelected && (
  <div className="absolute inset-0 border-2 border-accent pointer-events-none">
    {['nw','n','ne','e','se','s','sw','w'].map(pos => (
      <div
        key={pos}
        className="absolute w-2 h-2 bg-white border-2 border-accent"
        style={{ /* position based on pos */ }}
      />
    ))}
  </div>
)}
```

## File Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated routes with app shell
│   │   ├── layout.tsx  # Toolbars + sidebar
│   │   └── page.tsx    # Canvas
│   ├── (auth)/         # Unauthenticated routes
│   │   └── layout.tsx  # Centered card
│   └── globals.css     # Theme
├── components/
│   ├── canvas/         # Canvas-specific
│   ├── toolbars/       # App shell parts
│   └── shared/         # Reusable UI
├── hooks/              # State management
└── lib/utils.ts        # cn() helper
```
