import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import Editor from '@monaco-editor/react';
import { actions, type Action } from "./actions";
import { Logo } from "./Logo";

type Connection = { host: string; authToken: string; name: string };

type VsCodeApi = { postMessage(message: unknown): void };

declare global {
  interface Window {
    genesisConnection?: Connection;
    vscode?: VsCodeApi;
  }
}

type Result = { status: number; statusText: string; millis: number; lines?: number } | { error: string } | null;

/** Pretty-prints NDJSON line by line, a single JSON document as a whole, anything else as text. */
function formatBody(text: string): { text: string; lines?: number } {
  const trimmed = text.trim();
  if (!trimmed) return { text: '// Empty response' };
  try {
    return { text: JSON.stringify(JSON.parse(trimmed), null, 2) };
  } catch {
    // not a single document
  }
  const lines = trimmed.split('\n').filter((line) => line.trim());
  try {
    return { text: lines.map((line) => JSON.stringify(JSON.parse(line), null, 2)).join('\n'), lines: lines.length };
  } catch {
    return { text };
  }
}

function App() {
  const connection: Connection = window.genesisConnection ?? { host: 'http://localhost:8080', authToken: '', name: 'Local Development' };
  const host = connection.host.replace(/\/+$/, '');

  const [selected, setSelected] = useState<Action>(actions.find((a) => a.id === 'fetch')!);
  const [input, setInput] = useState<string>(selected.body ?? '');
  const [output, setOutput] = useState<string>('');
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [topHeight, setTopHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1024);
  const [saved, setSaved] = useState<Record<string, { input: string; output: string; result: Result }>>({});

  useEffect(() => {
    const onResize = () => setIsWideScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('black-theme', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#000000' } });
    setThemeReady(true);
  };

  const headers = (withBody: boolean) => {
    const h = new Headers({ Authorization: `Bearer ${connection.authToken}` });
    if (withBody) h.set('Content-Type', 'application/json');
    return h;
  };

  const validateBody = (): string | undefined | false => {
    if (selected.body === undefined) return undefined;
    try {
      JSON.parse(input);
      return input;
    } catch (e) {
      setResult({ error: `Request body is not valid JSON: ${(e as Error).message}` });
      return false;
    }
  };

  const send = async () => {
    const body = validateBody();
    if (body === false) return;
    if (selected.destructive) {
      const ok = await confirmWithHost(`${selected.label} on '${connection.name}'? This changes data on the server.`);
      if (!ok) return;
    }

    setLoading(true);
    setOutput('');
    setResult(null);
    const started = performance.now();
    try {
      const response = await fetch(`${host}${selected.path}`, { method: selected.method, headers: headers(body !== undefined), body });
      const formatted = formatBody(await response.text());
      setOutput(formatted.text);
      setResult({ status: response.status, statusText: response.statusText, millis: Math.round(performance.now() - started), lines: formatted.lines });
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const select = (action: Action) => {
    if (loading) return;
    setSaved((previous) => ({ ...previous, [selected.id]: { input, output, result } }));
    const restored = saved[action.id];
    setInput(restored?.input ?? action.body ?? '');
    setOutput(restored?.output ?? '');
    setResult(restored?.result ?? null);
    setSelected(action);
  };

  const resetBody = () => setInput(selected.body ?? '');

  const saveOutput = () => window.vscode?.postMessage({ command: 'saveOutput', name: selected.id, content: output });

  const loadFile = () => window.vscode?.postMessage({ command: 'loadFile' });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.command === 'fileLoaded' && typeof event.data.content === 'string') setInput(event.data.content);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (isWideScreen) {
      const width = ((e.clientX - rect.left) / rect.width) * 100;
      if (width > 20 && width < 80) setLeftWidth(width);
    } else {
      const height = ((e.clientY - rect.top) / rect.height) * 100;
      if (height > 20 && height < 80) setTopHeight(height);
    }
  };

  const hasBody = selected.body !== undefined;

  return (
    <div className="dark flex flex-col h-screen bg-background text-foreground">
      <div className="border-b p-4 flex flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-sm text-muted-foreground text-end">
          Connected to <span className="text-foreground">{connection.name}</span> ({host})
        </p>
      </div>

      <div className="flex flex-row items-center gap-4 p-4 border-b">
        <div className="flex flex-row gap-1 overflow-x-auto flex-1 scrollbar-thin py-1">
          {actions.map((action) => (
            <Button
              key={action.id}
              onClick={() => select(action)}
              disabled={loading}
              variant={selected.id === action.id ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
            >
              {action.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-row gap-1 flex-shrink-0">
          <Button onClick={send} disabled={loading} size="sm" variant={selected.destructive ? 'destructive' : 'default'}>
            {loading ? 'Sending' : 'Send'}
          </Button>
        </div>
      </div>

      <div className="flex flex-row items-center justify-between gap-4 px-4 py-2 border-b text-xs">
        <p className="text-muted-foreground">
          <span className="font-mono text-foreground">{selected.method} {selected.path}</span>
          <span className="ml-3">{selected.hint}</span>
        </p>
        <div className="flex flex-row items-center gap-3 flex-shrink-0">
          {result && 'status' in result && (
            <span className={result.status >= 200 && result.status < 300 ? 'text-primary' : 'text-destructive'}>
              {result.status} {result.statusText} in {result.millis} ms{result.lines !== undefined ? `, ${result.lines} ${result.lines === 1 ? 'line' : 'lines'}` : ''}
            </span>
          )}
          {result && 'error' in result && <span className="text-destructive">{result.error}</span>}
          {selected.id === 'restore' && window.vscode && <button className="underline text-muted-foreground hover:text-foreground" onClick={loadFile} disabled={loading}>Load file</button>}
          {hasBody && <button className="underline text-muted-foreground hover:text-foreground" onClick={resetBody} disabled={loading}>Reset body</button>}
          {output && window.vscode && <button className="underline text-muted-foreground hover:text-foreground" onClick={saveOutput}>Save output</button>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative" onMouseMove={onMouseMove} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
        <div className="flex flex-col lg:border-r" style={{ width: isWideScreen ? `${leftWidth}%` : '100%', height: isWideScreen ? '100%' : `${topHeight}%` }}>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={hasBody ? input : '// This action has no request body'}
              onChange={(value) => hasBody && setInput(value ?? '')}
              theme={themeReady ? 'black-theme' : 'vs-dark'}
              beforeMount={handleEditorWillMount}
              options={{ readOnly: !hasBody || loading, minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true }}
            />
          </div>
        </div>

        <div
          className={isWideScreen ? 'w-[2px] bg-border hover:bg-primary cursor-col-resize transition-colors flex-shrink-0' : 'h-[3px] bg-border hover:bg-primary cursor-row-resize transition-colors flex-shrink-0'}
          onMouseDown={() => setIsDragging(true)}
          style={{ pointerEvents: 'auto', zIndex: 10 }}
        />

        <div className="flex flex-col" style={{ width: isWideScreen ? `${100 - leftWidth}%` : '100%', height: isWideScreen ? '100%' : `${100 - topHeight}%` }}>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={output}
              theme={themeReady ? 'black-theme' : 'vs-dark'}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, wordWrap: 'on' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Asks the extension host for a modal confirmation. Falls back to window.confirm outside VS Code. */
function confirmWithHost(message: string): Promise<boolean> {
  if (!window.vscode) return Promise.resolve(window.confirm(message));
  const id = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    const listener = (event: MessageEvent) => {
      if (event.data?.command === 'confirmed' && event.data.id === id) {
        window.removeEventListener('message', listener);
        resolve(Boolean(event.data.ok));
      }
    };
    window.addEventListener('message', listener);
    window.vscode!.postMessage({ command: 'confirm', id, message });
  });
}

export default App
