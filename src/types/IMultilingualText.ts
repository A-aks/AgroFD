export interface IMultilingualText {
  en: string;
  hi?: string;
  [key: string]: string | undefined; // Allow flexibility for other languages
}
