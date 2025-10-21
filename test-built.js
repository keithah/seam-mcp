import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'child_process';

async function testBuiltServer() {
  console.log('Testing built MCP server...\n');

  const serverProcess = spawn('node', ['./.smithery/stdio/index.cjs'], {
    env: {
      ...process.env,
      SEAM_API_KEY: 'seam_Uc2Wd2Zo_7bjgze3JdhMRw8Cwwdi8rWNt'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  serverProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log('STDOUT:', data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log('STDERR:', data.toString());
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    console.log('\nFull output:', output);
    console.log('\nFull errors:', errorOutput);
  });

  // Send a test message to list tools
  console.log('Sending initialize message...');
  const initMessage = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  }) + '\n';

  serverProcess.stdin.write(initMessage);

  // Wait a bit then list tools
  setTimeout(() => {
    console.log('\nSending tools/list message...');
    const toolsMessage = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    }) + '\n';
    serverProcess.stdin.write(toolsMessage);
  }, 1000);

  // Wait then kill
  setTimeout(() => {
    console.log('\nKilling server...');
    serverProcess.kill();
  }, 3000);
}

testBuiltServer().catch(console.error);
