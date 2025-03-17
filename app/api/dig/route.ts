import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const type = searchParams.get('type') || 'A';

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  try {
    // Execute dig command with the specified domain and record type
    const { stdout } = await execAsync(`dig ${type} ${domain}`);
    return NextResponse.json({ result: stdout });
  } catch (error) {
    console.error('Dig command error:', error);
    return NextResponse.json(
      { error: 'Failed to perform DNS lookup' },
      { status: 500 }
    );
  }
} 