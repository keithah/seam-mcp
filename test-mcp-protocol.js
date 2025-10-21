import { spawn } from 'child_process';
import { createInterface } from 'readline';

async function testMCPProtocol() {
  console.log('Testing MCP Protocol with built server...\n');

  const serverProcess = spawn('node', [
    './.smithery/stdio/index.cjs',
    'seamApiKey=seam_Uc2Wd2Zo_7bjgze3JdhMRw8Cwwdi8rWNt'
  ]);

  const rl = createInterface({
    input: serverProcess.stdout,
    crlfDelay: Infinity
  });

  serverProcess.stderr.on('data', (data) => {
    console.log('[SERVER LOG]:', data.toString().trim());
  });

  // Collect responses
  const responses = [];
  rl.on('line', (line) => {
    try {
      const msg = JSON.parse(line);
      responses.push(msg);
      console.log('[RESPONSE]:', JSON.stringify(msg, null, 2));
    } catch (e) {
      console.log('[RAW]:', line);
    }
  });

  // Helper to send message
  const send = (msg) => {
    const json = JSON.stringify(msg);
    console.log('\n[SENDING]:', json.substring(0, 100) + '...');
    serverProcess.stdin.write(json + '\n');
  };

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 1. Initialize
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // 2. List tools
  send({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // 3. Call list_locks tool
  send({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_locks',
      arguments: {}
    }
  });

  // Wait for responses
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n\n========== TEST COMPLETE ==========');
  console.log(`Received ${responses.length} responses`);

  serverProcess.kill();
}

testMCPProtocol().catch(console.error);
