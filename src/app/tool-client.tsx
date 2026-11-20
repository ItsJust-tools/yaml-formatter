'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { ToolShell, useTool, ImportExport } from '@itsjust/core';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import {
  toolConfig,
  templateBaseVersion,
  yamlFormatterTool,
  formatYaml,
  Canvas,
  Toolbar,
  Sidebar,
} from '@/tool';
import type { ToolState } from '@/tool';

export default function ToolClient() {
  const ToolShellCompat = ToolShell as unknown as ComponentType<Record<string, unknown>> & {
    Toolbar?: ComponentType<{ children?: ReactNode }>;
    Body?: ComponentType<{ children?: ReactNode }>;
    Sidebar?: ComponentType<{ children?: ReactNode }>;
    Canvas?: ComponentType<{ children?: ReactNode }>;
    StatusBar?: ComponentType<{ children?: ReactNode }>;
  };
  const canvasRef = useRef<HTMLDivElement>(null);
  const tool = useTool<ToolState>(yamlFormatterTool, canvasRef);
  const setToolData = tool.state.setData;
  const showToast = tool.toast;
  const [isSharing, setIsSharing] = useState(false);
  const hasLoadedSharedState = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth > 768 && toolConfig.features.sidebar
  );

  const title = toolConfig.name;

  useEffect(() => {
    document.title = title;
  }, [title]);

  const applyFormat = useCallback(
    (updater: (state: ToolState) => ToolState) => {
      setToolData((prev) => formatYaml(updater(prev)));
    },
    [setToolData]
  );

  const handleStateChange = useCallback(
    (next: ToolState) => {
      setToolData(() => formatYaml(next));
    },
    [setToolData]
  );

  const handleFormat = useCallback(() => {
    setToolData((prev) => formatYaml(prev));
  }, [setToolData]);

  const handleClear = useCallback(() => {
    setToolData((prev) => ({ ...prev, input: '', output: '', error: null }));
  }, [setToolData]);

  useEffect(() => {
    if (hasLoadedSharedState.current) return;
    hasLoadedSharedState.current = true;
    const params = new URLSearchParams(window.location.search);
    const encodedState = params.get('state');
    if (!encodedState) return;
    try {
      const serialized = decompressFromEncodedURIComponent(encodedState);
      if (!serialized) throw new Error('Invalid shared URL');
      const parsed: unknown = JSON.parse(serialized);
      const deserialized = yamlFormatterTool.deserialize(parsed);
      if (!deserialized.success) throw new Error(deserialized.error);
      setToolData(deserialized.data);
      showToast('Loaded state from shared URL', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load shared URL';
      showToast(message, 'error');
    }
  }, [setToolData, showToast]);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      const serialized = yamlFormatterTool.serialize(tool.state.data);
      const encodedState = compressToEncodedURIComponent(serialized);
      if (!encodedState) throw new Error('Failed to encode state for URL');
      const url = new URL(window.location.href);
      url.searchParams.set('state', encodedState);
      url.searchParams.set('tool', toolConfig.id);
      window.history.replaceState(null, '', url.toString());

      const shareUrl = url.toString();
      if (navigator.share) {
        try {
          await navigator.share({ title, url: shareUrl });
          showToast('Shared URL ready', 'success');
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share URL copied to clipboard', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create share URL';
      showToast(message, 'error');
    } finally {
      setIsSharing(false);
    }
  }, [showToast, tool.state.data, title]);

  const toolbarContent = (
    <>
      <Toolbar state={tool.state.data} onChange={handleStateChange} onFormat={handleFormat} onClear={handleClear} />
      <ImportExport
        formats={tool.supportedFormats}
        onExport={tool.handleExport}
        onImport={tool.importFromFile}
        isImporting={tool.isImporting}
        onShare={handleShare}
        isSharing={isSharing}
      />
    </>
  );

  const sidebarContent = <Sidebar state={tool.state.data} onChange={handleStateChange} />;

  const canvasContent = (
    <Canvas canvasRef={canvasRef} state={tool.state.data} onChange={handleStateChange} />
  );

  const statusBarContent = (
    <>
      <span className="status-slot status-slot-state">
        {tool.state.data.error ? 'Invalid YAML' : 'Valid YAML'}
      </span>
      <span className="status-slot status-slot-indent">{tool.state.data.indent} spaces</span>
      <span className="status-slot status-slot-tool-version">Tool v{toolConfig.version}</span>
      <span className="status-slot status-slot-template-version">
        Template v{templateBaseVersion}
      </span>
    </>
  );

  const hasLegacySections = Boolean(
    ToolShellCompat.Toolbar &&
    ToolShellCompat.Body &&
    ToolShellCompat.Sidebar &&
    ToolShellCompat.Canvas &&
    ToolShellCompat.StatusBar
  );

  return (
    <ToolShellCompat
      config={toolConfig}
      actions={useMemo(() => tool.toolbarActions, [tool.toolbarActions])}
      sidebarOpen={sidebarOpen}
      onSidebarChange={setSidebarOpen}
      toolbar={toolbarContent}
      sidebar={sidebarContent}
      canvas={canvasContent}
      statusBar={statusBarContent}
    >
      {hasLegacySections
        ? (() => {
            const ToolbarSection = ToolShellCompat.Toolbar as ComponentType<{
              children?: ReactNode;
            }>;
            const BodySection = ToolShellCompat.Body as ComponentType<{ children?: ReactNode }>;
            const SidebarSection = ToolShellCompat.Sidebar as ComponentType<{
              children?: ReactNode;
            }>;
            const CanvasSection = ToolShellCompat.Canvas as ComponentType<{ children?: ReactNode }>;
            const StatusBarSection = ToolShellCompat.StatusBar as ComponentType<{
              children?: ReactNode;
            }>;
            return (
              <>
                <ToolbarSection>{toolbarContent}</ToolbarSection>
                <BodySection>
                  <SidebarSection>{sidebarContent}</SidebarSection>
                  <CanvasSection>{canvasContent}</CanvasSection>
                </BodySection>
                <StatusBarSection>{statusBarContent}</StatusBarSection>
              </>
            );
          })()
        : null}
    </ToolShellCompat>
  );
}
