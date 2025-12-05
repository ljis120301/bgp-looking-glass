"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface WhoisToolProps {
  defaultEndpoint?: string;
}

interface WhoisResponse {
  result: string;
  raw?: any[];
  source?: string;
  queryTime?: string;
}

/**
 * WhoisTool Component
 * Provides WHOIS lookup functionality for domains, IPs, and AS numbers
 * Uses RIPE Stat Data API for secure, structured data retrieval
 */
export default function WhoisTool({ defaultEndpoint = "" }: WhoisToolProps) {
  const cleanDefaultEndpoint = defaultEndpoint.replace(/^bgp\./, '');
  const [query, setQuery] = useState(cleanDefaultEndpoint);
  const [result, setResult] = useState<WhoisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  const handleWhois = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Please enter a domain, IP address, or AS number");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/whois?query=${encodeURIComponent(trimmedQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform WHOIS lookup');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse and categorize WHOIS data
  const parseWhoisData = (text: string) => {
    const lines = text.split('\n');
    const sections: { [key: string]: string[] } = {
      'Contact Information': [],
      'Network Information': [],
      'Administrative': [],
      'Technical': [],
      'Other': []
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Categorize based on common WHOIS fields
      if (/^(person|admin-c|tech-c|org|organisation|registrant|email):/i.test(trimmed)) {
        sections['Contact Information'].push(trimmed);
      } else if (/^(inetnum|netname|route|origin|as-name|descr|country):/i.test(trimmed)) {
        sections['Network Information'].push(trimmed);
      } else if (/^(mnt-by|mnt-routes|mnt-domains|changed|created|last-modified):/i.test(trimmed)) {
        sections['Administrative'].push(trimmed);
      } else if (/^(status|remarks|source):/i.test(trimmed)) {
        sections['Technical'].push(trimmed);
      } else {
        sections['Other'].push(trimmed);
      }
    });

    return sections;
  };

  const renderFormattedView = () => {
    if (!result?.result) return null;
    
    const sections = parseWhoisData(result.result);

    return (
      <div className="space-y-3">
        {Object.entries(sections).map(([section, lines]) => {
          if (lines.length === 0) return null;
          
          return (
            <div key={section} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h4 className="text-blue-400 text-xs font-semibold mb-2 flex items-center gap-2">
                {section}
                <Badge variant="secondary" className="text-[9px] bg-blue-600/30 text-blue-300">
                  {lines.length} fields
                </Badge>
              </h4>
              <div className="space-y-1">
                {lines.map((line, idx) => {
                  const [key, ...valueParts] = line.split(':');
                  const value = valueParts.join(':').trim();
                  
                  return (
                    <div key={idx} className="text-[10px] font-mono flex">
                      <span className="text-gray-400 w-32 flex-shrink-0">{key}:</span>
                      <span className="text-gray-200 break-all">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-3 space-y-3">
      {/* Query Input Section */}
      <div className="space-y-2">
        <form onSubmit={handleWhois} className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Domain, IP, or AS number (e.g., example.com, 1.1.1.1, AS13335)"
            className="flex-1 text-xs h-8 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap min-w-[70px]"
          >
            {isLoading ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              "Lookup"
            )}
          </button>
        </form>

        {/* Quick Examples */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 text-[10px]">Examples:</span>
          {['1.1.1.1', 'AS13335', 'ripe.net'].map(example => (
            <button
              key={example}
              onClick={() => setQuery(example)}
              className="text-[10px] px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100 transition-colors"
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-400 text-xs bg-red-900/30 p-3 rounded-lg border border-red-800/50">
          <div className="flex items-start gap-2">
            <span className="text-red-500 flex-shrink-0">⚠</span>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-2">
          {/* Result Header */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2 border border-gray-700">
            <div className="flex items-center gap-2">
              <Badge className="text-[9px] bg-green-600/30 text-green-300">
                Success
              </Badge>
              {result.source && (
                <span className="text-[10px] text-gray-400">
                  via {result.source}
                </span>
              )}
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'formatted' | 'raw')} className="w-auto">
              <TabsList className="h-6 bg-gray-700 p-0.5">
                <TabsTrigger 
                  value="formatted" 
                  className="text-[9px] h-5 px-2 data-[state=active]:bg-blue-600 data-[state=active]:text-blue-100"
                >
                  Formatted
                </TabsTrigger>
                <TabsTrigger 
                  value="raw" 
                  className="text-[9px] h-5 px-2 data-[state=active]:bg-blue-600 data-[state=active]:text-blue-100"
                >
                  Raw
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Result Content */}
          <div className="max-h-[400px] overflow-y-auto bg-gray-900 rounded-lg border border-gray-700">
            {viewMode === 'formatted' ? (
              <div className="p-3">
                {renderFormattedView()}
              </div>
            ) : (
              <pre className="text-[10px] p-3 font-mono text-gray-300 whitespace-pre-wrap">
                {result.result}
              </pre>
            )}
          </div>

          {/* Copy Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(result.result);
              }}
              variant="ghost"
              size="sm"
              className="text-[10px] h-6 text-gray-400 hover:text-gray-300"
            >
              Copy to Clipboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}