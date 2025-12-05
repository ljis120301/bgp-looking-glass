"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import WhoisTool from '@/components/whois';
import { Spinner } from '@/components/ui/spinner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { AdvancedFilters, BGPResultsTable } from '@/components/BGPComponents';
import SkipNavigation from '@/components/SkipNavigation';

// Update interface to match the bgp-state API response structure
interface BGPEntry {
  target_prefix: string;
  source_id: string;
  path: number[];
  community: string[];
  next_hop?: string;
}

interface BGPResponse {
  status: string;
  status_code: number;
  data: {
    resource: string;
    bgp_state: BGPEntry[]; // Changed to bgp_state based on API docs
    nr_routes: number;
    timestamp: string;
    time: string;
  };
  query_id: string;
  server_id: string;
}

// Add these interfaces near the top with other interfaces
interface SavedFilter {
  id: string;
  name: string;
  filters: AdvancedFilters;
}

interface AdvancedFilters {
  asNumber: string;
  prefix: string;
  minPathLength: number;
  maxPathLength: number;
  communityTags: string[];
  savedFilters: SavedFilter[];
}

// Add a helper function to format IP addresses
const formatIP = (ip: string) => {
  return ip ? `[${ip}]` : '';
};

// Update the getASName function to include IP information
const getASName = (asn: number, index: number, entry: BGPEntry) => {
  const asnNames: { [key: number]: string } = {
    13335: 'Cloudflare',
    7018: 'AT&T',
    3356: 'Level3/Lumen',
    174: 'Cogent',
    3257: 'GTT',
    2914: 'NTT',
    1299: 'Telia',
    6453: 'TATA',
    6762: 'Telecom Italia',
    3491: 'PCCW',
    701: 'Verizon',
    6830: 'Liberty Global',
    6939: 'Hurricane Electric',
  };

  let name = asnNames[asn] || `AS${asn}`;
  
  // Add source IP for first hop
  if (index === 0) {
    const sourceIP = entry.source_id.split('-')[1];
    return `${name} ${formatIP(sourceIP)}`;
  }
  
  // Add next-hop IP for last hop
  if (index === entry.path.length - 1 && entry.next_hop) {
    return `${name} ${formatIP(entry.next_hop)}`;
  }

  return name;
};

// First, let's add a helper function to explain common BGP communities
const explainCommunity = (asn: string, value: string) => {
  // Common BGP community meanings
  const commonCommunities: { [key: string]: { [key: string]: string } } = {
    '3356': { // Level3/Lumen
      '3': 'Received from customer',
      '22': 'Received from peer',
      '100': 'Standard service',
      '123': 'Regional route',
      '575': 'Route originated in Mexico',
      '901': 'Route originated in US/Canada',
      '2056': 'Route originated in South America',
      '11450': 'Route originated in Brazil'
    },
    '13335': { // Cloudflare
      '10011': 'Datacenter route',
      '10137': 'Anycast route'
    }
  };

  return commonCommunities[asn]?.[value] || 'Custom routing policy';
};

