import { Node } from './Node';

export const dijkstra = (nodes: Map<string, Node>, sourceId: string): Map<string, { distance: number; previous: string | null }> => {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const nodeId of nodes.keys()) {
      distances.set(nodeId, nodeId === sourceId ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    while (unvisited.size > 0) {
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (currentNode === null || minDistance === Infinity) {
        break;
      }

      unvisited.delete(currentNode);
      const currentDistance = distances.get(currentNode)!;
      const node = nodes.get(currentNode)!;

      for (const [neighborId, weight] of node.neighbors) {
        if (unvisited.has(neighborId)) {
          const newDistance = currentDistance + weight;
          if (newDistance < distances.get(neighborId)!) {
            distances.set(neighborId, newDistance);
            previous.set(neighborId, currentNode);
          }
        }
      }
    }

    const result = new Map<string, { distance: number; previous: string | null }>();
    for (const nodeId of nodes.keys()) {
      result.set(nodeId, {
        distance: distances.get(nodeId)!,
        previous: previous.get(nodeId)!
      });
    }

    return result;
  }