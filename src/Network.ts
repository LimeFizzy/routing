import { dijkstra } from './dijkstra';
import { Node } from './Node';
import { Link, Message, RoutingTable } from './types';

export class Network {
  private nodes: Map<string, Node>;
  private links: Set<string>;

  constructor() {
    this.nodes = new Map();
    this.links = new Set();
  }

  addNode(nodeId: string): boolean {
    if (this.nodes.has(nodeId)) {
      return false;
    }
    this.nodes.set(nodeId, new Node(nodeId));
    this.updateAllRoutingTables();
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
      this.removeLink(from, to);
    });

    this.nodes.delete(nodeId);
    this.updateAllRoutingTables();
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

    this.updateAllRoutingTables();
    return true;
  }

  removeLink(from: string, to: string): boolean {
    const linkKey = `${from}-${to}`;
    const reverseLinkKey = `${to}-${from}`;

    if (!this.links.has(linkKey)) {
      return false;
    }

    this.links.delete(linkKey);
    this.links.delete(reverseLinkKey);

    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (fromNode) fromNode.removeNeighbor(to);
    if (toNode) toNode.removeNeighbor(from);

    this.updateAllRoutingTables();
    return true;
  }

  private updateAllRoutingTables(): void {
    for (const sourceId of this.nodes.keys()) {
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