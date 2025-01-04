export interface GedcomRecord {
  xref?: string;
  tag: string;
  abstag: string;
  value?: string;
  children: GedcomRecord[];
}
