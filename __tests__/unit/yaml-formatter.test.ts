import { describe, it, expect } from 'vitest';
import {
  YamlFormatterToolDefinition,
  formatYaml,
  sortKeys,
  formatYamlError,
} from '../../src/tool/yaml-core';
import type { ToolState } from '../../src/tool/types';

function makeState(overrides: Partial<ToolState> = {}): ToolState {
  return {
    input: '',
    output: '',
    indent: 2,
    sortMode: 'none',
    minify: false,
    tabSize: 2,
    error: null,
    ...overrides,
  };
}

describe('formatYaml pretty-printing', () => {
  it('uses the selected indentation size for nested documents', () => {
    const state = makeState({ input: 'root:\n  child:\n    leaf: 1', indent: 4 });
    const res = formatYaml(state);
    expect(res.error).toBeNull();
    expect(res.output).toBe('root:\n    child:\n        leaf: 1');
  });

  it('supports 6-space indentation', () => {
    const res = formatYaml(makeState({ input: 'a:\n  b: 1', indent: 6 }));
    expect(res.output).toMatch(/^ {6}b: 1$/m);
  });

  it('preserves scalar values when formatting', () => {
    const res = formatYaml(makeState({ input: 'num: 42\nbool: true\nstr: hello world' }));
    expect(res.output).toContain('num: 42');
    expect(res.output).toContain('bool: true');
    expect(res.output).toContain('str: hello world');
  });

  it('returns empty output for empty input', () => {
    const res = formatYaml(makeState({ input: '   \n  ' }));
    expect(res.output).toBe('');
    expect(res.error).toBeNull();
  });
});

describe('formatYaml validation', () => {
  it('reports error with correct line for invalid YAML', () => {
    const res = formatYaml(
      makeState({ input: 'good: 1\nbad: [unclosed' })
    );
    expect(res.error).not.toBeNull();
    // js-yaml reports at stream end (line 3); must mention a line number.
    expect(res.error).toMatch(/line \d+/i);
  });

  it('reports the offending line for a duplicate anchor error', () => {
    const res = formatYaml(makeState({ input: 'a: &x 1\nb: *missing' }));
    expect(res.error).not.toBeNull();
    expect(res.error).toMatch(/line 2/i);
  });

  it('reports a syntax error for malformed flow sequence', () => {
    const res = formatYaml(makeState({ input: 'a: {x: 1' }));
    expect(res.error).not.toBeNull();
    expect(res.error).toMatch(/line \d+/i);
  });

  it('clears error when input becomes valid', () => {
    const broken = formatYaml(makeState({ input: 'a: [oops' }));
    expect(broken.error).not.toBeNull();
    const fixed = formatYaml({ ...broken, input: 'a: 1' });
    expect(fixed.error).toBeNull();
    expect(fixed.output).toContain('a: 1');
  });
});

describe('key sorting', () => {
  it('sorts nested maps recursively', () => {
    const res = sortKeys(
      { z: 1, a: { z: 2, a: 3 }, m: [{ c: 1, b: 2 }] },
      'recursive'
    );
    expect(Object.keys(res as object)).toEqual(['a', 'm', 'z']);
    const nested = (res as Record<string, unknown>).a as object;
    expect(Object.keys(nested)).toEqual(['a', 'z']);
    const listItem = ((res as Record<string, unknown>).m as Array<object>)[0];
    expect(listItem).toBeDefined();
    expect(Object.keys(listItem as object)).toEqual(['b', 'c']);
  });

  it('top-level sorting leaves nested keys untouched', () => {
    const res = sortKeys({ z: { b: 1, a: 2 } }, 'top-level');
    expect(Object.keys(res as object)).toEqual(['z']);
    const nested = (res as Record<string, unknown>).z as object;
    expect(Object.keys(nested)).toEqual(['b', 'a']);
  });

  it('end-to-end: sorted recursive output is alphabetical', () => {
    const res = formatYaml(
      makeState({ input: 'zebra: 1\napple:\n  mango: 1\n  banana: 2\ncherry: 3', sortMode: 'recursive' })
    );
    expect(res.error).toBeNull();
    const keys = res.output.split('\n').filter((l) => !l.startsWith(' ')).map((l) => l.replace(/:.*/, ''));
    expect(keys).toEqual(['apple', 'cherry', 'zebra']);
    expect(res.output).toMatch(/^ {2}banana:/m);
  });

  it('sorts arrays of maps recursively', () => {
    const res = formatYaml(
      makeState({
        input: 'items:\n  - delta: 4\n    charlie: 3\n    bravo: 2\n    alpha: 1',
        sortMode: 'recursive',
      })
    );
    expect(res.output).toMatch(/- alpha: 1|alpha: 1/);
    expect(res.output.indexOf('alpha')).toBeLessThan(res.output.indexOf('bravo'));
    expect(res.output.indexOf('bravo')).toBeLessThan(res.output.indexOf('charlie'));
  });
});

describe('minification', () => {
  it('collapses whitespace while preserving scalar values', () => {
    const res = formatYaml(
      makeState({
        input: 'name:   test\nlist:\n  - one\n  - two\nnested:\n  key: value',
        minify: true,
      })
    );
    expect(res.error).toBeNull();
    expect(res.output).not.toContain('\n ');
    const parsed = JSON.parse(res.output);
    expect(parsed).toEqual({ name: 'test', list: ['one', 'two'], nested: { key: 'value' } });
  });

  it('keeps numeric and boolean scalars intact', () => {
    const res = formatYaml(makeState({ input: 'n: 5\nok: true', minify: true }));
    expect(res.output).toBe('{"n":5,"ok":true}');
  });

  it('returns empty output for empty input when minifying', () => {
    const res = formatYaml(makeState({ input: '', minify: true }));
    expect(res.output).toBe('');
  });
});

describe('serialize/deserialize round-trip', () => {
  const def = new YamlFormatterToolDefinition();

  it('round-trips full state unchanged', () => {
    const state = makeState({
      input: 'a: 1',
      output: 'a: 1',
      indent: 6,
      sortMode: 'recursive',
      minify: true,
      tabSize: 8,
      error: 'boom (line 1, column 1)',
    });
    const json = def.serialize(state);
    const result = def.deserialize(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(state);
    }
  });

  it('round-trips default state unchanged', () => {
    const result = def.deserialize(def.serialize(def.initialState));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(def.initialState);
  });

  it('rejects invalid serialized payloads', () => {
    expect(def.deserialize('not json').success).toBe(false);
    expect(def.deserialize(JSON.stringify({ input: 123 })).success).toBe(false);
    expect(def.deserialize('null').success).toBe(false);
  });

  it('rejects state with wrong enum values', () => {
    const bad = JSON.stringify({ ...makeState(), indent: 3, sortMode: 'weird' });
    expect(def.deserialize(bad).success).toBe(false);
  });

  it('deserializing valid partial-ish state keeps extra fields out safely', () => {
    const ok = JSON.stringify({ ...makeState({ input: 'x: 1' }), extra: 'field' });
    const result = def.deserialize(ok);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.input).toBe('x: 1');
  });
});

describe('formatYamlError', () => {
  it('formats js-yaml mark positions as 1-based', () => {
    const msg = formatYamlError({ mark: { line: 0, column: 4 }, message: 'bad thing' });
    expect(msg).toBe('bad thing (line 1, column 5)');
  });

  it('falls back to the raw message for non-object errors', () => {
    expect(formatYamlError(new Error('oops'))).toContain('oops');
  });
});
