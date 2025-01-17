// src/types/bookTypes.ts
export type Contributor = {
  role: string;
  name: string;
  when: string;
}

export type License = {
  text: string;
  target: string;
}

export type Metadata = {
  original_title: string;
  author?: string;
  contributors?: Contributor[];
  publisher?: string;
  license?: License;
  publication_date?: string;
  source?: string;
}

export type TextElement = {
  tag: string;
  attributes: Record<string, string>;
  text?: string;
  translated_text?: string;
  children?: TextElement[];
  type?: string;
}

export type BookText = {
  file_title?: string;
  file_title_normal?: string;
  metadata?: Metadata;
  body?: TextElement[];
}