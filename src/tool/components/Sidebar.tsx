'use client';

import React from 'react';
import type { ToolState } from '../types';
import { INDENT_SIZES, SORT_MODES, TAB_SIZES } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  return (
    <div className="yaml-sidebar p-4 space-y-6 text-sm bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Indentation Spaces
            </label>
            <select
              className="yaml-indent-select w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
              value={state.indent}
              onChange={(e) => onChange({ ...state, indent: Number(e.target.value) as ToolState['indent'] })}
            >
              {INDENT_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} spaces
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort Keys
            </label>
            <select
              className="yaml-sort-select w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
              value={state.sortMode}
              onChange={(e) => onChange({ ...state, sortMode: e.target.value as ToolState['sortMode'] })}
            >
              {SORT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m === 'none' ? 'No sorting' : m === 'top-level' ? 'Top-level only' : 'Recursive'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Editor Tab Size
            </label>
            <select
              className="yaml-tabsize-select w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
              value={state.tabSize}
              onChange={(e) => onChange({ ...state, tabSize: Number(e.target.value) as ToolState['tabSize'] })}
            >
              {TAB_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} spaces
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Document</h3>
        <dl className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <dt>Lines (input)</dt>
            <dd>{state.input ? state.input.split('\n').length : 0}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Characters (input)</dt>
            <dd>{state.input.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Status</dt>
            <dd>{state.error ? 'Invalid' : 'Valid'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