// Add this helper function to get route collector location information
const getCollectorLocation = (sourceId: string) => {
  const [collectorId] = sourceId.split('-');
  // Updated list of RIPE RIS collectors based on current documentation
  const locations: { [key: string]: { city: string, country: string, coordinates: [number, number] } } = {
    '00': { city: 'Amsterdam', country: 'NL', coordinates: [52.3676, 4.9041] },
    '01': { city: 'London', country: 'GB', coordinates: [51.5074, -0.1278] },
    '02': { city: 'Paris', country: 'FR', coordinates: [48.8566, 2.3522] },
    '03': { city: 'Amsterdam-2', country: 'NL', coordinates: [52.3676, 4.9041] },
    '04': { city: 'Geneva', country: 'CH', coordinates: [46.2044, 6.1432] },
    '05': { city: 'Vienna', country: 'AT', coordinates: [48.2082, 16.3738] },
    '06': { city: 'Tokyo', country: 'JP', coordinates: [35.6762, 139.7706] },
    '07': { city: 'Stockholm', country: 'SE', coordinates: [59.3293, 18.0686] },
    '08': { city: 'San Jose', country: 'US', coordinates: [37.3382, -121.8863] },
    '09': { city: 'Zurich', country: 'CH', coordinates: [47.3769, 8.5417] },
    '10': { city: 'Milan', country: 'IT', coordinates: [45.4642, 9.1900] },
    '11': { city: 'New York', country: 'US', coordinates: [40.7128, -74.0060] },
    '12': { city: 'Frankfurt', country: 'DE', coordinates: [50.1109, 8.6821] },
    '13': { city: 'Moscow', country: 'RU', coordinates: [55.7558, 37.6173] },
    '14': { city: 'Palo Alto', country: 'US', coordinates: [37.4419, -122.1430] },
    '15': { city: 'Sao Paulo', country: 'BR', coordinates: [-23.5505, -46.6333] },
    '16': { city: 'Miami', country: 'US', coordinates: [25.7617, -80.1918] },
    '17': { city: 'Singapore', country: 'SG', coordinates: [1.3521, 103.8198] },
    '18': { city: 'Barcelona', country: 'ES', coordinates: [41.3851, 2.1734] },
    '19': { city: 'Johannesburg', country: 'ZA', coordinates: [-26.2041, 28.0473] },
    '20': { city: 'Zurich', country: 'CH', coordinates: [47.3769, 8.5417] },
    '21': { city: 'Paris', country: 'FR', coordinates: [48.8566, 2.3522] },
    '22': { city: 'Bucharest', country: 'RO', coordinates: [44.4268, 26.1025] },
    '23': { city: 'Singapore-2', country: 'SG', coordinates: [1.3521, 103.8198] },
    '24': { city: 'Montevideo', country: 'UY', coordinates: [-34.9011, -56.1645] },
    '25': { city: 'Amsterdam-3', country: 'NL', coordinates: [52.3676, 4.9041] },
    '26': { city: 'Dubai', country: 'AE', coordinates: [25.2048, 55.2708] }
  };

  const location = locations[collectorId];
  if (!location) {
    console.log(`Unknown collector ID: ${collectorId} from source: ${sourceId}`);
    return { city: 'Unknown', country: '??', coordinates: [0, 0] };
  }
  return location;
};

const getUniqueCountries = (routes: BGPEntry[]) => {
  const countries = new Set<string>();
  routes.forEach(entry => {
    const location = getCollectorLocation(entry.source_id);
    countries.add(location.country);
  });
  return Array.from(countries).sort();
};

// Add this helper function near your other helpers
const getPageRange = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages
  ];
};

