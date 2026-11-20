'use client';

import { useCallback, useMemo } from 'react';
import type { ToolState } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

/** Very small YAML tokenizer for syntax highlighting in the output panel. */
function highlightYaml(code: string): React.ReactNode[] {
  return code.split('\n').map((line, i) => {
    const commentIdx = findCommentStart(line);
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const comment = commentIdx >= 0 ? line.slice(commentIdx) : '';
    return (
      <div key={i} className="yaml-line">
        <span className="yaml-line-number">{i + 1}</span>
        <span className="yaml-line-content">{tokenizeLine(codePart)}</span>
        {comment && <span className="yaml-comment">{comment}</span>}
      </div>
    );
  });
}

function findCommentStart(line: string): number {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1] ?? ''))) {
      return i;
    }
  }
  return -1;
}

function tokenizeLine(line: string): React.ReactNode {
  const match = line.match(/^(\s*)(- )?([^:]*)(:)(.*)$/);
  if (!match) return line || '\u00a0';
  const [, indent, dash, key, colon, rest] = match;
  const restStr = rest ?? '';
  return (
    <>
      {indent}
      {dash && <span className="yaml-dash">{dash}</span>}
      {key && <span className="yaml-key">{key}</span>}
      <span className="yaml-colon">{colon}</span>
      <span className="yaml-value">{highlightScalars(restStr)}</span>
    </>
  );
}

function highlightScalars(rest: string): React.ReactNode {
  const trimmed = rest.trim();
  if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null' || trimmed === '~') {
    return <span className="yaml-bool">{rest}</span>;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed) && trimmed !== '') {
    return <span className="yaml-number">{rest}</span>;
  }
  return rest || '\u00a0';
}

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, canvasRef }) => {
  const handleInput = useCallback(
    (val: string) => {
      onChange({ ...state, input: val });
    },
    [onChange, state]
  );

  const highlighted = useMemo(() => highlightYaml(state.output), [state.output]);
  const editorStyle = useMemo(() => ({ tabSize: state.tabSize }), [state.tabSize]);

  const hasError = Boolean(state.error);

  return (
    <div ref={canvasRef} className="yaml-canvas grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Input (YAML)
          </label>
          <span className="text-xs text-gray-500">{state.input.length} chars</span>
        </div>
        <textarea
          value={state.input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Paste or type YAML here..."
          className="yaml-editor flex-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 font-mono text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          spellCheck={false}
          style={editorStyle}
          aria-label="YAML input"
        />
      </div>

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Output (YAML)
          </label>
          {state.output && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="yaml-copy-btn text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => navigator.clipboard.writeText(state.output)}
              >
                Copy
              </button>
              <button
                type="button"
                className="yaml-download-btn text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => downloadYaml(state.output)}
              >
                Download
              </button>
            </div>
          )}
        </div>
        <div
          className="yaml-output relative flex-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 font-mono text-xs overflow-auto"
          role="application"
          aria-label="Highlighted YAML output"
          style={editorStyle}
        >
          {hasError ? (
            <div
              className="yaml-error bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded"
              role="alert"
            >
              {state.error}
            </div>
          ) : (
            highlighted
          )}
        </div>
      </div>
    </div>
  );
};

export function downloadYaml(output: string): void {
  const blob = new Blob([output], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'formatted.yaml';
  a.click();
  URL.revokeObjectURL(url);
}
