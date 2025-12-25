export type ElementType =
  | 'text'
  | 'image'
  | 'video'
  | 'sticker'
  | 'button'
  | 'gallery'
  | 'shape'
  | 'long-text';

export interface BoxSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ElementStyles {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  zIndex?: number;
  shadow?: boolean;
}

export interface ScreenElement {
  id: string;
  type: ElementType;
  position: Position; // Percentage 0-100
  size: BoxSize;      // Percentage 0-100 (or approximate for auto)
  content: string;    // Text content or Media ID
  styles: ElementStyles;
  metadata?: Record<string, any>; // Extract stuff like sticker emoji, gallery images list
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'preset';
  value: string; // Color, gradient string, or media ID / preset name
  overlay?: 'confetti' | 'hearts' | 'stars' | 'fireworks' | 'none';
  animation?: 'fade' | 'slide' | 'none';
}

export type ScreenType = 'overlay' | 'content' | 'navigation';

export interface Screen {
  id: string;
  title: string;
  type: ScreenType;
  background: BackgroundConfig;
  elements: ScreenElement[];
  music?: string; // Media ID
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  originalName: string;
  mimeType: string;
  data: string; // Base64 Data URL (or mostly Blob URL during editing, Base64 on export)
  width?: number;
  height?: number;
  duration?: number;
}

export interface GlobalConfig {
  title: string;
  primaryColor: string;
  fontHeading: string;
  fontBody: string;
  globalMusic?: string; // Media ID in MediaLibrary
}

export interface Project {
  version: string;
  id: string;
  templateId: string;
  createdAt: number;
  updatedAt: number;
  config: GlobalConfig;
  screens: Screen[];
  mediaLibrary: Record<string, MediaItem>;
}

export interface Template {
  id: string; // e.g., 'birthday-kids'
  category: string;
  name: string;
  description: string[];
  thumbnail: string; // Path or emoji representation
  screens: number;
  tags: string[];
  defaultConfig: Partial<GlobalConfig>;
  initialProjectData: (projectTitle: string) => Project; // Factory function
}
