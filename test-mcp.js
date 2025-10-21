import createServer from './src/index.ts';
import dotenv from 'dotenv';

dotenv.config();

async function testMCP() {
  console.log('Testing MCP Server...\n');

  try {
    // Create server with config
    const config = {
      seamApiKey: process.env.SEAM_API_KEY
    };

    console.log('Creating MCP server...');
    const server = createServer({ config });
    console.log('✓ MCP server created\n');

    // Test list_locks tool
    console.log('Testing list_locks tool...');

    // Get the tool handler
    const tools = server._toolHandlers || server.toolHandlers;
    console.log('Available tools:', Object.keys(tools || {}));

    if (!tools || !tools.list_locks) {
      console.error('✗ list_locks tool not found!');
      console.log('Server object:', Object.keys(server));
      return;
    }

    console.log('Calling list_locks...');
    const result = await tools.list_locks({}, {});
    console.log('✓ list_locks result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMCP();
