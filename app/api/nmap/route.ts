import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const command = searchParams.get('command');

  if (!command) {
    return NextResponse.json({ error: 'Command is required' }, { status: 400 });
  }

  // Security checks
  if (!command.startsWith('nmap ')) {
    return NextResponse.json({ error: 'Only nmap commands are allowed' }, { status: 400 });
  }
  
  // Block potentially dangerous commands
  if (/[;&|<>$`(){}[\]\n\r]/g.test(command)) {
    return NextResponse.json({ 
      error: 'Command contains forbidden characters' 
    }, { status: 400 });
  }

  // Block privileged scan types on the server side
  const privilegedFlags = ['-sS', '-sU', '-sA', '-sW', '-sM', '-sN', '-sF', '-sX', '--privileged', 'sudo'];
  for (const flag of privilegedFlags) {
    if (command.includes(flag)) {
      return NextResponse.json({ 
        error: `The command contains privileged option "${flag}" which is not allowed` 
      }, { status: 400 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Split the command into program and arguments
  const [program, ...args] = command.split(' ');

  try {
    // Spawn the nmap process
    const nmap = spawn(program, args, { shell: false });

    // Handle stdout
    nmap.stdout.on('data', async (data) => {
      await writer.write(encoder.encode(data.toString()));
    });

    // Handle stderr
    nmap.stderr.on('data', async (data) => {
      await writer.write(encoder.encode(data.toString()));
    });

    // Handle process completion
    nmap.on('close', async (code) => {
      if (code !== 0) {
        await writer.write(encoder.encode(`\nProcess exited with code ${code}\n`));
      }
      await writer.close();
    });

    // Handle errors
    nmap.on('error', async (error) => {
      console.error('Nmap process error:', error);
      await writer.write(encoder.encode(`Error: ${error.message}\n`));
      await writer.close();
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      await writer.write(encoder.encode(`Error starting process: ${error.message}\n`));
    } else {
      await writer.write(encoder.encode(`Error starting process: ${String(error)}\n`));
    }
    await writer.close();
  }

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  });
} 