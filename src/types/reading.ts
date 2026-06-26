export interface Citation {
  work: string; // "BPHS"
  ref: string; // "Vol.1, Ch.3, v.14-15"
  tradition: string; // "Parashari"
  text: string; // original-wording gloss, never copyrighted prose
}

export interface ReadingItem {
  title: string;
  body: string;
  tags?: string[];
  citation?: Citation;
  note?: string;
}

export interface ReadingSection {
  id: string;
  heading: string;
  items: ReadingItem[];
}
