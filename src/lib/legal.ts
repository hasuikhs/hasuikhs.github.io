// The legal documents' versions and routes, read from src/content/legal: legal.json lists the versions (newest,
// the one in force, first), documents.json is their text rendered at build time by scripts/legal-docs.js.
// The helpers mirror that script's, so the page and the served HTML (copy-routes.js) agree.
import DOCUMENTS from '../content/legal/documents.json';
import LEGAL from '../content/legal/legal.json';

export type LegalDocKey = keyof typeof LEGAL.documents;

type LegalContent = { title: string; blocks: string[] };

export type LegalVersion = {
  date: string;
  // '2026년 11월 20일 시행 (현행)', the version link's text.
  label: string;
  path: string;
  current: boolean;
};

export type LegalDoc = {
  key: LegalDocKey;
  name: string;
  path: string;
  versions: LegalVersion[];
};

const CONTENT: Record<LegalDocKey, Record<string, LegalContent>> = DOCUMENTS;

export const LEGAL_APP = LEGAL.app;
export const LEGAL_LABELS = LEGAL.labels;

// '2026-11-20' -> '2026년 11월 20일'.
export const formatDate = (iso: string) => {
  const [ year, month, day ] = iso.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
};

// '{name} 보기' with { name: '이용약관' } -> '이용약관 보기'. A placeholder with no value stays as written.
export const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);

export function legalDoc(key: LegalDocKey): LegalDoc {
  const doc = LEGAL.documents[key];
  const [ newest ] = doc.versions;
  return {
    key,
    name: doc.name,
    path: doc.path,
    versions: doc.versions.map((date) => {
      const current = date === newest;
      const label = fill(LEGAL.labels.effective, { date: formatDate(date) });
      return {
        date,
        label: current ? fill(LEGAL.labels.current, { label }) : label,
        path: current ? doc.path : `${doc.path}${date}/`,
        current,
      };
    }),
  };
}

export const LEGAL_DOC_KEYS = Object.keys(LEGAL.documents) as LegalDocKey[];

export const legalContent = (key: LegalDocKey, date: string): LegalContent | undefined => CONTENT[key][date];
