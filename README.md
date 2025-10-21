# Seam MCP Server

A Model Context Protocol (MCP) server for controlling smart locks via the Seam API.

## Features

This MCP server provides comprehensive tools for managing smart locks and access codes:

### Lock Control
- `get_status` - **NEW!** Get a comprehensive overview of all locks with battery levels, connectivity, and issues
- `list_locks` - List all smart locks connected to your Seam account
- `get_lock` - Get detailed information about a specific lock
- `lock_door` - Lock a specific door
- `unlock_door` - Unlock a specific door
- `get_lock_status` - Get the current lock status with battery level and online status

### Access Code Management
- `create_access_code` - Create an access code on a single lock with optional time limits
- `create_access_code_on_multiple_locks` - Create the same code on multiple locks (with location filtering)
- `list_access_codes` - List all access codes, optionally filtered by device
- `update_access_code` - Update an existing access code
- `delete_access_code` - Delete an access code

## Prerequisites

1. A Seam account - Sign up at [https://console.seam.co/](https://console.seam.co/)
2. A Seam API key - Generate one from your Seam console
3. At least one smart lock connected to your Seam account

## Installation

### Using with Smithery

1. Install via Smithery:
```bash
npx @smithery/cli install seam-mcp
```

2. Configure your Seam API key when prompted

### Manual Installation (for development)

1. Clone this repository:
```bash
git clone https://github.com/yourusername/seam-mcp.git
cd seam-mcp
```

2. Install dependencies:
```bash
npm install
```

The build will run automatically after installation.

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

If installed via npm:
```json
{
  "mcpServers": {
    "seam": {
      "command": "node",
      "args": ["/path/to/seam-mcp/.smithery/stdio/index.cjs"],
      "env": {
        "SEAM_API_KEY": "your-seam-api-key-here"
      }
    }
  }
}
```

Or using npx (after publishing):
```json
{
  "mcpServers": {
    "seam": {
      "command": "npx",
      "args": ["-y", "seam-mcp"],
      "env": {
        "SEAM_API_KEY": "your-seam-api-key-here"
      }
    }
  }
}
```

### With Smithery

After installation via Smithery, configure your API key in the Smithery dashboard. The server will be automatically available to Claude and other MCP clients.

## Development

Run the development server with live reload:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Build for both stdio and HTTP transports:

```bash
npm run build:all
```

## Example Usage

Once configured, you can ask Claude to:

### Lock Control
- "Show me the status of all my locks" (comprehensive overview)
- "List all my smart locks"
- "Unlock the front door"
- "What's the status of my garage lock?"
- "Lock the back door"
- "Which locks need new batteries?"

### Access Code Management
- "Create an access code 1234 named 'Guest Code' on all my locks in Seattle"
- "Create a temporary access code for my cleaner from January 1st to January 15th"
- "List all access codes on my front door"
- "Delete the access code named 'Old Guest Code'"
- "Create access code 5678 named 'Airbnb Guest' that works from next Monday at 3pm to next Friday at 11am"

## Configuration

The server requires a Seam API key. Get yours from the [Seam Console](https://console.seam.co/).

When using with Smithery, the API key is securely stored and managed through the Smithery platform.

## Supported Lock Brands

Seam supports 100+ smart lock brands including:
- August
- Yale
- Schlage
- Kwikset
- Baldwin
- Lockly
- Tedee
- And many more...

Check the [Seam Device Catalog](https://www.seam.co/supported-devices) for the complete list.

## API Reference

### Lock Control Tools

#### get_status()
**NEW!** Get a comprehensive status dashboard of all your locks. Returns:
- Lock states summary (how many locked/unlocked, percentage)
- Connectivity status (online/offline locks)
- Battery level analysis (low/medium battery warnings)
- Error and warning detection
- Quick visual summary with emojis

Perfect for: "Show me the status of all my locks" or "Do I have any issues with my locks?"

#### list_locks()
Returns all locks in your Seam account with basic information including name, manufacturer, model, lock status, battery level, and online status.

#### get_lock(device_id)
Gets detailed information about a specific lock including capabilities, errors, warnings, and location.

#### lock_door(device_id)
Locks the specified door and returns the action attempt details.

#### unlock_door(device_id)
Unlocks the specified door and returns the action attempt details.

#### get_lock_status(device_id)
Gets the current lock/unlock status along with battery level and online status.

### Access Code Management Tools

#### create_access_code(device_id, name, code?, starts_at?, ends_at?)
Creates an access code on a single lock. The `code` parameter is optional (random code generated if not provided). Time limits are optional - omit them for permanent codes.

**Example:**
```javascript
{
  device_id: "abc123",
  name: "Guest Code",
  code: "1234",
  starts_at: "2025-01-01T16:00:00Z",
  ends_at: "2025-01-15T12:00:00Z"
}
```

#### create_access_code_on_multiple_locks(device_ids, name, code?, starts_at?, ends_at?, location_filter?)
Creates the same access code on multiple locks. Supports location-based filtering to target locks by location name.

**Example with location filter:**
```javascript
{
  device_ids: [],  // Can be empty when using location_filter
  name: "Seattle Guest Code",
  code: "5678",
  location_filter: "Seattle"  // Will find all locks with "Seattle" in their location or name
}
```

#### list_access_codes(device_id?)
Lists all access codes. Optionally filter by device_id to see codes for a specific lock.

#### update_access_code(access_code_id, name?, code?, starts_at?, ends_at?)
Updates an existing access code. All parameters except access_code_id are optional.

#### delete_access_code(access_code_id)
Permanently deletes an access code from the lock.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues related to:
- This MCP server: Open an issue on GitHub
- Seam API: Visit [Seam Docs](https://docs.seam.co/) or [Seam Support](https://www.seam.co/contact)
- MCP protocol: Visit [MCP Documentation](https://modelcontextprotocol.io/)

## Links

- [Seam Console](https://console.seam.co/)
- [Seam API Documentation](https://docs.seam.co/)
- [Seam Supported Devices](https://www.seam.co/supported-devices)
- [Model Context Protocol](https://modelcontextprotocol.io/)
