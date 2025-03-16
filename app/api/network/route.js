import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

// Helper function to execute shell commands safely
const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    // Increase timeout to 60 seconds for traceroute
    const timeout = command.startsWith('traceroute') ? 60000 : 30000;
    
    const process = exec(command, { timeout }, (error, stdout, stderr) => {
      if (error && !error.killed) {
        reject(error);
        return;
      }
      // If we have output, return it even if the command was killed
      if (stdout) {
        resolve(stdout);
      }
    });

    // Collect output as it comes
    let output = '';
    process.stdout.on('data', (data) => {
      output += data;
    });

    // Handle process completion
    process.on('close', (code) => {
      if (code !== null && output) {
        resolve(output);
      }
    });
  });
};

// Validate IP address format
const isValidIp = (ip) => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

// Add domain validation helper
const isValidDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain);
};

// Helper function to create a readable stream
function createStream(command, args) {
  const process = spawn(command, args);
  const stream = new ReadableStream({
    start(controller) {
      process.stdout.on('data', (data) => {
        controller.enqueue(data.toString());
      });

      process.stderr.on('data', (data) => {
        controller.enqueue(`Error: ${data.toString()}`);
      });

      process.on('close', (code) => {
        if (code !== null && code !== 0) {
          controller.enqueue(`\nProcess exited with code ${code}`);
        }
        controller.close();
      });
    },
    cancel() {
      process.kill();
    }
  });

  return { stream, process };
}

export async function POST(request) {
  try {
    const { command, ip, customEndpoint } = await request.json();

    // Validate input
    if (!command) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Validate endpoints
    if (command === 'ping' && !ip) {
      return NextResponse.json({ error: 'Missing IP address' }, { status: 400 });
    }

    if (command === 'traceroute' && !ip && !customEndpoint) {
      return NextResponse.json({ error: 'Missing endpoint for traceroute' }, { status: 400 });
    }

    if (ip && !isValidIp(ip)) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
    }

    if (customEndpoint && !isValidDomain(customEndpoint)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    let streamData;
    switch (command) {
      case 'ping':
        // Always continuous ping (no -c flag)
        streamData = createStream('ping', [ip]);
        break;
      case 'traceroute':
        const target = customEndpoint || ip;
        streamData = createStream('traceroute', ['-q', '1', target]);
        break;
      default:
        return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    }

    const { stream, process } = streamData;

    // Store the process in a global map to kill it later if needed
    if (!global.processes) global.processes = new Map();
    const processId = Date.now().toString();
    global.processes.set(processId, process);

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Process-ID': processId
      },
    });

  } catch (error) {
    console.error('Error executing command:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add a new route handler for stopping processes
export async function DELETE(request) {
  const { processId } = await request.json();
  
  if (!processId || !global.processes?.has(processId)) {
    return NextResponse.json({ error: 'Invalid process ID' }, { status: 400 });
  }

  const process = global.processes.get(processId);
  process.kill();
  global.processes.delete(processId);

  return NextResponse.json({ success: true });
} 