# GenesisDB for VS Code

Explore [GenesisDB](https://www.genesisdb.io), the open source event sourcing database, without leaving the editor. Manage connections, commit and fetch events, run GDBQL queries, register schemas, erase reference payloads and restore backups.

> **Version 2.0.0 targets GenesisDB 2.0.** It uses the 2.0 routes (`/ping`, `/api/v1/fetch`, `/api/v1/schemas`, `/api/v1/restore` and others). For a GenesisDB 1.x server keep extension version 1.0.4.
>
> Extension 1.0.4 keeps working against a GenesisDB 2.0 server through deprecated route aliases, so you can upgrade the server first and the extension later. Audit needs this 2.0.0 extension.

## Features

### Connections

- Several connections side by side in the GenesisDB activity bar view
- Bearer token authentication
- Connection check against `/ping` before the explorer opens

### Explorer

Every action has an editable example request and shows the HTTP status, duration and line count of the answer. NDJSON answers are pretty-printed line by line.

| Action | Route | |
|---|---|---|
| Commit | `POST /api/v1/commit` | Commit events with optional preconditions, answers with the stored events |
| Fetch | `POST /api/v1/fetch` | Events of a subject and its descendants, with optional bounds |
| Query | `POST /api/v1/query` | Run a GDBQL query |
| Subjects | `GET /api/v1/subjects` | Distinct top level subjects |
| Types | `GET /api/v1/types` | Distinct event types |
| Register Schema | `POST /api/v1/schemas` | Register a schema for an event type |
| Schemas | `GET /api/v1/schemas` | Every registered schema |
| Erase | `POST /api/v1/erase` | Erase the reference payloads below a subject |
| Status | `GET /api/v1/status` | Engine, system, event counts and storage readiness |
| Audit | `GET /api/v1/status/audit` | Verify the hash chain |
| Restore | `POST /api/v1/restore` | Restore a backup file into an empty store, "Load file" reads it from disk |

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
