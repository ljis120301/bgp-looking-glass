"use client";

import { useState, useEffect } from 'react';

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
    '01': { city: 'London', country: 'UK', coordinates: [51.5074, -0.1278] },
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

export default function Home() {
  const [ipAddress, setIpAddress] = useState('');
  const [bgpInfo, setBgpInfo] = useState<BGPResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [defaultIpAddress, setDefaultIpAddress] = useState('');

  const handleLookup = async () => {
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
  };

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

  // Add this function to fetch the public IP
  const fetchPublicIP = async () => {
    try {
      const response = await fetch('https://stat.ripe.net/data/whats-my-ip/data.json');
      if (!response.ok) {
        throw new Error('Failed to fetch IP');
      }
      const data = await response.json();
      return data.data.ip;
    } catch (error) {
      console.error('Error fetching public IP:', error);
      return '';
    }
  };

  // Add useEffect to fetch the IP when component mounts
  useEffect(() => {
    const getPublicIP = async () => {
      const ip = await fetchPublicIP();
      setDefaultIpAddress(ip);
      setIpAddress(ip); // Set the input value
      if (ip) {
        setInstruction('Press the Lookup button to view BGP information');
      }
    };
    
    getPublicIP();
  }, []); // Empty dependency array means this runs once when component mounts

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-900 text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">BGP Looking Glass</h1>
      
      <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-300">
          BGP (Border Gateway Protocol) is how networks on the Internet share routing information.
          This tool shows you how different networks around the world can reach a specific IP address.
        </p>
      </div>

      <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">About This Looking Glass</h3>
        <div className="text-gray-300 space-y-2">
          <p>This tool shows a global view of BGP routes from multiple networks worldwide using RIPE's Route Information Service (RIS). 
          Unlike single-network looking glasses (like Lumen's or AT&T's), which show only their internal view, this tool shows how the IP address is seen from many different perspectives around the world.</p>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <h4 className="font-semibold text-blue-300">This Global Looking Glass</h4>
              <ul className="list-disc list-inside text-sm mt-2">
                <li>Shows routes from many networks</li>
                <li>Provides global visibility</li>
                <li>Multiple geographic perspectives</li>
                <li>More comprehensive view</li>
              </ul>
            </div>
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <h4 className="font-semibold text-blue-300">Single-Network Looking Glass</h4>
              <ul className="list-disc list-inside text-sm mt-2">
                <li>Shows routes from one network</li>
                <li>Single network's perspective</li>
                <li>Often one geographic location</li>
                <li>More detailed internal view</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={ipAddress}
          onChange={(e) => setIpAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              handleLookup();
            }
          }}
          placeholder={defaultIpAddress || "Enter IP address (e.g., 1.1.1.1)"}
          className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-gray-100 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button 
            onClick={handleLookup} 
            disabled={isLoading}
            className={`p-3 rounded-lg flex-1 sm:flex-none ${
              isLoading 
                ? 'bg-gray-700 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-semibold transition-colors`}
          >
            {isLoading ? 'Loading...' : 'Lookup'}
          </button>
          {defaultIpAddress && ipAddress !== defaultIpAddress && (
            <button
              onClick={() => {
                setIpAddress(defaultIpAddress);
                handleLookup();
              }}
              className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Reset to My IP</span>
              <span className="inline sm:hidden">My IP</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-400 mb-4 p-3 bg-red-900/30 rounded-lg">
          {error}
        </div>
      )}

      {instruction && (
        <div className="text-blue-300 mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-800/50">
          {instruction}
        </div>
      )}

      {bgpInfo?.data?.bgp_state && bgpInfo.data.bgp_state.length > 0 ? (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
            <h2 className="text-xl font-semibold text-blue-400">BGP Routes for {ipAddress}</h2>
            <span className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm whitespace-nowrap">
              {bgpInfo.data.bgp_state.filter(entry => 
                !selectedCountry || getCollectorLocation(entry.source_id).country === selectedCountry
              ).length} routes found
              {selectedCountry && ` in ${selectedCountry}`}
              <InfoTooltip text={
                selectedCountry 
                  ? `Showing routes observed by collectors in ${selectedCountry}` 
                  : "The number of different paths that networks use to reach this IP address. More routes generally means better global connectivity."
              } />
            </span>
          </div>
          
          <div className="mb-4 flex items-center gap-2">
            <span className="text-gray-400">Data collected from</span>
            <span className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm">
              {new Set(bgpInfo.data.bgp_state.map(entry => entry.source_id.split('-')[0])).size} route collectors
            </span>
            <span className="text-gray-400">worldwide</span>
            <InfoTooltip text="Route collectors are servers that gather BGP routing information from many different networks. More collectors means better global visibility of how the IP address is reached from different parts of the world." />
          </div>
          
          <div className="mb-4 overflow-x-auto">
            <div className="flex items-center gap-2 pb-2 min-w-max">
              <span className="text-gray-400 whitespace-nowrap">Filter by country:</span>
              <span 
                onClick={() => setSelectedCountry(null)}
                className={`cursor-pointer px-3 py-1 rounded-full text-sm transition-colors whitespace-nowrap ${
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
                  className={`cursor-pointer px-3 py-1 rounded-full text-sm transition-colors whitespace-nowrap ${
                    country === selectedCountry 
                      ? 'bg-blue-600 text-blue-100' 
                      : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                  }`}
                >
                  {country}
                  <span className="ml-2 text-xs">
                    ({bgpInfo.data.bgp_state.filter(entry => 
                      getCollectorLocation(entry.source_id).country === country
                    ).length})
                  </span>
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {bgpInfo.data.bgp_state
              .filter(entry => 
                !selectedCountry || getCollectorLocation(entry.source_id).country === selectedCountry
              )
              .map((entry: BGPEntry, index: number) => (
                <div key={index} className="bg-gray-800 border border-gray-700 p-4 rounded-xl hover:border-blue-500/50 transition-colors">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <p className="text-gray-400 text-sm">Network Block</p>
                          <InfoTooltip text="The range of IP addresses that this route covers. For example, /24 means a block of 256 IP addresses." />
                        </div>
                        <p className="text-blue-400 font-mono">{entry.target_prefix}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end flex-wrap gap-1">
                          <p className="text-gray-400 text-sm">Route Collector</p>
                          <InfoTooltip 
                            text="The identifier of the BGP router that observed this route. The first number identifies the collector's location, followed by the IP address of the peer router sharing the routing information." 
                            alignRight={true}
                          />
                        </div>
                        {(() => {
                          const [collectorId, peerIp] = entry.source_id.split('-');
                          const location = getCollectorLocation(entry.source_id);
                          return (
                            <div>
                              <div className="text-sm flex items-center justify-end flex-wrap gap-2">
                                <span className="bg-blue-600/30 px-2 py-0.5 rounded text-blue-300">
                                  RRC{collectorId}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-300">
                                  {location.city}, {location.country}
                                </span>
                              </div>
                              <p className="text-gray-400 text-xs font-mono mt-1 break-all">
                                Peer IP: {peerIp}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <p className="text-gray-400 text-sm">Network Path</p>
                        <InfoTooltip text="The sequence of networks (Autonomous Systems) and their IP addresses that traffic passes through to reach the destination. Read from left (start) to right (destination)." />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 overflow-x-auto pb-2">
                        {entry.path.map((asn, i) => (
                          <span key={i} className="flex items-center flex-shrink-0">
                            <span className={`px-3 py-1 rounded-lg font-mono text-sm ${
                              i === 0 ? 'bg-green-800/50 text-green-300' :
                              i === entry.path.length - 1 ? 'bg-purple-800/50 text-purple-300' :
                              'bg-gray-700 text-blue-300'
                            }`}>
                              {getASName(asn, i, entry)}
                            </span>
                            {i < entry.path.length - 1 && (
                              <span className="text-gray-500 mx-2">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        <span className="font-semibold">Source IP:</span> {entry.source_id.split('-')[1]} • 
                        <span className="font-semibold ml-2">Target Prefix:</span> {entry.target_prefix}
                      </div>
                    </div>

                    {entry.community.length > 0 && (
                      <div>
                        <div className="flex items-center mb-2">
                          <p className="text-gray-400 text-sm">BGP Communities</p>
                          <InfoTooltip text="BGP communities are tags that networks attach to routes to control how traffic is handled. They're like postal codes for internet traffic, helping networks make routing decisions." />
                        </div>
                        <div className="p-3 bg-gray-700/30 rounded-lg">
                          <p className="text-sm text-gray-300 mb-3">
                            Communities help networks communicate routing preferences and policies to each other.
                            Each community (AS:VALUE) carries specific instructions about how to handle the route.
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {entry.community.map((comm, i) => {
                              const [asn, value] = comm.split(':');
                              const explanation = explainCommunity(asn, value);
                              return (
                                <div key={i} className="group relative">
                                  <div className="bg-gray-700/50 px-3 py-1 rounded-lg text-sm cursor-help">
                                    <span className="text-blue-400">{asn}</span>
                                    <span className="text-gray-400">:</span>
                                    <span className="text-gray-300">{value}</span>
                                  </div>
                                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-2 text-sm bg-gray-700 rounded-lg shadow-lg">
                                    <p className="text-gray-100">{explanation}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Understanding the Results</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <span className="text-green-300">Green</span> shows the starting network that observed the route (with source IP)</li>
              <li>• <span className="text-purple-300">Purple</span> shows the destination network</li>
              <li>• IP addresses in [brackets] show the network interfaces at each hop</li>
              <li>• The arrows (→) show the direction traffic flows between networks</li>
              <li>• More paths generally means better redundancy and reliability</li>
              <li>• Communities are like traffic signs that tell networks how to handle the traffic</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Understanding BGP Communities</h3>
            <div className="space-y-4 text-gray-300">
              <p>BGP communities are like tags or labels that networks attach to routes. They serve several important purposes:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">Common Uses</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Traffic engineering</li>
                    <li>Route filtering</li>
                    <li>Geographic identification</li>
                    <li>Service level marking</li>
                    <li>Peer type identification</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">Format Explanation</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><span className="text-blue-400">ASN</span>:<span className="text-gray-300">VALUE</span></li>
                    <li>ASN = Network assigning the community</li>
                    <li>VALUE = Specific routing instruction</li>
                    <li>Example: 3356:22 = Level3's peer route</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-gray-400 mt-4">
                Each network can define its own community values and their meanings. Large networks often publish their community definitions, 
                while others may keep them private or use them internally. Communities help networks automate routing decisions and implement 
                complex routing policies across the internet.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Understanding Route Collectors</h3>
            <div className="space-y-4 text-gray-300">
              <p>Route collectors (RRCs) are servers operated by RIPE NCC that gather BGP routing information from networks worldwide:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">Collector ID Format</h4>
                  <p className="text-sm mb-2">Example: <code>00-192.0.2.1</code></p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><span className="text-blue-400">00</span>: Collector ID (location)</li>
                    <li><span className="text-gray-300">192.0.2.1</span>: Peer Router IP</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">What They Do</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Listen to BGP updates</li>
                    <li>Store routing information</li>
                    <li>Provide global visibility</li>
                    <li>Track routing changes</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-gray-400 mt-4">
                RIPE operates route collectors in many locations worldwide. Each collector receives routing information from multiple peer routers, 
                giving us a comprehensive view of how different networks see and reach IP addresses across the internet.
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Global Route Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const locations = new Map();
                bgpInfo.data.bgp_state.forEach(entry => {
                  const location = getCollectorLocation(entry.source_id);
                  const key = `${location.city}, ${location.country}`;
                  locations.set(key, (locations.get(key) || 0) + 1);
                });

                return Array.from(locations.entries()).map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">{location}</span>
                    <span className="bg-blue-600/30 px-2 py-0.5 rounded text-blue-300 text-sm">
                      {count} {count === 1 ? 'route' : 'routes'}
                    </span>
                  </div>
                ));
              })()}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Routes are collected from RIPE RIS (Route Information Service) collectors located around the world. 
              More diverse geographical coverage indicates better global reachability for the IP address.
            </p>
          </div>
        </div>
      ) : bgpInfo && !isLoading ? (
        <div className="text-gray-400 p-4 bg-gray-800 rounded-lg border border-gray-700">
          No BGP routes found for this IP address.
        </div>
      ) : null}
    </div>
  );
}
