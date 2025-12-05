"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Move the AS Numbers object outside and add a "none" option
const commonASNumbers: { [key: string]: string } = {
  'none': 'Custom AS',
  '13335': 'Cloudflare',
  '7018': 'AT&T',
  '3356': 'Level3/Lumen',
  '174': 'Cogent',
  '3257': 'GTT',
  '2914': 'NTT',
  '1299': 'Telia',
  '6453': 'TATA',
  '6762': 'Telecom Italia',
  '3491': 'PCCW',
  '701': 'Verizon',
  '6830': 'Liberty Global',
  '6939': 'Hurricane Electric',
};

// Interfaces
interface BGPEntry {
  target_prefix: string;
  source_id: string;
  path: number[];
  community: string[];
  next_hop?: string;
}

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

interface AdvancedFiltersProps {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onSaveFilter: (name: string) => void;
  onLoadFilter: (filter: SavedFilter) => void;
  onDeleteFilter: (id: string) => void;
}

interface BGPResultsTableProps {
  data: BGPEntry[];
  getCollectorLocation: (sourceId: string) => { city: string; country: string };
  getASName: (asn: number, index: number, entry: BGPEntry) => string;
  userASN?: string | null;
  
}

// Advanced Filters Component
export function AdvancedFilters({
  filters,
  onChange,
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter
}: AdvancedFiltersProps) {
  const [newFilterName, setNewFilterName] = useState('');
  const [customAS, setCustomAS] = useState('');

  const handleASNumberChange = (value: string) => {
    if (value === 'none') {
      onChange({ ...filters, asNumber: customAS });
    } else {
      onChange({ ...filters, asNumber: value });
      setCustomAS(value);
    }
  };

  const clearFilters = () => {
    onChange({
      ...filters,
      asNumber: '',
      prefix: '',
      minPathLength: 0,
      maxPathLength: 0,
      communityTags: []
    });
    setCustomAS('');
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 px-2 py-1">
      <div className="flex items-center gap-2">
        {/* AS Number */}
        <div className="flex gap-1 items-center">
          <Select
            value={Object.keys(commonASNumbers).find(key => key === filters.asNumber) || 'none'}
            onValueChange={handleASNumberChange}
          >
            <SelectTrigger className="!h-[22px] !min-h-0 text-[10px] bg-gray-800 border-gray-700 w-[140px] text-gray-100 !px-2.5 flex items-center gap-2">
              <SelectValue placeholder="AS" className="text-gray-500 leading-none pl-0.5" />
              <span className="opacity-50 shrink-0">
                <svg width="8" height="8" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </span>
            </SelectTrigger>
            <SelectContent 
              className="bg-gray-800/95 backdrop-blur-sm border-gray-700 text-gray-100 max-h-[200px] overflow-y-auto w-[180px] p-1"
              position="popper"
              sideOffset={4}
              align="start"
            >
              <div className="py-1">
                {Object.entries(commonASNumbers).map(([asn, name]) => (
                  <SelectItem 
                    key={asn} 
                    value={asn} 
                    className="text-[10px] text-gray-100 data-[highlighted]:text-white data-[highlighted]:bg-gray-700 focus:bg-gray-700 cursor-pointer py-1.5 px-3 min-h-[24px] flex items-center leading-none rounded-sm"
                  >
                    {asn === 'none' ? name : `AS${asn} - ${name}`}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
          <Input
            value={filters.asNumber}
            onChange={(e) => {
              setCustomAS(e.target.value);
              onChange({ ...filters, asNumber: e.target.value });
            }}
            placeholder="Custom"
            className="h-[22px] w-[80px] text-[10px] bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
          />
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Prefix/Subnet */}
        <Input
          value={filters.prefix}
          onChange={(e) => onChange({ ...filters, prefix: e.target.value })}
          placeholder="Prefix (1.1.1.0/24)"
          className="h-[22px] w-[140px] text-[10px] bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />

        <div className="h-4 w-px bg-gray-700" />

        {/* Path Length */}
        <div className="flex gap-1 items-center">
          <div className="flex h-[22px]">
            <Input
              type="number"
              min="0"
              value={filters.minPathLength || ''}
              onChange={(e) => onChange({ ...filters, minPathLength: parseInt(e.target.value) || 0 })}
              placeholder="Min"
              className="h-[22px] w-[50px] text-[10px] bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 rounded-r-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex flex-col border border-l-0 border-gray-700 rounded-r-md overflow-hidden">
              <button
                onClick={() => onChange({ ...filters, minPathLength: (filters.minPathLength || 0) + 1 })}
                className="flex-1 px-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[8px] border-b border-gray-600 flex items-center justify-center"
              >
                <svg width="8" height="8" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 3.5L4 7h7L7.5 3.5z" fill="currentColor"/>
                </svg>
              </button>
              <button
                onClick={() => onChange({ ...filters, minPathLength: Math.max(0, (filters.minPathLength || 0) - 1) })}
                className="flex-1 px-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[8px] flex items-center justify-center"
              >
                <svg width="8" height="8" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 11.5L11 8H4l3.5 3.5z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
          <span className="text-gray-500 text-[10px]">to</span>
          <div className="flex h-[22px]">
            <Input
              type="number"
              min="0"
              value={filters.maxPathLength || ''}
              onChange={(e) => onChange({ ...filters, maxPathLength: parseInt(e.target.value) || 0 })}
              placeholder="Max"
              className="h-[22px] w-[60px] text-[10px] bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 rounded-r-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex flex-col border border-l-0 border-gray-700 rounded-r-md overflow-hidden">
              <button
                onClick={() => onChange({ ...filters, maxPathLength: (filters.maxPathLength || 0) + 1 })}
                className="flex-1 px-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[8px] border-b border-gray-600 flex items-center justify-center"
              >
                <svg width="8" height="8" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 3.5L4 7h7L7.5 3.5z" fill="currentColor"/>
                </svg>
              </button>
              <button
                onClick={() => onChange({ ...filters, maxPathLength: Math.max(0, (filters.maxPathLength || 0) - 1) })}
                className="flex-1 px-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[8px] flex items-center justify-center"
              >
                <svg width="8" height="8" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 11.5L11 8H4l3.5 3.5z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Community Tags */}
        <div className="flex gap-1 items-center flex-wrap flex-1 min-w-[100px]">
          <Input
            placeholder="Community tag (press Enter)"
            className="h-[22px] text-[10px] bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                onChange({
                  ...filters,
                  communityTags: [...filters.communityTags, e.currentTarget.value]
                });
                e.currentTarget.value = '';
              }
            }}
          />
          {filters.communityTags.length > 0 && (
            <div className="flex gap-1">
              {filters.communityTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-[10px] bg-blue-600/30 text-blue-300 h-[22px] hover:bg-blue-600/40 flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = filters.communityTags.filter((_, i) => i !== index);
                      onChange({ ...filters, communityTags: newTags });
                    }}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Clear Button */}
        <Button
          onClick={clearFilters}
          variant="ghost"
          size="sm"
          className="h-[22px] text-[10px] text-gray-400 hover:text-gray-300 px-2"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

