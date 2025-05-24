export interface RoutingTableEntry {
  destination: string;
  nextHop: string;
  distance: number;
}

export interface Link {
  from: string;
  to: string;
  weight: number;
}

export interface Message {
  content: string;
  from: string;
  to: string;
  path: string[];
}

export type RoutingTable = Map<string, RoutingTableEntry>; 