import { NextResponse } from 'next/server';

/**
 * WHOIS API Route
 * Uses RIPE Stat Data API for WHOIS lookups instead of executing system commands
 * This provides better security and more structured data
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Basic validation to prevent abuse
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2 || trimmedQuery.length > 255) {
    return NextResponse.json({ error: 'Invalid query length' }, { status: 400 });
  }

  // Block potentially dangerous characters
  if (/[;&|`$(){}[\]<>]/.test(trimmedQuery)) {
    return NextResponse.json({ error: 'Invalid characters in query' }, { status: 400 });
  }

  try {
    // Use RIPE Stat Data API for WHOIS information
    const response = await fetch(
      `https://stat.ripe.net/data/whois/data.json?resource=${encodeURIComponent(trimmedQuery)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`RIPE API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Check if we got valid data
    if (data.status === 'error' || !data.data?.records) {
      return NextResponse.json(
        { error: 'No WHOIS information found for this query' },
        { status: 404 }
      );
    }

    // Format the records into a readable text format
    const formattedOutput = data.data.records
      .map((record: any) => {
        return record.map((field: any) => `${field.key}: ${field.value}`).join('\n');
      })
      .join('\n\n');

    return NextResponse.json({ 
      result: formattedOutput,
      raw: data.data.records,
      source: 'RIPE Stat Data API',
      queryTime: data.time || new Date().toISOString()
    });
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to perform WHOIS lookup. Please try again.' },
      { status: 500 }
    );
  }
} 