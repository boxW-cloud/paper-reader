export interface PaperImage {
  image_id: string;
  image_base64: string;
  width: number;
  height: number;
  ext: string;
  caption?: string;
}

export interface PaperSection {
  name: string;
  content: string;
  summary: string;
  page_numbers?: number[];
  images?: PaperImage[];
}

export interface PaperData {
  title: string;
  abstract: string;
  sections: PaperSection[];
  all_images?: PaperImage[];
}

export interface MindMapNode {
  id: string;
  label: string;
  type: 'root' | 'section';
  data: {
    content?: string;
    summary?: string;
  };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}
