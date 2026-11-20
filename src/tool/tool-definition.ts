import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import type { ToolState } from './types';
import { SAMPLE_YAML } from './types';
import {
  yamlFormatterTool as createTool,
  formatYaml,
  formatYamlError,
  sortKeys,
  YamlFormatterToolDefinition,
} from './yaml-core';

export { formatYaml, formatYamlError, sortKeys, YamlFormatterToolDefinition, SAMPLE_YAML };

const initialState: ToolState = {
  input: SAMPLE_YAML,
  output: '',
  indent: 2,
  sortMode: 'none',
  minify: false,
  tabSize: 2,
  error: null,
};

export const yamlFormatterTool: Tool<ToolState> = {
  ...createTool,
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (data): DeserializeResult<ToolState> => {
    try {
      if (typeof data !== 'object' || data === null) {
        return { success: false, error: 'Invalid data format: expected valid YAML formatter state' };
      }
      const v = data as Record<string, unknown>;
      if (
        typeof v.input === 'string' &&
        typeof v.output === 'string' &&
        typeof v.indent === 'number' &&
        typeof v.sortMode === 'string' &&
        typeof v.minify === 'boolean' &&
        typeof v.tabSize === 'number'
      ) {
        return { success: true, data: data as ToolState };
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

export default yamlFormatterTool;
