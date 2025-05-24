import { RoutingTable } from './types';

export class Node {
  public id: string;
  public routingTable: RoutingTable;
  public neighbors: Map<string, number>;

  constructor(id: string) {
    this.id = id;
    this.routingTable = new Map();
    this.neighbors = new Map();
  }

  addNeighbor(nodeId: string, weight: number): void {
    this.neighbors.set(nodeId, weight);
  }

  removeNeighbor(nodeId: string): void {
    this.neighbors.delete(nodeId);
  }

  updateRoutingTable(routingTable: RoutingTable): void {
    this.routingTable.clear();
    for (const [destination, entry] of routingTable) {
      this.routingTable.set(destination, entry);
    }
  }

  getNextHop(destination: string): string | null {
    const entry = this.routingTable.get(destination);
    return entry ? entry.nextHop : null;
  }

  getDistance(destination: string): number {
    const entry = this.routingTable.get(destination);
    return entry ? entry.distance : Infinity;
  }

  toString(): string {
    const neighbors = Array.from(this.neighbors.entries())
      .map(([nodeId, weight]) => `${nodeId}(${weight})`)
      .join(', ');
    
    return `Node ${this.id} - Neighbors: [${neighbors}]`;
  }
} 