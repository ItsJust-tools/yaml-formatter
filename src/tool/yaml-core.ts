import type { Tool, DeserializeResult } from '@itsjust/core';
import yaml from 'js-yaml';
import toolConfig from './tool.config';
import type { IndentSize, SortMode, ToolState } from './types';
import { INDENT_SIZES, SORT_MODES } from './types';

export { SAMPLE_YAML } from './types';

/** Recursively sort object keys alphabetically. depth='top-level' only sorts the root map. */
export function sortKeys(value: unknown, mode: 'top-level' | 'recursive'): unknown {
  if (Array.isArray(value)) {
    if (mode === 'recursive') return value.map((v) => sortKeys(v, mode));
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = mode === 'recursive' ? sortKeys(obj[key], mode) : obj[key];
    }
    return sorted;
  }
  return value;
}

/** Format error message with a YAMLException line/column location when available. */
export function formatYamlError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; mark?: { line?: number; column?: number } };
    const firstLine = typeof e.message === 'string' ? e.message.split('\n')[0] : undefined;
    const message = firstLine ?? 'Invalid YAML';
    const markLine = typeof e.mark?.line === 'number' ? e.mark.line : undefined;
    const markCol = typeof e.mark?.column === 'number' ? e.mark.column : undefined;
    if (markLine !== undefined && markCol !== undefined) {
      // js-yaml marks are 0-based; report human-friendly 1-based positions.
      return `${message} (line ${markLine + 1}, column ${markCol + 1})`;
    }
    return message;
  }
  return 'Invalid YAML';
}

function dumpOptions(indent: IndentSize) {
  return {
    indent,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  };
}

/** Format (pretty/minify) + validate the input YAML. Returns updated state. */
export function formatYaml(state: ToolState): ToolState {
  if (!state.input.trim()) {
    return { ...state, output: '', error: null };
  }
  try {
    let parsed: unknown = yaml.load(state.input);
    if (state.sortMode !== 'none') {
      parsed = sortKeys(parsed, state.sortMode === 'recursive' ? 'recursive' : 'top-level');
    }
    if (state.minify) {
      // Minify: emit compact JSON representation (valid YAML flow style).
      const compact = JSON.stringify(parsed);
      return { ...state, output: compact, error: null };
    }
    const output = yaml.dump(parsed, dumpOptions(state.indent)).replace(/\n$/, '');
    return { ...state, output, error: null };
  } catch (err) {
    return { ...state, output: '', error: formatYamlError(err) };
  }
}

function isIndentSize(v: unknown): v is IndentSize {
  return v === 2 || v === 4 || v === 6;
}

function isSortMode(v: unknown): v is SortMode {
  return typeof v === 'string' && (SORT_MODES as string[]).includes(v);
}

function isTabSize(v: unknown): v is number {
  return v === 2 || v === 4 || v === 8;
}

function isToolState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.input === 'string' &&
    typeof v.output === 'string' &&
    isIndentSize(v.indent) &&
    isSortMode(v.sortMode) &&
    typeof v.minify === 'boolean' &&
    isTabSize(v.tabSize) &&
    (v.error === null || typeof v.error === 'string')
  );
}

export const yamlFormatterTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    input: SAMPLE_YAML_PLACEHOLDER(),
    output: '',
    indent: 2,
    sortMode: 'none',
    minify: false,
    tabSize: 2,
    error: null,
  },
  serialize: (state) => JSON.stringify(state),
  deserialize: (data): DeserializeResult<ToolState> => {
    try {
      if (isToolState(data)) {
        return { success: true, data };
      }
      return { success: false, error: 'Invalid data format: expected valid YAML formatter state' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deserialization error';
      return { success: false, error: `Failed to deserialize state: ${message}` };
    }
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};

function SAMPLE_YAML_PLACEHOLDER(): string {
  return `# Application configuration
name: my-service
version: 1.2.0
debug: false
database:
  host: localhost
  port: 5432
servers:
  - name: web-1
    ip: 10.0.0.1
`;
}

// Back-compat class-based definition used by unit tests.
export class YamlFormatterToolDefinition {
  initialState: ToolState = { ...yamlFormatterTool.initialState };

  serialize(state: ToolState): string {
    return yamlFormatterTool.serialize(state);
  }

  deserialize(serialized: string): DeserializeResult<ToolState> {
    try {
      const parsed: unknown = JSON.parse(serialized);
      return yamlFormatterTool.deserialize(parsed);
    } catch {
      return { success: false, error: 'Invalid data format: expected valid YAML formatter state' };
    }
  }

  format(state: ToolState): ToolState {
    return formatYaml(state);
  }
}

export { INDENT_SIZES, SORT_MODES };
