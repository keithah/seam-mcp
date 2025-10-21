import createServer from './src/index.ts';
import dotenv from 'dotenv';

dotenv.config();

async function testMCP() {
  console.log('Testing MCP Server structure...\n');

  try {
    const config = {
      seamApiKey: process.env.SEAM_API_KEY
    };

    console.log('Creating MCP server...');
    const serverObj = createServer({ config });
    console.log('Returned object type:', typeof serverObj);
    console.log('Returned object keys:', Object.keys(serverObj || {}).slice(0, 20));
    console.log('\nLooking for tools...');

    // Check if it has a callTool method
    if (serverObj && typeof serverObj.callTool === 'function') {
      console.log('✓ Found callTool method');

      // Try to call list_locks
      console.log('\nCalling list_locks via protocol...');
      const result = await serverObj.callTool({
        name: 'list_locks',
        arguments: {}
      });
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('✗ No callTool method found');
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMCP();
