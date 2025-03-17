import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const command = searchParams.get('command');

  if (!command) {
    return NextResponse.json({ error: 'Command is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Split the command into program and arguments
  const [program, ...args] = command.split(' ');

  // Spawn the nmap process
  const nmap = spawn(program, args);

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
    await writer.close();
  });

  // Handle errors
  nmap.on('error', async (error) => {
    console.error('Nmap process error:', error);
    await writer.write(encoder.encode(`Error: ${error.message}\n`));
    await writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  });
} 