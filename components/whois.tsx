import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WhoisToolProps {
  defaultEndpoint?: string;
}

export default function WhoisTool({ defaultEndpoint = "" }: WhoisToolProps) {
  // Remove 'bgp.' prefix from default endpoint if present
  const cleanDefaultEndpoint = defaultEndpoint.replace(/^bgp\./, '');
  const [domain, setDomain] = useState(cleanDefaultEndpoint);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWhois = async () => {
    if (!domain) {
      setError("Please enter a domain name");
      return;
    }

    // Clean the domain by removing 'bgp.' prefix if present
    const cleanDomain = domain.replace(/^bgp\./, '');

    // Basic domain validation
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(cleanDomain)) {
      setError("Please enter a valid domain name");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/whois?domain=${encodeURIComponent(cleanDomain)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform WHOIS lookup');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain name (e.g., example.com)"
          className="flex-1 text-xs h-7 bg-gray-800 border-gray-700"
        />
        <Button
          onClick={handleWhois}
          disabled={isLoading}
          className="h-7 text-xs bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Looking up..." : "Whois"}
        </Button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/30 p-2 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="h-[300px] overflow-y-auto bg-gray-800 rounded border border-gray-700">
          <pre className="text-xs p-2 whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}