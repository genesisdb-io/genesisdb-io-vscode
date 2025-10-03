# Genesis DB VS Code Extension

A comprehensive Visual Studio Code extension for Genesis DB, the production-ready event sourcing database engine. This extension provides a complete development environment for working with Genesis DB, including connection management.

## Features

### Connection Management
- Manage multiple Genesis DB connections
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
3. Search for "Genesis DB"
4. Click Install

Or install from VSIX:
```bash
code --install-extension genesis-db-vscode-1.0.0.vsix
```

## Quick Start

1. **Add a Connection**
   - Open the Genesis DB panel in the Activity Bar
   - Click "Add Connection" in the Connections view
   - Enter your Genesis DB URL and authentication token

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

- `Genesis DB: Add Connection` - Add a new database connection
- `Genesis DB: Test Connection` - Test connection health

## Requirements

- VS Code 1.80.0 or higher
- Running Genesis DB
- Network access to your Genesis DB instance

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

**Enjoy using Genesis DB with VS Code!**
