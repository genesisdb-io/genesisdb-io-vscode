# GenesisDB for VS Code

Explore [GenesisDB](https://www.genesisdb.io), the open source event sourcing database, without leaving the editor. Manage connections, commit and fetch events, run GDBQL queries, register schemas, erase reference payloads and restore backups.

> **Version 2.0.0 targets GenesisDB 2.0.** It uses API v2 of GenesisDB 2.0 (`/api/v2/...`). For a GenesisDB 1.x server keep extension version 1.0.4.
>
> Extension 1.0.4 keeps working against a GenesisDB 2.0 server, which still serves the unchanged 1.x API under `/api/v1`, so you can upgrade the server first and the extension later. Audit needs this 2.0.0 extension.

## Features

### Connections

- Several connections side by side in the GenesisDB activity bar view
- Bearer token authentication
- Connection check against `/api/v2/ping` before the explorer opens, a GenesisDB 1.x server is reported as such

### Explorer

Every action has an editable example request and shows the HTTP status, duration and line count of the answer. NDJSON answers are pretty-printed line by line.

| Action | Route | |
|---|---|---|
| Commit | `POST /api/v2/commit` | Commit events with optional preconditions, answers with the stored events |
| Fetch | `POST /api/v2/fetch` | Events of a subject and its descendants, with optional bounds |
| Query | `POST /api/v2/query` | Run a GDBQL query |
| Subjects | `GET /api/v2/subjects` | Distinct top level subjects |
| Types | `GET /api/v2/types` | Distinct event types |
| Register Schema | `POST /api/v2/schemas` | Register a schema for an event type |
| Schemas | `GET /api/v2/schemas` | Every registered schema |
| Erase | `POST /api/v2/admin/erase` | Erase the reference payloads below a subject |
| Status | `GET /api/v2/status` | Engine, system, event counts and storage readiness |
| Audit | `GET /api/v2/admin/audit` | Verify the hash chain |
| Restore | `POST /api/v2/admin/restore` | Restore a backup file into an empty store, "Load file" reads it from disk |

Erase and Restore ask for confirmation before they are sent. Erase, Restore, Register Schema and Audit need the administrator token. Any answer can be saved to a file with "Save output".

## Installation

Search for "GenesisDB" in the Extensions view, or install a downloaded package:

```bash
code --install-extension genesisdb-vscode-2.0.0.vsix
```

## Quick start

1. Open the GenesisDB view in the activity bar.
2. Click "Add Connection" and enter a name, the server URL (for example `http://localhost:8080`) and a token.
3. Click the connection to open the explorer.

Connections are stored in the user settings:

```json
{
  "genesisdb.connections": [
    {
      "name": "Local Development",
      "url": "http://localhost:8080",
      "authToken": "your-auth-token"
    }
  ]
}
```

## Commands

- `GenesisDB: Add Connection`
- `GenesisDB: Refresh Connections`
- Test Connection and Remove Connection are inline actions on each connection.

## Requirements

- VS Code 1.80 or newer
- A reachable GenesisDB 2.0 server

## Development

```bash
npm install
npm run build      # builds the webview (genesisdb-io-ui) and compiles the extension
npm run package    # creates genesisdb-vscode-2.0.0.vsix
```

## License

MIT

## Support

- Issues: https://github.com/genesisdb-io/genesisdb-io-vscode/issues
- E-Mail: mail@genesisdb.io
- Docs: https://docs.genesisdb.io
