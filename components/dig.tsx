import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DigToolProps {
  defaultEndpoint?: string;
}

export default function DigTool({ defaultEndpoint = "" }: DigToolProps) {
  const [domain, setDomain] = useState(defaultEndpoint);
  const [recordType, setRecordType] = useState("A");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDig = async () => {
    if (!domain) {
      setError("Please enter a domain name");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/dig?domain=${encodeURIComponent(domain)}&type=${recordType}`);
      if (!response.ok) {
        throw new Error('Failed to perform DNS lookup');
      }
      const data = await response.json();
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
          placeholder="Enter domain name"
          className="flex-1 text-xs h-7 bg-gray-800 border-gray-700"
        />
        <Select value={recordType} onValueChange={setRecordType}>
          <SelectTrigger className="w-[100px] h-7 text-xs bg-gray-800 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="AAAA">AAAA</SelectItem>
            <SelectItem value="MX">MX</SelectItem>
            <SelectItem value="NS">NS</SelectItem>
            <SelectItem value="TXT">TXT</SelectItem>
            <SelectItem value="CNAME">CNAME</SelectItem>
            <SelectItem value="SOA">SOA</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleDig}
          disabled={isLoading}
          className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Digging..." : "Dig"}
        </Button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/30 p-2 rounded">
          {error}
        </div>
      )}

      {result && (
        <pre className="text-xs bg-gray-800 p-2 rounded border border-gray-700 overflow-x-auto">
          {result}
        </pre>
      )}
    </div>
  );
}   