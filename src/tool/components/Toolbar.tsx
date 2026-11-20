'use client';

import React from 'react';
import type { ToolState } from '../types';
import { SAMPLE_YAML } from '../types';

interface ToolbarProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
  onFormat: () => void;
  onClear: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ state, onChange, onFormat, onClear }) => {
  return (
    <div className="yaml-toolbar flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onFormat}
          className="yaml-format-btn px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Format
        </button>
        <button
          type="button"
          onClick={onClear}
          className="yaml-clear-btn px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...state,
              input: SAMPLE_YAML,
              output: '',
              error: null,
            })
          }
          className="yaml-sample-btn px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Sample YAML
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...state, minify: false })}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            !state.minify
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Pretty
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...state, minify: true })}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            state.minify
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Minify
        </button>
      </div>
    </div>
  );
};
