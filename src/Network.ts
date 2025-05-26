import { dijkstra } from './dijkstra';
import { Node } from './Node';
import { Link, Message, RoutingTable } from './types';

interface NetworkEvent {
  timestamp: number;
  type: 'routing_update';
  data: { nodeId: string };
}

export class Network {
  private nodes: Map<string, Node>;
  private links: Set<string>;
  private currentTime: number = 0;
  private eventQueue: NetworkEvent[] = [];
  private pendingUpdates: Map<string, Set<string>> = new Map(); 
  private updatePropagationDelay: number = 500;
  private maxConvergenceTime: number = 10000;
  private isConverging: boolean = false;
  private updatedNodesInCycle: Set<string> = new Set(); 

  constructor(updateDelay: number = 1000) {
    this.nodes = new Map();
    this.links = new Set();
    this.updatePropagationDelay = updateDelay;
  }

  addNode(nodeId: string): boolean {
    if (this.nodes.has(nodeId)) {
      return false;
    }
    this.nodes.set(nodeId, new Node(nodeId));
    this.startConvergenceSimulation('node_addition', nodeId);
    return true;
  }

  removeNode(nodeId: string): boolean {
    if (!this.nodes.has(nodeId)) {
      return false;
    }

    const linksToRemove: string[] = [];
    for (const link of this.links) {
      const [from, to] = link.split('-');
      if (from === nodeId || to === nodeId) {
        linksToRemove.push(link);
      }
    }

    linksToRemove.forEach(link => {
      const [from, to] = link.split('-');
      this.removeLinkSilently(from, to);
    });

    this.nodes.delete(nodeId);
    this.startConvergenceSimulation('node_failure', nodeId);
    return true;
  }

  addLink(from: string, to: string, weight: number): boolean {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      return false;
    }

    if (weight <= 0) {
      return false;
    }

    const linkKey = `${from}-${to}`;
    const reverseLinkKey = `${to}-${from}`;

    this.links.add(linkKey);
    this.links.add(reverseLinkKey);

    const fromNode = this.nodes.get(from)!;
    const toNode = this.nodes.get(to)!;

    fromNode.addNeighbor(to, weight);
    toNode.addNeighbor(from, weight);

