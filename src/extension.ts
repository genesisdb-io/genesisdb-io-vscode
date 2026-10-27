import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ConnectionProvider, GenesisDBConnection } from './connectionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('GenesisDB extension is activating...');

    // Initialize connection provider
    const connectionProvider = new ConnectionProvider();

    // Register tree data provider
    vscode.window.createTreeView('genesisdb-connections', {
        treeDataProvider: connectionProvider,
        showCollapseAll: false
    });

    // Register commands
    const commands = [
        // Connection management
        vscode.commands.registerCommand('genesisdb.addConnection', () => addConnection(connectionProvider)),
        vscode.commands.registerCommand('genesisdb.removeConnection', (item) => removeConnection(connectionProvider, item)),
        vscode.commands.registerCommand('genesisdb.testConnection', (connectionOrItem) => testConnection(connectionOrItem)),
        vscode.commands.registerCommand('genesisdb.refreshConnections', () => connectionProvider.refresh()),

        // Database interaction commands
        vscode.commands.registerCommand('genesisdb.openConnectionUI', (connection) => openConnectionUI(connection, context)),
    ];

    context.subscriptions.push(...commands);

    // Watch for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('genesisdb.connections')) {
            connectionProvider.refresh();
        }
    });

    console.log('GenesisDB extension activated successfully');
}

async function addConnection(connectionProvider: ConnectionProvider) {
    try {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter connection name',
            placeHolder: 'My GenesisDB'
        });

        if (!name) return;

        const url = await vscode.window.showInputBox({
            prompt: 'Enter GenesisDB URL',
            placeHolder: 'http://localhost:8080'
        });

        if (!url) return;

        const authToken = await vscode.window.showInputBox({
            prompt: 'Enter authentication token',
            placeHolder: 'your-auth-token',
            password: true
        });

        if (!authToken) return;

        // Save to VS Code settings
        const config = vscode.workspace.getConfiguration('genesisdb');
        const connections = config.get<GenesisDBConnection[]>('connections', []);

        // Check if connection with same name already exists
        if (connections.some(c => c.name === name)) {
            vscode.window.showErrorMessage(`Connection with name '${name}' already exists`);
            return;
        }

        connections.push({ name, url, authToken });
        await config.update('connections', connections, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`Connection '${name}' added successfully!`);
        connectionProvider.refresh();

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to add connection: ${error}`);
    }
}

async function removeConnection(connectionProvider: ConnectionProvider, item: any) {
    if (!item || !item.connection) {
        vscode.window.showErrorMessage('No connection selected');
        return;
    }

    const connection = item.connection;
    const confirm = await vscode.window.showWarningMessage(
        `Remove connection '${connection.name}'?`,
        'Yes', 'No'
    );

    if (confirm === 'Yes') {
        try {
            const config = vscode.workspace.getConfiguration('genesisdb');
            const connections = config.get<GenesisDBConnection[]>('connections', []);

            const filteredConnections = connections.filter(c => c.name !== connection.name);
            await config.update('connections', filteredConnections, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage(`Connection '${connection.name}' removed`);
            connectionProvider.refresh();

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove connection: ${error}`);
        }
    }
}

async function testConnection(connectionOrItem: any): Promise<boolean> {
    let connection: GenesisDBConnection;

    if (connectionOrItem?.connection) {
        connection = connectionOrItem.connection;
    } else if (connectionOrItem?.name && connectionOrItem?.url) {
        connection = connectionOrItem;
    } else {
        vscode.window.showErrorMessage('No connection provided');
        return false;
    }

    try {
        vscode.window.showInformationMessage(`Testing connection to ${connection.name}...`);

        // Validate URL format first
        let url: URL;
        try {
            url = new URL(connection.url);
        } catch {
            vscode.window.showErrorMessage(`Invalid URL format in connection '${connection.name}'`);
            return false;
        }

        // Actually test the connection by making a request to the ping endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
            // /api/v2/ping only exists on GenesisDB 2, so it also detects a 1.x server.
            const pingUrl = `${connection.url.replace(/\/+$/, '')}/api/v2/ping`;
            const response = await fetch(pingUrl, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                vscode.window.showInformationMessage(`Connection '${connection.name}' is reachable!`);
                return true;
            } else if (response.status === 404) {
                vscode.window.showErrorMessage(`Connection '${connection.name}' is not a GenesisDB 2 server. Use extension version 1.0.4 for GenesisDB 1.x.`);
                return false;
            } else {
                vscode.window.showErrorMessage(`Connection '${connection.name}' returned status ${response.status}`);
                return false;
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                vscode.window.showErrorMessage(`Connection '${connection.name}' timed out`);
            } else {
                vscode.window.showErrorMessage(`Cannot reach '${connection.name}': ${error.message}`);
            }
            return false;
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Connection test failed: ${error}`);
        return false;
    }
}

async function openConnectionUI(connection: GenesisDBConnection, context: vscode.ExtensionContext) {
    if (!connection) {
        vscode.window.showErrorMessage('No connection provided');
        return;
    }

    // Test connection before opening UI
    const isConnected = await testConnection(connection);
    if (!isConnected) {
        vscode.window.showErrorMessage(`Cannot open UI: Connection to '${connection.name}' failed. Please check if the database is running and accessible.`);
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'genesisdb-ui',
        `GenesisDB - ${connection.name}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'genesisdb-io-ui', 'dist'))
            ]
        }
    );

    // Load the React UI
    const distPath = path.join(context.extensionPath, 'genesisdb-io-ui', 'dist');
    const htmlContent = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');

    // Convert local resource paths to webview URIs
    const baseUri = panel.webview.asWebviewUri(vscode.Uri.file(distPath));

    // Replace asset paths with webview URIs
    let modifiedHtml = htmlContent
        .replace(/src="\/assets\//g, `src="${baseUri}/assets/`)
        .replace(/href="\/assets\//g, `href="${baseUri}/assets/`)
        .replace(/href="\/vite\.svg"/g, `href="${baseUri}/vite.svg"`);

    // Inject connection data and vscode API
    modifiedHtml = modifiedHtml.replace(
        '<script type="module"',
        `<script>
            window.genesisConnection = ${JSON.stringify({
            name: connection.name,
            host: connection.url,
            authToken: connection.authToken
        })};
            window.vscode = acquireVsCodeApi();
        </script>
        <script type="module"`
    );

    panel.webview.html = modifiedHtml;

    // The webview talks to GenesisDB directly. The host only confirms destructive actions, loads backup files and saves output.
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message?.command === 'confirm') {
            const choice = await vscode.window.showWarningMessage(String(message.message), { modal: true }, 'Continue');
            panel.webview.postMessage({ command: 'confirmed', id: message.id, ok: choice === 'Continue' });
        } else if (message?.command === 'loadFile') {
            const picked = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { JSON: ['json', 'ndjson'] }, openLabel: 'Load backup' });
            if (picked?.[0]) {
                const content = Buffer.from(await vscode.workspace.fs.readFile(picked[0])).toString('utf8');
                panel.webview.postMessage({ command: 'fileLoaded', content });
            }
        } else if (message?.command === 'saveOutput') {
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const target = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(os.homedir(), `genesisdb-${message.name}-${stamp}.json`)),
                filters: { JSON: ['json', 'ndjson'] },
            });
            if (target) {
                await vscode.workspace.fs.writeFile(target, Buffer.from(String(message.content), 'utf8'));
                vscode.window.showInformationMessage(`Saved to ${target.fsPath}`);
            }
        }
    });
}

export function deactivate() { }
