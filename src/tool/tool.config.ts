import type { ToolConfig, ExportFormat, FeatureFlags } from '@itsjust/core';

export const templateBaseVersion = '1.4.0';

const features: FeatureFlags = {
  export: true,
  autoSave: true,
  undoRedo: true,
  sidebar: true,
  statusBar: true,
  darkMode: true,
};

const toolConfig: ToolConfig = {
  id: 'tool-1795184400',
  name: 'YAML Formatter',
  version: '1.0.0',
  description:
    'Format, validate, and minify YAML documents with syntax highlighting and error locations.',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'] as ExportFormat[],
  features,
};

export default toolConfig;
