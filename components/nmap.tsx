import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface NmapToolProps {
  defaultEndpoint?: string;
}

interface NmapFlags {
  // Basic Scan Options
  pn: boolean;      // Skip host discovery
  sS: boolean;      // SYN scan
  sT: boolean;      // Connect scan
  sU: boolean;      // UDP scan
  sV: boolean;      // Version detection
  sC: boolean;      // Default scripts
  A: boolean;       // Aggressive scan
  T4: boolean;      // Aggressive timing
  v: boolean;       // Verbose output
  
  // Output Options
  oN: boolean;      // Normal output
  oX: boolean;      // XML output
  oA: boolean;      // Output to all formats
  
  // Advanced Options
  vuln: boolean;    // Vulnerability scan
  script: string;   // Custom script selection
  scriptArgs: string; // Script arguments
  topPorts: string; // Top ports to scan
  maxRetries: string; // Max retries
  maxScanDelay: string; // Max scan delay
  customCommand: string; // Custom command input
}

export default function NmapTool({ defaultEndpoint = "" }: NmapToolProps) {
  const [target, setTarget] = useState(defaultEndpoint);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flags, setFlags] = useState<NmapFlags>({
    pn: false,
    sS: false,
    sT: false,
    sU: false,
    sV: false,
    sC: false,
    A: false,
    T4: false,
    v: false,
    oN: false,
    oX: false,
    oA: false,
    vuln: false,
    script: '',
    scriptArgs: '',
    topPorts: '',
    maxRetries: '',
    maxScanDelay: '',
    customCommand: ''
  });

  const handleNmap = async () => {
    if (!target) {
      setError("Please enter a target host or network");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult("");

    try {
      let command = 'nmap';
      
      // If custom command is provided, use it instead of building from flags
      if (flags.customCommand.trim()) {
        command = `nmap ${flags.customCommand} ${target}`;
      } else {
        // Build command from flags
        if (flags.pn) command += ' -Pn';
        if (flags.sS) command += ' -sS';
        if (flags.sT) command += ' -sT';
        if (flags.sU) command += ' -sU';
        if (flags.sV) command += ' -sV';
        if (flags.sC) command += ' -sC';
        if (flags.A) command += ' -A';
        if (flags.T4) command += ' -T4';
        if (flags.v) command += ' -v';
        if (flags.oN) command += ' -oN -';
        if (flags.oX) command += ' -oX -';
        if (flags.oA) command += ' -oA scan';
        if (flags.vuln) command += ' --script vuln';
        if (flags.script) command += ` --script ${flags.script}`;
        if (flags.scriptArgs) command += ` --script-args ${flags.scriptArgs}`;
        if (flags.topPorts) command += ` --top-ports ${flags.topPorts}`;
        if (flags.maxRetries) command += ` --max-retries ${flags.maxRetries}`;
        if (flags.maxScanDelay) command += ` --max-scan-delay ${flags.maxScanDelay}`;

        command += ` ${target}`;
      }

      const response = await fetch(`/api/nmap?command=${encodeURIComponent(command)}`);
      
      if (!response.ok) {
        throw new Error('Failed to perform Nmap scan');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        setResult(prev => prev + text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlag = (flag: keyof NmapFlags) => {
    setFlags(prev => ({
      ...prev,
      [flag]: !prev[flag]
    }));
  };

  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Enter target host or network (e.g., example.com or 192.168.1.0/24)"
          className="flex-1 text-xs h-7 bg-gray-800 border-gray-700"
        />
        <Button
          onClick={handleNmap}
          disabled={isLoading}
          className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
        >
          {isLoading ? "Scanning..." : "Scan"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-gray-700/50 border-0 h-7 w-full flex justify-center gap-1 p-1">
          <TabsTrigger 
            value="basic"
            className="data-[state=active]:bg-gray-600 data-[state=active]:text-blue-400 text-xs h-full px-6 font-medium"
          >
            Basic
          </TabsTrigger>
          <TabsTrigger 
            value="advanced"
            className="data-[state=active]:bg-gray-600 data-[state=active]:text-blue-400 text-xs h-full px-6 font-medium"
          >
            Advanced
          </TabsTrigger>
          <TabsTrigger 
            value="custom"
            className="data-[state=active]:bg-gray-600 data-[state=active]:text-blue-400 text-xs h-full px-6 font-medium"
          >
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="flex items-center space-x-1">
              <Checkbox
                id="pn"
                checked={flags.pn}
                onCheckedChange={() => toggleFlag('pn')}
                className="h-3 w-3"
              />
              <label htmlFor="pn" className="text-xs text-gray-300">-Pn (No ping)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="sS"
                checked={flags.sS}
                onCheckedChange={() => toggleFlag('sS')}
                className="h-3 w-3"
              />
              <label htmlFor="sS" className="text-xs text-gray-300">-sS (SYN scan)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="sT"
                checked={flags.sT}
                onCheckedChange={() => toggleFlag('sT')}
                className="h-3 w-3"
              />
              <label htmlFor="sT" className="text-xs text-gray-300">-sT (Connect scan)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="sU"
                checked={flags.sU}
                onCheckedChange={() => toggleFlag('sU')}
                className="h-3 w-3"
              />
              <label htmlFor="sU" className="text-xs text-gray-300">-sU (UDP scan)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="sV"
                checked={flags.sV}
                onCheckedChange={() => toggleFlag('sV')}
                className="h-3 w-3"
              />
              <label htmlFor="sV" className="text-xs text-gray-300">-sV (Version)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="sC"
                checked={flags.sC}
                onCheckedChange={() => toggleFlag('sC')}
                className="h-3 w-3"
              />
              <label htmlFor="sC" className="text-xs text-gray-300">-sC (Scripts)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="A"
                checked={flags.A}
                onCheckedChange={() => toggleFlag('A')}
                className="h-3 w-3"
              />
              <label htmlFor="A" className="text-xs text-gray-300">-A (Aggressive)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="T4"
                checked={flags.T4}
                onCheckedChange={() => toggleFlag('T4')}
                className="h-3 w-3"
              />
              <label htmlFor="T4" className="text-xs text-gray-300">-T4 (Fast)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="v"
                checked={flags.v}
                onCheckedChange={() => toggleFlag('v')}
                className="h-3 w-3"
              />
              <label htmlFor="v" className="text-xs text-gray-300">-v (Verbose)</label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center space-x-1">
              <Checkbox
                id="vuln"
                checked={flags.vuln}
                onCheckedChange={() => toggleFlag('vuln')}
                className="h-3 w-3"
              />
              <label htmlFor="vuln" className="text-xs text-gray-300">--script vuln (Vulnerability scan)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="oN"
                checked={flags.oN}
                onCheckedChange={() => toggleFlag('oN')}
                className="h-3 w-3"
              />
              <label htmlFor="oN" className="text-xs text-gray-300">-oN (Normal output)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="oX"
                checked={flags.oX}
                onCheckedChange={() => toggleFlag('oX')}
                className="h-3 w-3"
              />
              <label htmlFor="oX" className="text-xs text-gray-300">-oX (XML output)</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="oA"
                checked={flags.oA}
                onCheckedChange={() => toggleFlag('oA')}
                className="h-3 w-3"
              />
              <label htmlFor="oA" className="text-xs text-gray-300">-oA (All formats)</label>
            </div>
            <div className="space-y-1">
              <Input
                type="text"
                value={flags.script}
                onChange={(e) => setFlags(prev => ({ ...prev, script: e.target.value }))}
                placeholder="Custom script (e.g., http-* or vuln)"
                className="text-xs h-7 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Input
                type="text"
                value={flags.scriptArgs}
                onChange={(e) => setFlags(prev => ({ ...prev, scriptArgs: e.target.value }))}
                placeholder="Script arguments"
                className="text-xs h-7 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Input
                type="text"
                value={flags.topPorts}
                onChange={(e) => setFlags(prev => ({ ...prev, topPorts: e.target.value }))}
                placeholder="Top ports to scan (e.g., 100)"
                className="text-xs h-7 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Input
                type="text"
                value={flags.maxRetries}
                onChange={(e) => setFlags(prev => ({ ...prev, maxRetries: e.target.value }))}
                placeholder="Max retries (e.g., 2)"
                className="text-xs h-7 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Input
                type="text"
                value={flags.maxScanDelay}
                onChange={(e) => setFlags(prev => ({ ...prev, maxScanDelay: e.target.value }))}
                placeholder="Max scan delay (e.g., 10s)"
                className="text-xs h-7 bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-2">
          <div className="space-y-2">
            <Input
              type="text"
              value={flags.customCommand}
              onChange={(e) => setFlags(prev => ({ ...prev, customCommand: e.target.value }))}
              placeholder="Enter custom Nmap command (e.g., -sS -sV -p- -T4)"
              className="text-xs h-7 bg-gray-800 border-gray-700"
            />
            <p className="text-xs text-gray-400">
              Note: The target will be automatically appended to your command. Do not include the target in the custom command.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/30 p-2 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="h-[300px] overflow-y-auto bg-gray-800 rounded border border-gray-700">
          <pre className="text-xs p-2 whitespace-pre-wrap font-mono">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
} 