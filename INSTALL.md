# Installation Instructions for Claude Desktop

## Quick Install

1. **Clone and build the server:**
   ```bash
   cd ~/src/seam-mcp
   npm install
   npm run build
   ```

2. **Add to Claude Desktop config:**

   **macOS:** Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Linux:** Edit `~/.config/Claude/claude_desktop_config.json`

   Add this configuration:
   ```json
   {
     "mcpServers": {
       "seam": {
         "command": "node",
         "args": [
           "/home/keith/src/seam-mcp/.smithery/stdio/index.cjs",
           "seamApiKey=seam_Uc2Wd2Zo_7bjgze3JdhMRw8Cwwdi8rWNt"
         ]
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Test it:**
   - Ask Claude: "List all my smart locks"
   - Ask Claude: "Create access code 1234 named 'Test Code' on all my locks"

## Verified Working

This server has been tested locally and successfully:
- ✅ Lists all 7 locks (SEA Studio, SF Front, SEA Back Storage, etc.)
- ✅ Lock/unlock operations
- ✅ Access code creation and management
- ✅ Location-based filtering

All tools work perfectly when run locally!