// BGP Results Table Component
export function BGPResultsTable({ 
  data, 
  getCollectorLocation, 
  getASName,
  userASN
}: BGPResultsTableProps) {
  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow className="bg-gray-800">
            <TableHead className="text-gray-300 py-2 px-3 border-b border-gray-700">Network</TableHead>
            <TableHead className="text-gray-300 py-2 px-3 border-b border-gray-700">Collector</TableHead>
            <TableHead className="text-gray-300 py-2 px-3 border-b border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span>AS Path</span>
                <span className="text-[9px] text-gray-500 font-normal whitespace-nowrap">(Observer → Destination)</span>
              </div>
            </TableHead>
            <TableHead className="text-gray-300 py-2 px-3 border-b border-gray-700 text-center">Hops</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, rowIndex) => {
            // Reverse the path to show from user's perspective (observer → origin)
            const reversedPath = [...entry.path].reverse();
            const [collectorId, peerIp] = entry.source_id.split('-');
            const location = getCollectorLocation(entry.source_id);
            
            return (
              <TableRow 
                key={rowIndex} 
                className="bg-gray-800 hover:bg-gray-750 transition-colors"
              >
                <TableCell className="py-2 px-3 border-b border-gray-700">
                  <span className="text-blue-400 font-mono text-[11px] font-semibold">
                    {entry.target_prefix}
                  </span>
                </TableCell>
                <TableCell className="py-2 px-3 border-b border-gray-700">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-blue-600/30 px-1.5 py-0.5 rounded text-[10px] text-blue-300 font-medium">
                      RRC{collectorId}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300 text-[10px]">
                      {location.city}, {location.country}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2 px-3 border-b border-gray-700">
                  <div className="flex items-center gap-1 min-w-max">
                    {reversedPath.map((asn, i) => {
                      const originalIndex = entry.path.length - 1 - i;
                      const isUserAS = userASN && asn.toString() === userASN;
                      const isOrigin = i === reversedPath.length - 1;
                      const isObserver = i === 0;
                      
                      return (
                        <span key={i} className="flex items-center gap-1">
                          {/* Small inline indicator for user's AS */}
                          {isObserver && isUserAS && (
                            <span className="text-blue-400 text-[10px]">●</span>
                          )}
                          <span 
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              isObserver ? 'bg-blue-600/40 text-blue-200 ring-1 ring-blue-500/50' :
                              isOrigin ? 'bg-green-700/50 text-green-200 ring-1 ring-green-500/30' :
                              'bg-gray-700 text-gray-300'
                            }`}
                            title={
                              isObserver && isUserAS ? 'Your Network (Observer)' :
                              isObserver ? 'Observer/Peer Network' :
                              isOrigin ? 'Destination Network (Origin)' :
                              `Transit AS (Hop ${i + 1})`
                            }
                          >
                            {getASName(asn, originalIndex, entry)}
                          </span>
                          {i < reversedPath.length - 1 && (
                            <span className="text-gray-500 mx-1 text-xs">→</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell className="py-2 px-3 border-b border-gray-700 text-center">
                  <span className="bg-gray-700/50 px-2 py-0.5 rounded text-[10px] text-gray-400 font-medium">
                    {entry.path.length}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
} 