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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-gray-400">Advanced Filters</span>
        <Button
          onClick={clearFilters}
          variant="ghost"
          size="sm"
          className="h-[22px] text-[10px] text-gray-400 hover:text-gray-300"
        >
          Clear Filters
        </Button>
      </div>

      <div className="space-y-2">
        {/* AS Number and Prefix Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">AS Number</Label>
            <div className="flex gap-1">
              <Select
                value={Object.keys(commonASNumbers).find(key => key === filters.asNumber) || 'none'}
                onValueChange={handleASNumberChange}
              >
                <SelectTrigger className="h-[22px] text-[10px] bg-gray-800 border-gray-700">
                  <SelectValue placeholder="AS" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {Object.entries(commonASNumbers).map(([asn, name]) => (
                    <SelectItem key={asn} value={asn} className="text-[10px]">
                      {asn === 'none' ? name : `AS${asn} - ${name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={filters.asNumber}
                onChange={(e) => {
                  setCustomAS(e.target.value);
                  onChange({ ...filters, asNumber: e.target.value });
                }}
                placeholder="Custom"
                className="h-[22px] text-[10px] bg-gray-800 border-gray-700 flex-1"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Prefix/Subnet</Label>
            <Input
              value={filters.prefix}
              onChange={(e) => onChange({ ...filters, prefix: e.target.value })}
              placeholder="1.1.1.0/24"
              className="h-[22px] text-[10px] bg-gray-800 border-gray-700"
            />
          </div>
        </div>

        {/* Path Length Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Min Path Length</Label>
            <Input
              type="number"
              value={filters.minPathLength || ''}
              onChange={(e) => onChange({ ...filters, minPathLength: parseInt(e.target.value) || 0 })}
              className="h-[22px] text-[10px] bg-gray-800 border-gray-700"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Max Path Length</Label>
            <Input
              type="number"
              value={filters.maxPathLength || ''}
              onChange={(e) => onChange({ ...filters, maxPathLength: parseInt(e.target.value) || 0 })}
              className="h-[22px] text-[10px] bg-gray-800 border-gray-700"
            />
          </div>
        </div>

        {/* Community Tags */}
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-400">Community Tags</Label>
          {filters.communityTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {filters.communityTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-[10px] bg-blue-600/30 text-blue-300 h-[18px]"
                >
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = filters.communityTags.filter((_, i) => i !== index);
                      onChange({ ...filters, communityTags: newTags });
                    }}
                    className="ml-1 hover:text-red-400"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            placeholder="Add tag (press Enter)"
            className="h-[22px] text-[10px] bg-gray-800 border-gray-700"
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
        </div>

        {/* Saved Filters */}
        <div className="border-t border-gray-700 pt-2 space-y-1">
          <div className="flex gap-2">
            <Input
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Save current filters as..."
              className="h-[22px] text-[10px] bg-gray-800 border-gray-700"
            />
            <Button
              onClick={() => {
                if (newFilterName) {
                  onSaveFilter(newFilterName);
                  setNewFilterName('');
                }
              }}
              className="h-[22px] text-[10px] px-2 bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
          </div>
          {filters.savedFilters.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.savedFilters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="text-[10px] bg-gray-700 text-gray-300 cursor-pointer hover:bg-gray-600 h-[18px]"
                  onClick={() => onLoadFilter(filter)}
                >
                  {filter.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFilter(filter.id);
                    }}
                    className="ml-1 hover:text-red-400"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// BGP Results Table Component
export function BGPResultsTable({ 
  data, 
  getCollectorLocation, 
  getASName 
}: BGPResultsTableProps) {
  return (
    <Table className="border border-gray-700 rounded-lg overflow-hidden text-xs">
      <TableHeader>
        <TableRow className="bg-gray-800 border-gray-700">
          <TableHead className="text-gray-300 py-2 px-3">Network</TableHead>
          <TableHead className="text-gray-300 py-2 px-3">Location</TableHead>
          <TableHead className="text-gray-300 py-2 px-3">AS Path</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry, index) => (
          <TableRow 
            key={index} 
            className="bg-gray-800 hover:bg-gray-750 border-gray-700"
          >
            <TableCell className="py-1.5 px-3">
              <span className="text-blue-400 font-mono text-[11px]">{entry.target_prefix}</span>
            </TableCell>
            <TableCell className="py-1.5 px-3">
              {(() => {
                const [collectorId, peerIp] = entry.source_id.split('-');
                const location = getCollectorLocation(entry.source_id);
                return (
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-600/30 px-1.5 py-0.5 rounded text-[10px] text-blue-300">
                      RRC{collectorId}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300 text-[10px]">
                      {location.city}, {location.country}
                    </span>
                  </div>
                );
              })()}
            </TableCell>
            <TableCell className="py-1.5 px-3">
              <div className="flex items-center gap-1 min-w-max">
                {entry.path.map((asn, i) => (
                  <span key={i} className="flex items-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      i === 0 ? 'bg-green-800/50 text-green-300' :
                      i === entry.path.length - 1 ? 'bg-purple-800/50 text-purple-300' :
                      'bg-gray-700 text-blue-300'
                    }`}>
                      {getASName(asn, i, entry)}
                    </span>
                    {i < entry.path.length - 1 && (
                      <span className="text-gray-500 mx-1">→</span>
                    )}
                  </span>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 