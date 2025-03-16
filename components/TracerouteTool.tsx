import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";

interface TracerouteToolProps {
  defaultEndpoint?: string;
}

export default function TracerouteTool({ defaultEndpoint = 'bgp.whoisjason.me' }: TracerouteToolProps) {
  const [tracerouteEndpoint, setTracerouteEndpoint] = useState<string>(defaultEndpoint);
  const [tracerouteLoading, setTracerouteLoading] = useState<boolean>(false);
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

  const handleTraceroute = async () => {
    if (!tracerouteEndpoint) {
      return;
    }

    setTracerouteLoading(true);
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
          command: 'traceroute',
          customEndpoint: tracerouteEndpoint
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const processId = response.headers.get('X-Process-ID');
      setActiveProcess(processId);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const result = await reader?.read();
        if (!result) break;
        const { value, done } = result;
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
      setTracerouteLoading(false);
      setActiveProcess(null);
    }
  };

  const stopTraceroute = async () => {
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
        console.error('Error stopping traceroute:', error);
      }
      setTracerouteLoading(false);
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
          value={tracerouteEndpoint}
          onChange={(e) => setTracerouteEndpoint(e.target.value)}
          placeholder="Enter domain or IP for traceroute"
          className="bg-gray-700 border border-gray-600 px-1.5 py-0.5 rounded text-gray-100 text-[10px] flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {!activeProcess ? (
          <Button
            onClick={handleTraceroute}
            disabled={tracerouteLoading}
            variant="default"
            size="sm"
            className="whitespace-nowrap text-[10px] bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 h-[26px]"
          >
            {tracerouteLoading ? 'Starting...' : 'Trace'}
          </Button>
        ) : (
          <Button
            onClick={stopTraceroute}
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