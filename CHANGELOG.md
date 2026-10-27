# Change Log

All notable changes to the GenesisDB VS Code extension will be documented in this file.

## [2.0.0] - 2026-10-25

Rewritten for GenesisDB 2.0. This release uses the 2.0 routes and is not meant for GenesisDB 1.x servers, keep 1.0.4 for those.

### Changed
- Connection check uses `/api/v2/ping` and reports a GenesisDB 1.x server as such.
- Uses API v2: Stream is now Fetch (`/api/v2/fetch`), Register Schema and Schemas use `/api/v2/schemas`, Erase, Audit and Restore use `/api/v2/admin/...`.
- Commit shows the stored events the server answers with.
- Examples updated to the 2.0 schema subset and a precondition.

### Added
- Audit action.
- Status line with HTTP status, duration and line count.
- Description of each action with its route.
- Confirmation before Erase and Restore.
- Load a backup file into the Restore request, save any answer to a file.
- Validation of the request body before sending.

## [1.0.4] - 2025-12-01

### Changed
- Genesis DB is now GenesisDB

## [1.0.3] - 2025-10-02

### Fixed
- Shows ndjson instead of json in the output

## [1.0.2] - 2025-10-13

### Fixed
- Responsive View optimized

## [1.0.1] - 2025-10-04

### Fixed
- Connection test now properly validates database connectivity using `/api/v1/status/ping` endpoint
- UI no longer opens when database connection fails
- Improved error messages when connection test fails

## [1.0.0] - 2025-10-03

### Added
- Initial release of GenesisDB VS Code Extension
- Complete connection management system with authentication
- Integrations of an API client for testing and developing
- Real-time event streaming
- Visual event commit interface
- Schema management and validation
- Backup restore functionality

### Technical Features
- Built with TypeScript
- VS Code Extension API best practices

### Documentation
- Complete README with usage examples
