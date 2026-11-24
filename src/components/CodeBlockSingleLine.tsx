import {createContext, useContext} from 'react';

/**
 * Shared state between the swizzled <CodeBlock> wrapper and the swizzled
 * <CodeBlock/Buttons>. Used only on the Kubernetes setup page to switch
 * backslash-continued shell commands between multi-line and single-line form.
 */
export type SingleLineState = {
  /** The block contains `\` line continuations and the page is eligible. */
  available: boolean;
  /** Single-line form is currently displayed (and copied). */
  enabled: boolean;
  toggle: () => void;
};

export const SingleLineContext = createContext<SingleLineState | null>(null);

export function useSingleLine(): SingleLineState | null {
  return useContext(SingleLineContext);
}

/**
 * Pages where the extra code block buttons (single-line + always-visible word
 * wrap) are active. Add a pattern here to enable them on another page.
 */
const SINGLE_LINE_PAGES: RegExp[] = [
  /\/setup\/kubernetes\/?$/,
  /\/setup\/mongodb\/ubuntu-mongodb\/?$/,
  /\/setup\/(kaldirma|uninstall)\/?$/,
  /\/setup\/(sorun-giderme|troubleshooting)\/?$/,
  /\/upgrade\/(apinizer-surum-yukseltme|apinizer-version-upgrade)\/?$/,
  /\/upgrade\/(mongodb-surum-yukseltme|mongodb-version-upgrade)\/?$/,
];

export function isSingleLinePage(pathname: string): boolean {
  return SINGLE_LINE_PAGES.some((re) => re.test(pathname));
}

/** True when the code is a shell snippet that uses `\` line continuations. */
export function hasLineContinuation(code: string): boolean {
  if (code.includes('<<')) return false; // heredocs: never touch
  return /\\[ \t]*\r?\n/.test(code);
}

/**
 * Joins `\`-continued lines into one line. Blank lines (separating independent
 * commands) are preserved, so every command stays on its own single line.
 */
export function toSingleLine(code: string): string {
  return code.replace(/[ \t]*\\[ \t]*\r?\n[ \t]*/g, ' ');
}
