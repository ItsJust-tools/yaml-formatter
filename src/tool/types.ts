export type SortMode = 'none' | 'top-level' | 'recursive';
export type IndentSize = 2 | 4 | 6;

export interface ToolState {
  /** Raw YAML text entered by the user. */
  input: string;
  /** Formatted/minified YAML produced from the input. */
  output: string;
  /** Indentation size for pretty-printed output. */
  indent: IndentSize;
  /** Whether object keys are sorted alphabetically, and how deep. */
  sortMode: SortMode;
  /** Whether to minify the output instead of pretty-printing. */
  minify: boolean;
  /** Editor display tab size in spaces (visual only). */
  tabSize: number;
  /** Validation/formatting error including line/column, or null. */
  error: string | null;
}

export const INDENT_SIZES: IndentSize[] = [2, 4, 6];
export const TAB_SIZES = [2, 4, 8];
export const SORT_MODES: SortMode[] = ['none', 'top-level', 'recursive'];

export const SAMPLE_YAML = `# Application configuration
name: my-service
version: 1.2.0
debug: false
database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret
servers:
  - name: web-1
    ip: 10.0.0.1
  - name: web-2
    ip: 10.0.0.2
tags:
  zeta: 1
  alpha: 2
  middle: 3
`;
