// types/index.ts

// User types

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

// Canvas element types
export interface CanvasElement {
  id: string;
  type: 'rectangle' | 'ellipse' | 'text' | 'image' | 'frame';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  content?: string; // for text elements
  src?: string; // for image elements
  locked: boolean;
  visible: boolean;
  name: string;
}

// Canvas state
export interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  panX: number;
  panY: number;
}

// Tool types
export type ToolType =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'image'
  | 'pen'
  | 'eraser';

// Layer representation (for sidebar)
export interface Layer {
  id: string;
  name: string;
  type: CanvasElement['type'];
  visible: boolean;
  locked: boolean;
}
