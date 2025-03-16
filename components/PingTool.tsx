import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";

interface PingToolProps {
  ipAddress: string;
}

export default function PingTool({ ipAddress }: PingToolProps) {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingLoading, setPingLoading] = useState<boolean>(false);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const [networkResults, setNetworkResults] = useState({
    loading: false,
    data: null as string | null,
    error: null as string | null,
    active: false
  });
  const outputRef = useRef<HTMLPreElement>(null);

  const scrollToBottom = () => {
    if (outputRef.current) {
      const scrollHeight = outputRef.current.scrollHeight;
      const height = outputRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      
      setTimeout(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = maxScrollTop + 100;
        }
      }, 10);
    }
  };

  const handlePing = async () => {
    if (!ipAddress) {
      return;
    }

    setPingLoading(true);
    setNetworkResults(prev => ({
      ...prev,
      loading: true,
      data: '',
      error: null,
      active: true
    }));

    try {
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'ping',
          ip: ipAddress
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const processId = response.headers.get('X-Process-ID');
      setActiveProcess(processId);
      setIsPinging(true);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        setNetworkResults(prev => ({
          ...prev,
          data: prev.data + text
        }));
        
        scrollToBottom();
      }
    } catch (error) {
      setNetworkResults(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    } finally {
      setPingLoading(false);
    }
  };

  const stopPing = async () => {
    if (activeProcess) {
      try {
        await fetch('/api/network', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            processId: activeProcess
          }),
        });
      } catch (error) {
        console.error('Error stopping ping:', error);
      }
      setIsPinging(false);
      setActiveProcess(null);
      setNetworkResults(prev => ({
        ...prev,
        active: false
      }));
    }
  };

  return (
    <div className="bg-gray-800 rounded border border-gray-700">
      <div className="flex gap-1 p-1">
        <input
          type="text"
          value={ipAddress}
          readOnly
          placeholder="IP address from above"
          className="bg-gray-700 border border-gray-600 px-1.5 py-0.5 rounded text-gray-100 text-[10px] flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {!isPinging ? (
          <Button
            onClick={handlePing}
            disabled={pingLoading}
            variant="default"
            size="sm"
            className="whitespace-nowrap text-[10px] bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-[26px]"
          >
            {pingLoading ? 'Starting...' : 'Ping'}
          </Button>
        ) : (
          <Button
            onClick={stopPing}
            variant="destructive"
            size="sm"
            className="whitespace-nowrap text-[10px] bg-red-600 hover:bg-red-700 px-2 py-1 h-[26px]"
          >
            Stop
          </Button>
        )}
      </div>
      <div className={`overflow-hidden transition-all duration-200 ${
        networkResults.active ? 'h-20' : 'h-0'
      }`}>
        <div className="h-full border-t border-gray-700 bg-gray-900/50">
          <pre 
            ref={outputRef}
            className="h-full p-1.5 whitespace-pre-wrap font-mono text-[10px] leading-3 text-gray-300 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            style={{ scrollBehavior: 'smooth' }}
          >
            {networkResults.data}
          </pre>
        </div>
      </div>
    </div>
  );
} 