export default function BGPLookupTool() {
  const params = useParams();
  const initialIP = params?.ip as string;
  
  const [ipAddress, setIpAddress] = useState(initialIP || '');
  const [bgpInfo, setBgpInfo] = useState<BGPResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [defaultIpAddress, setDefaultIpAddress] = useState('');
  const [userASN, setUserASN] = useState<string | null>(null);
  const [userASName, setUserASName] = useState<string | null>(null);
  const [isNetworkToolsOpen, setIsNetworkToolsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const itemsPerPage = 15; // Number of BGP entries per page
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    asNumber: '',
    prefix: '',
    minPathLength: 0,
    maxPathLength: 0,
    communityTags: [],
    savedFilters: []
  });

  // Add useEffect for mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add useEffect to fetch the user's IP and ASN when component mounts
  useEffect(() => {
    if (!mounted) return;

    const getUserInfo = async () => {
      try {
        // Fetch user's public IP
        const response = await fetch('https://stat.ripe.net/data/whats-my-ip/data.json');
        if (!response.ok) {
          throw new Error('Failed to fetch IP');
        }
        const data = await response.json();
        const ip = data.data.ip;
        setDefaultIpAddress(ip);
        
        // Fetch user's ASN based on their IP
        try {
          const asnResponse = await fetch(`https://stat.ripe.net/data/network-info/data.json?resource=${ip}`);
          if (asnResponse.ok) {
            const asnData = await asnResponse.json();
            if (asnData.data?.asns && asnData.data.asns.length > 0) {
              const asn = asnData.data.asns[0].toString();
              setUserASN(asn);
              
              // Fetch AS name/organization
              try {
                const asNameResponse = await fetch(`https://stat.ripe.net/data/as-overview/data.json?resource=AS${asn}`);
                if (asNameResponse.ok) {
                  const asNameData = await asNameResponse.json();
                  if (asNameData.data?.holder) {
                    setUserASName(asNameData.data.holder);
                  }
                }
              } catch (nameError) {
                console.error('Error fetching AS name:', nameError);
              }
            }
          }
        } catch (asnError) {
          console.error('Error fetching ASN:', asnError);
          // Non-critical error, continue without ASN
        }
        
        if (!initialIP) {
          setIpAddress(ip);
          setInstruction('Press the Lookup button to view BGP information');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    getUserInfo();
  }, [mounted, initialIP]);

  const handleLookup = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!ipAddress) {
      setError('Please enter an IP address');
      setInstruction(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setInstruction(null);

    try {
      console.log('Starting BGP lookup for IP:', ipAddress);
      // Changed back to bgp-state endpoint
      const response = await fetch(`https://stat.ripe.net/data/bgp-state/data.json?resource=${ipAddress}`);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API Response:', JSON.stringify(data, null, 2));
      console.log('Response data structure:', {
        hasData: !!data,
        hasDataProperty: !!data?.data,
        dataKeys: data ? Object.keys(data) : [],
        dataPropertyKeys: data?.data ? Object.keys(data.data) : [],
        routesArray: data?.data?.bgp_state,
        routesLength: data?.data?.bgp_state?.length
      });
      
      setBgpInfo(data);
    } catch (error) {
      console.error('Detailed error information:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setError('Failed to fetch BGP data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [ipAddress]);

  // Auto-lookup if we have an initial IP from URL
  useEffect(() => {
    if (initialIP && mounted) {
      handleLookup();
    }
  }, [initialIP, mounted, handleLookup]);

  // Add effect to log state changes
  console.log('Render state:', {
    hasData: !!bgpInfo,
    dataStructure: bgpInfo,
    isLoading,
    hasError: !!error
  });

  const InfoTooltip = ({ text, alignRight = false }: { text: string, alignRight?: boolean }) => (
    <div className="group relative inline-block ml-2">
      <span className="cursor-help text-blue-400 text-sm">ⓘ</span>
      <div className={`hidden group-hover:block absolute z-10 w-64 p-2 mt-2 text-sm bg-gray-700 rounded-lg shadow-lg text-gray-100
        ${alignRight ? 'right-0' : 'left-0'} 
        sm:w-64 w-48
        ${alignRight ? 'sm:right-0 -right-2' : 'sm:left-0 -left-2'}`}>
        {text}
      </div>
    </div>
  );

  // Add this helper function
  const paginateData = (data: BGPEntry[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Add this function to filter BGP entries
  const filterBGPEntries = (entries: BGPEntry[], filters: AdvancedFilters) => {
    return entries.filter(entry => {
      // Filter by AS number
      if (filters.asNumber && !entry.path.includes(parseInt(filters.asNumber))) {
        return false;
      }

      // Filter by prefix
      if (filters.prefix && !entry.target_prefix.includes(filters.prefix)) {
        return false;
      }

      // Filter by path length
      if (filters.minPathLength > 0 && entry.path.length < filters.minPathLength) {
        return false;
      }
      if (filters.maxPathLength > 0 && entry.path.length > filters.maxPathLength) {
        return false;
      }

      // Filter by community tags
      if (filters.communityTags.length > 0) {
        const entryCommunities = entry.community.map(c => c.toString());
        if (!filters.communityTags.some(tag => entryCommunities.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  };

  // Add this useEffect near other effects
  useEffect(() => {
    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem('bgp-saved-filters');
    if (savedFilters) {
      setAdvancedFilters(prev => ({
        ...prev,
        savedFilters: JSON.parse(savedFilters)
      }));
    }
  }, []);

  // Add this useEffect to save filters when they change
  useEffect(() => {
    localStorage.setItem('bgp-saved-filters', JSON.stringify(advancedFilters.savedFilters));
  }, [advancedFilters.savedFilters]);

  // Add early return for server-side rendering
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-2 sm:p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded-lg mb-4"></div>
            <div className="h-8 bg-gray-800 rounded-lg mb-4"></div>
            <div className="h-32 bg-gray-800 rounded-lg"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <SkipNavigation />
      <Header />
      
      <main id="main-content" className="flex-1 p-2 sm:p-4" role="main">
        {/* Main Lookup Card */}
        <div className="mb-2 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Network Info Section */}
          {(defaultIpAddress || userASN) && (
            <div className="bg-gray-800/50 border-b border-gray-700 px-3 py-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {userASN && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-blue-300 font-mono text-xs font-semibold">AS{userASN}</span>
                    {userASName && (
                      <span className="text-gray-300 text-[11px]">{userASName}</span>
                    )}
                  </div>
                )}
                {defaultIpAddress && userASN && (
                  <span className="text-gray-600">•</span>
                )}
                {defaultIpAddress && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span>Your IP:</span>
                    <span className="font-mono text-gray-300">{defaultIpAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Lookup Controls */}
          <div className="p-2">
            <form onSubmit={handleLookup}>
              <div className="flex gap-1.5">
                <label htmlFor="ip-input" className="sr-only">IP Address Input</label>
                <input
                  id="ip-input"
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="Enter IP address or prefix (e.g., 1.1.1.1)"
                  className="flex-1 bg-gray-900 border border-gray-600 px-2.5 py-1.5 rounded text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  aria-label="IP Address Input"
                  aria-describedby="ip-input-description"
                  autoComplete="off"
                />
                <div id="ip-input-description" className="sr-only">
                  Enter an IP address to look up its BGP routing information
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 min-w-[70px]"
                  aria-label="Lookup BGP Information"
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <Spinner size="sm" className="text-white" />
                  ) : (
                    'Lookup'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNetworkToolsOpen(!isNetworkToolsOpen)}
                  className="border border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 text-gray-300 hover:text-gray-200 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
                  aria-expanded={isNetworkToolsOpen}
                  aria-controls="network-tools-panel"
                >
                  WHOIS
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Network Tools Panel */}
        <div className={`mb-3 transition-all duration-300 overflow-hidden ${isNetworkToolsOpen ? 'max-h-[600px]' : 'max-h-0'}`} id="network-tools-panel">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-blue-400 text-sm font-semibold mb-1">WHOIS Lookup</h3>
              <p className="text-gray-400 text-[10px]">Query domain, IP address, and AS number information from WHOIS databases</p>
            </div>
            <WhoisTool defaultEndpoint={ipAddress || defaultIpAddress} />
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="text-red-400 mb-2 p-2 text-xs bg-red-900/30 rounded-lg">
            {error}
          </div>
        )}

        {instruction && (
          <div className="text-blue-300 mb-2 p-2 text-xs bg-blue-900/30 rounded-lg border border-blue-800/50">
            {instruction}
          </div>
        )}

        {bgpInfo?.data?.bgp_state && bgpInfo.data.bgp_state.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-xs font-semibold text-blue-400">BGP Routes for {ipAddress}</h2>
              <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full text-[10px]">
                {bgpInfo.data.bgp_state.filter(entry => 
                  !selectedCountry || getCollectorLocation(entry.source_id).country === selectedCountry
                ).length} routes
                {selectedCountry && ` in ${selectedCountry}`}
              </span>
              <span className="text-[10px] text-gray-400">from</span>
              <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full text-[10px]">
                {new Set(bgpInfo.data.bgp_state.map(entry => entry.source_id.split('-')[0])).size} collectors
              </span>
            </div>

            {/* Legend */}
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <span className="bg-blue-600/40 text-blue-200 px-1.5 py-0.5 rounded font-mono ring-1 ring-blue-500/50 text-[9px]">
                  Observer
                </span>
                <span>Peer</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-mono text-[9px]">
                  Transit
                </span>
                <span>Intermediate</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-green-700/50 text-green-200 px-1.5 py-0.5 rounded font-mono ring-1 ring-green-500/30 text-[9px]">
                  Dest
                </span>
                <span>Origin</span>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-gray-400 text-[10px]">Filter:</span>
                <span 
                  onClick={() => setSelectedCountry(null)}
                  className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                    selectedCountry === null 
                      ? 'bg-blue-600 text-blue-100' 
                      : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                  }`}
                >
                  All
                </span>
                {getUniqueCountries(bgpInfo.data.bgp_state).map(country => (
                  <span
                    key={country}
                    onClick={() => setSelectedCountry(country === selectedCountry ? null : country)}
                    className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] transition-colors flex items-center gap-1.5 ${
                      country === selectedCountry 
                        ? 'bg-blue-600 text-blue-100' 
                        : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                    }`}
                  >
                    <img 
                      src={`https://flagcdn.com/w20/${country.toLowerCase() === 'gb' ? 'gb' : country.toLowerCase()}.png`}
                      alt={country}
                      className="w-3 h-2 rounded-[1px] object-cover"
                    />
                    {country} ({bgpInfo.data.bgp_state.filter(entry => 
                      getCollectorLocation(entry.source_id).country === country
                    ).length})
                  </span>
                ))}
              </div>
              <div className="mt-2">
                <AdvancedFilters
                  filters={advancedFilters}
                  onChange={setAdvancedFilters}
                  onSaveFilter={(name) => {
                    const newFilter = {
                      id: Date.now().toString(),
                      name,
                      filters: { ...advancedFilters }
                    };
                    setAdvancedFilters(prev => ({
                      ...prev,
                      savedFilters: [...prev.savedFilters, newFilter]
                    }));
                  }}
                  onLoadFilter={(filter) => {
                    setAdvancedFilters({
                      ...filter.filters,
                      savedFilters: advancedFilters.savedFilters
                    });
                  }}
                  onDeleteFilter={(id) => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      savedFilters: prev.savedFilters.filter(f => f.id !== id)
                    }));
                  }}
                />
              </div>
            </div>
            
            <BGPResultsTable 
              data={paginateData(
                filterBGPEntries(
                  bgpInfo.data.bgp_state.filter(entry => 
                    !selectedCountry || getCollectorLocation(entry.source_id).country === selectedCountry
                  ),
                  advancedFilters
                ),
                currentPage,
                itemsPerPage
              )}
              getCollectorLocation={getCollectorLocation}
              getASName={getASName}
              userASN={userASN}
            />

            <Pagination className="mt-3">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={`text-[10px] py-1 px-2 bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300 hover:text-gray-100 ${
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }`}
                  />
                </PaginationItem>
                {getPageRange(
                  currentPage,
                  Math.ceil(bgpInfo.data.bgp_state.filter(entry => 
                    !selectedCountry || getCollectorLocation(entry.source_id).country === selectedCountry
                  ).length / itemsPerPage)
                ).map((page, i) => (
                  <PaginationItem key={i}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis className="text-gray-500" />
                    ) : (
                      <PaginationLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page as number);
                        }}
                        isActive={currentPage === page}
                        className={`text-xs ${
                          currentPage === page
                            ? 'bg-blue-600 text-blue-100 border-blue-500 hover:bg-blue-700'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-gray-100'
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      const totalPages = Math.ceil(bgpInfo.data.bgp_state.filter(entry => 
                        !selectedCountry || getCollectorLocation(entry.source_id).country === selectedCountry
                      ).length / itemsPerPage);
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={`text-xs bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300 hover:text-gray-100 ${
                      currentPage >= Math.ceil(bgpInfo.data.bgp_state.length / itemsPerPage) ? 'pointer-events-none opacity-50' : ''
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : bgpInfo && !isLoading ? (
          <div className="text-gray-400 p-2 text-xs bg-gray-800 rounded-lg border border-gray-700">
            No BGP routes found for this IP address.
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
} 