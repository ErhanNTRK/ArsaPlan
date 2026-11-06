/**
 * Tek tip çizgi ikon seti (emoji yerine). Renk = currentColor, boyut = 1.1em.
 * Süs amaçlıdır; erişilebilirlik için metin her zaman yanında durur.
 */
import type { ReactNode } from 'react';

export type IcoName =
  | 'save' | 'folder' | 'table' | 'file' | 'ruler' | 'spark' | 'plus'
  | 'globe' | 'image' | 'bank' | 'moon' | 'sun' | 'pointer';

const P: Record<IcoName, ReactNode> = {
  save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v6h8V3" /><rect x="8" y="14" width="8" height="7" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16M15 4v16" /></>,
  file: <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5M9 13h7M9 17h7" /></>,
  ruler: <><path d="M3 17 17 3l4 4L7 21z" /><path d="m7 13 2 2m1-5 2 2m1-5 2 2" /></>,
  spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17v4M17 19h4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  bank: <><path d="M3 10 12 4l9 6z" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></>,
  pointer: <path d="M9 11V5a1.5 1.5 0 0 1 3 0v5l5 1a2 2 0 0 1 1.6 2.3l-.7 5A3 3 0 0 1 14 21h-3a3 3 0 0 1-2.4-1.2L5 15l1.5-1.2L9 15z" />,
};

export function Ico({ n }: { n: IcoName }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {P[n]}
    </svg>
  );
}
