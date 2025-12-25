
export type PointShape = 'circle' | 'square' | 'diamond' | 'cross';

export interface CategoryStyle {
  color: string;
  shape: PointShape;
  visible: boolean;
}

export interface DataPoint {
  x: number;
  y: number;
  z: number;
  label: string;
  metadata: string;
  color: string;
}

export interface VisualizationState {
  points: DataPoint[];
  categories: string[];
  categoryStyles: Record<string, CategoryStyle>;
  showAxes: boolean;
  isLoading: boolean;
  error: string | null;
}
