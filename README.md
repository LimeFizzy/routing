# Routing Protocol Simulator

A simple routing protocol visualization using Dijkstra's algorithm, implemented in Node.js with TypeScript.

## Features

- **Dynamic Node Management**: Add and remove network nodes
- **Weighted Link Management**: Create and delete weighted connections between nodes
- **Dijkstra Algorithm**: Automatic shortest path calculation and routing table updates
- **Message Routing**: Send messages between nodes via optimal paths
- **CLI Interface**: Interactive command-line interface for all operations
- **Real-time Updates**: Routing tables are recalculated automatically when topology changes

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the application:
```bash
npm start
```

## Usage

### Available Commands

#### Node Management
- `add-node <node-id>` - Add a new node to the network
- `remove-node <node-id>` - Remove a node from the network

#### Link Management
- `add-link <from> <to> <weight>` - Add a weighted link between two nodes
- `remove-link <from> <to>` - Remove a link between two nodes

#### Messaging
- `send-message <from> <to> <message>` - Send a message from one node to another

#### Network Information
- `show` - Display all nodes, links, and routing tables

#### Utility
- `help` - Show available commands
- `exit` - Exit the application

### Example Session

```bash
routing> add-node A
✅ Node "A" added successfully

routing> add-node B
✅ Node "B" added successfully

routing> add-node C
✅ Node "C" added successfully

routing> add-link A B 5
✅ Link "A" <--5--> "B" added successfully

routing> add-link B C 3
✅ Link "B" <--3--> "C" added successfully

routing> add-link A C 10
✅ Link "A" <--10--> "C" added successfully

routing> show

=== NETWORK STATUS ===

NODES:
  Node A - Neighbors: [B(5), C(10)]
  Node B - Neighbors: [A(5), C(3)]
  Node C - Neighbors: [B(3), A(10)]

LINKS:
  A <--5--> B
  B <--3--> C
  A <--10--> C

ROUTING TABLES:

  Node A:
    Destination -> Next Hop (Distance)
    B -> B (5)
    C -> B (8)

  Node B:
    Destination -> Next Hop (Distance)
    A -> A (5)
    C -> C (3)

  Node C:
    Destination -> Next Hop (Distance)
    B -> B (3)
    A -> B (8)

routing> send-message A C "Hello World!"
Message sent successfully!
From: A
To: C
Content: "Hello World!"
Path: A → B → C
```

## Architecture

### Core Components

- **Node**: Represents network nodes with routing tables and neighbor information
- **Network**: Manages the network topology and implements Dijkstra's algorithm
- **CLI**: Provides an interactive command-line interface
- **Types**: TypeScript type definitions for type safety

### Key Features

1. **Bidirectional Links**: All links are bidirectional with the same weight in both directions
2. **Dynamic Routing**: Routing tables are automatically recalculated when the network topology changes
3. **Shortest Path**: Uses Dijkstra's algorithm to find optimal paths
4. **Error Handling**: Comprehensive error checking and user feedback

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and run the application
- `npm run dev` - Quick build and run for development

### Project Structure

```
src/
├── types.ts     # TypeScript type definitions
├── Node.ts      # Network node implementation
├── Network.ts   # Network management and Dijkstra algorithm
├── CLI.ts       # Command-line interface
└── index.ts     # Main entry point
```

## License

MIT
