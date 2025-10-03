import * as vscode from 'vscode';

export interface GenesisDBConnection {
    name: string;
    url: string;
    authToken: string;
}

export class ConnectionProvider implements vscode.TreeDataProvider<ConnectionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConnectionItem | undefined | null | void> = new vscode.EventEmitter<ConnectionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConnectionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ConnectionItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConnectionItem): ConnectionItem[] {
        if (!element) {
            const connections = this.getConnections();
            return connections.map(connection => new ConnectionItem(connection));
        }
        return [];
    }

    private getConnections(): GenesisDBConnection[] {
        const config = vscode.workspace.getConfiguration('genesisdb');
        return config.get<GenesisDBConnection[]>('connections', []);
    }
}

export class ConnectionItem extends vscode.TreeItem {
    constructor(public readonly connection: GenesisDBConnection) {
        super(connection.name, vscode.TreeItemCollapsibleState.None);

        this.tooltip = `${connection.name} - ${connection.url}`;
        this.description = connection.url;
        this.contextValue = 'connection';

        this.iconPath = new vscode.ThemeIcon('database');

        // Add command to open UI when clicked
        this.command = {
            command: 'genesisdb.openConnectionUI',
            title: 'Open Genesis DB Interface',
            arguments: [connection]
        };
    }
}