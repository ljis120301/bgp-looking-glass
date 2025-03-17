import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  try {
    // Execute whois command with additional parameters for better output
    const { stdout } = await execAsync(`whois -H ${domain}`);
    
    // Check if the output contains error messages
    if (stdout.includes('Malformed request') || stdout.includes('No match for')) {
      return NextResponse.json(
        { error: 'Invalid domain or no WHOIS information available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ result: stdout });
  } catch (error) {
    console.error('Whois command error:', error);
    return NextResponse.json(
      { error: 'Failed to perform WHOIS lookup' },
      { status: 500 }
    );
  }
} 