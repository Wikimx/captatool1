
export interface ProcessedDocument {
  title: string;
  text: string;
  originalFilename: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  grupo?: string;
  plaza?: string;
  edades?: string;
  nse?: string;
  estado?: string;
  participaciones?: Participacion[];
  wordCount: number;
  characterCount: number;
  creationDate?: string;
  batchId?: number;
  distributionSource?: 'group' | 'title' | 'content' | 'none';
}

export interface Participacion {
  hora?: string;
  participante?: string;
  texto: string;
  categoria?: string;
}

export interface CategoryDefinition {
  nombre: string;
  frasesClave: string[];
}

export interface TimeRange {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  categoryName: string;
}

export interface FileTimeCategories {
  fileName: string;
  timeRanges: TimeRange[];
}

export interface CategoryConfiguration {
  method: 'keywords' | 'time';
  keywordCategories?: CategoryDefinition[];
  timeCategories?: FileTimeCategories[];
}

export interface FileWithContent {
  file: File;
  content: string;
}

export interface GroupPattern {
  prefix: string;
  numbers: number[];
  files: FileWithContent[];
}

export interface GroupDistribution {
  nse: string;
  edades: string;
}