    this.startConvergenceSimulation('link_addition', { from, to });
    return true;
  }

  removeLink(from: string, to: string): boolean {
    const linkKey = `${from}-${to}`;
    const reverseLinkKey = `${to}-${from}`;

    if (!this.links.has(linkKey)) {
      return false;
    }

    this.removeLinkSilently(from, to);
    this.startConvergenceSimulation('link_failure', { from, to });
    return true;
  }

  private removeLinkSilently(from: string, to: string): void {
    const linkKey = `${from}-${to}`;
    const reverseLinkKey = `${to}-${from}`;

    this.links.delete(linkKey);
    this.links.delete(reverseLinkKey);

    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (fromNode) fromNode.removeNeighbor(to);
    if (toNode) toNode.removeNeighbor(from);
  }

  private startConvergenceSimulation(eventType: string, eventData: any): void {
    this.isConverging = true;
    this.currentTime = 0;
    this.eventQueue = [];
    this.pendingUpdates.clear();
    this.updatedNodesInCycle.clear();

    console.log(`Simulating routing convergence (${eventType})...`);
    
    if (eventType === 'node_failure') {
      for (const nodeId of this.nodes.keys()) {
        this.scheduleRoutingUpdate(nodeId, this.updatePropagationDelay * Math.random());
      }
    } else if (eventType === 'link_failure') {
      const { from, to } = eventData;
      if (this.nodes.has(from)) {
        this.scheduleRoutingUpdate(from, this.updatePropagationDelay * 0.1);
      }
      if (this.nodes.has(to)) {
        this.scheduleRoutingUpdate(to, this.updatePropagationDelay * 0.1);
      }
    } else if (eventType === 'node_addition') {
      const newNodeId = eventData;
      this.scheduleRoutingUpdate(newNodeId, this.updatePropagationDelay * 0.1);
      for (const nodeId of this.nodes.keys()) {
        if (nodeId !== newNodeId) {
          this.scheduleRoutingUpdate(nodeId, this.updatePropagationDelay * (0.5 + Math.random() * 0.5));
        }
      }
    } else if (eventType === 'link_addition') {
      const { from, to } = eventData;
      if (this.nodes.has(from)) {
        this.scheduleRoutingUpdate(from, this.updatePropagationDelay * 0.1);
      }
      if (this.nodes.has(to)) {
        this.scheduleRoutingUpdate(to, this.updatePropagationDelay * 0.1);
      }
    }

    this.runConvergenceSimulation();
  }

  private scheduleRoutingUpdate(nodeId: string, delay: number): void {
    const existingEvent = this.eventQueue.find(event => 
      event.type === 'routing_update' && event.data.nodeId === nodeId
    );
    
    if (!existingEvent) {
      this.eventQueue.push({
        timestamp: this.currentTime + delay,
        type: 'routing_update',
        data: { nodeId }
      });
    }
  }

  private async runConvergenceSimulation(): Promise<void> {
    const startTime = Date.now();
    
    while (this.isConverging && (Date.now() - startTime) < this.maxConvergenceTime) {
      this.eventQueue.sort((a, b) => a.timestamp - b.timestamp);
      
      if (this.eventQueue.length === 0) {
        break;
      }

      const event = this.eventQueue.shift()!;
      this.currentTime = event.timestamp;

      if (event.type === 'routing_update') {
        await this.processRoutingUpdate(event.data.nodeId);
      }

      if (Math.random() < 0.3) {
        await this.checkConvergence();
      }

      await this.sleep(200);
    }

    console.log(`Network converged after ${(Date.now() - startTime)}ms simulation time`);
    this.isConverging = false;
    
    this.updateAllRoutingTablesInstantly();
  }

  private async processRoutingUpdate(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    if (this.updatedNodesInCycle.has(nodeId)) {
      return;
    }

    console.log(`Node "${nodeId}" recalculating routing table...`);
    
    this.updatedNodesInCycle.add(nodeId);
    
    this.updateNodeRoutingTable(nodeId);
    
    for (const neighborId of node.neighbors.keys()) {
      if (this.nodes.has(neighborId) && !this.updatedNodesInCycle.has(neighborId)) {
        const delay = this.updatePropagationDelay * (0.5 + Math.random() * 0.5);
        this.scheduleRoutingUpdate(neighborId, delay);
      }
    }
  }

  private updateNodeRoutingTable(sourceId: string): void {
    const dijkstraResult = dijkstra(this.nodes, sourceId);
    const routingTable: RoutingTable = new Map();

    for (const [destinationId, { distance, previous }] of dijkstraResult) {
      if (destinationId !== sourceId && distance !== Infinity) {
        let nextHop = destinationId;
        let current = destinationId;
        
        while (previous !== null && dijkstraResult.get(current)?.previous !== sourceId) {
          current = dijkstraResult.get(current)!.previous!;
          nextHop = current;
        }

        if (dijkstraResult.get(current)?.previous === sourceId) {
          nextHop = current;
        }

        routingTable.set(destinationId, {
          destination: destinationId,
          nextHop,
          distance,
        });
      }
    }

    const node = this.nodes.get(sourceId)!;
    node.updateRoutingTable(routingTable);
  }

  private async checkConvergence(): Promise<void> {
    const allNodesUpdated = this.updatedNodesInCycle.size === this.nodes.size;
    
    if (allNodesUpdated || this.eventQueue.length === 0) {
      this.isConverging = false;
    }
  }

  private updateAllRoutingTablesInstantly(): void {
    for (const sourceId of this.nodes.keys()) {
      this.updateNodeRoutingTable(sourceId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateAllRoutingTables(): void {
    if (!this.isConverging) {
      this.updateAllRoutingTablesInstantly();
    }
  }

  public isNetworkConverging(): boolean {
    return this.isConverging;
  }

  sendMessage(from: string, to: string, content: string): Message | null {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (!fromNode || !toNode) {
      return null;
    }

    if (from === to) {
      return {
        content,
        from,
        to,
        path: [from],
      };
    }

    const path = this.getPath(from, to);
    if (path.length === 0) {
      return null;
    }

    return {
      content,
      from,
      to,
      path,
    };
  }

  private getPath(from: string, to: string): string[] {
    const dijkstraResult = dijkstra(this.nodes, from);
    const result = dijkstraResult.get(to);
    
    if (!result || result.distance === Infinity) {
      return [];
    }

    const path: string[] = [];
    let current: string | null = to;

    while (current !== null) {
      path.unshift(current);
      current = dijkstraResult.get(current)?.previous || null;
    }

    return path;
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getLinks(): Link[] {
    const links: Link[] = [];
    const processed = new Set<string>();

    for (const linkKey of this.links) {
      const [from, to] = linkKey.split('-');
      const reverseKey = `${to}-${from}`;
      
      if (!processed.has(linkKey) && !processed.has(reverseKey)) {
        const fromNode = this.nodes.get(from);
        if (fromNode) {
          const weight = fromNode.neighbors.get(to);
          if (weight !== undefined) {
            links.push({ from, to, weight });
            processed.add(linkKey);
            processed.add(reverseKey);
          }
        }
      }
    }

    return links;
  }

  displayNetwork(): string {
    let output = '\n=== NETWORK STATUS ===\n\n';
    
    output += 'NODES:\n';
    const nodes = this.getNodes();
    if (nodes.length === 0) {
      output += '  No nodes in the network\n';
    } else {
      nodes.forEach(node => {
        output += `  ${node.toString()}\n`;
      });
    }

    output += '\nLINKS:\n';
    const links = this.getLinks();
    if (links.length === 0) {
      output += '  No links in the network\n';
    } else {
      links.forEach(link => {
        output += `  ${link.from} <--${link.weight}--> ${link.to}\n`;
      });
    }

    output += '\nROUTING TABLES:\n';
    nodes.forEach(node => {
      output += `\n  Node ${node.id}:\n`;
      if (node.routingTable.size === 0) {
        output += '    No routes available\n';
      } else {
        output += '    Destination -> Next Hop (Distance)\n';
        for (const [dest, entry] of node.routingTable) {
          output += `    ${dest} -> ${entry.nextHop} (${entry.distance})\n`;
        }
      }
    });

    output += '\n';
    return output;
  }
} 