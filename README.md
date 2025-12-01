# GenesisDB VS Code Extension

A comprehensive Visual Studio Code extension for GenesisDB, the production-ready event sourcing database engine. This extension provides a complete development environment for working with GenesisDB, including connection management.

## Features

### Connection Management
- Manage multiple GenesisDB connections
- Token-based authentication
- Connection testing
- Quick connection switching

### Event Explorer UI
- Browse the UI to start
- Commit new Events
- Stream Events
- Query Events with GDBQL
- Erase Events
- Register Schemas
- Get all your Event Schemas
- Get all your Event Subjects
- Get all your Event Types
- Restore a Backup

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "GenesisDB"
4. Click Install

Or install from VSIX:
```bash
code --install-extension genesis-db-vscode-1.0.4.vsix
```

## Quick Start

1. **Add a Connection**
   - Open the GenesisDB panel in the Activity Bar
   - Click "Add Connection" in the Connections view
   - Enter your GenesisDB URL and authentication token

## Manual Configuration

Configure the extension in VS Code settings:

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

The extension provides these commands (accessible via Command Palette):

- `GenesisDB: Add Connection` - Add a new database connection
- `GenesisDB: Test Connection` - Test connection health

## Requirements

- VS Code 1.80.0 or higher
- Running GenesisDB
- Network access to your GenesisDB instance

## License

This extension is licensed under the MIT License.

## Support

For issues, feature requests, or questions:
- Create an issue on our GitHub repository
- Contact support at mail@genesisdb.io
- Visit our documentation at https://docs.genesisdb.io

## Contributing

We welcome contributions! Please see our contributing guidelines and submit pull requests to our GitHub repository.

---

**Enjoy using GenesisDB with VS Code!**
