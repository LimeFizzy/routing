import { createInterface } from 'readline';
import { Network } from './Network';

export class CLI {
  private network: Network;
  private rl: ReturnType<typeof createInterface>;

  constructor() {
    this.network = new Network();
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'routing> '
    });
  }

  start(): void {
    console.log('Routing Protocol Simulator');
    console.log('Type "help" for available commands\n');
    
    this.rl.prompt();
    
    this.rl.on('line', (input: string) => {
      const trimmedInput = input.trim();
      if (trimmedInput) {
        this.processCommand(trimmedInput);
      }
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      process.exit(0);
    });
  }

  private processCommand(input: string): void {
    const parts = input.split(' ').filter(part => part.length > 0);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'add-node':
          this.handleAddNode(args);
          break;
        case 'remove-node':
          this.handleRemoveNode(args);
          break;
        case 'add-link':
          this.handleAddLink(args);
          break;
        case 'remove-link':
          this.handleRemoveLink(args);
          break;
        case 'send-message':
          this.handleSendMessage(args);
          break;
        case 'show':
          this.handleShow();
          break;
        case 'help':
          this.showHelp();
          break;
        case 'exit':
          this.rl.close();
          break;
        default:
          console.log(`❌ Unknown command: ${command}. Type "help" for available commands.`);
      }
    } catch (error) {
      console.log(`❌ Error executing command: ${error}`);
    }
  }

  private handleAddNode(args: string[]): void {
    if (args.length !== 1) {
      console.log('❌ Usage: add-node <node-id>');
      return;
    }

    const nodeId = args[0];
    if (this.network.addNode(nodeId)) {
      console.log(`✅ Node "${nodeId}" added successfully`);
    } else {
      console.log(`❌ Node "${nodeId}" already exists`);
    }
  }

  private handleRemoveNode(args: string[]): void {
    if (args.length !== 1) {
      console.log('❌ Usage: remove-node <node-id>');
      return;
    }

    const nodeId = args[0];
    if (this.network.removeNode(nodeId)) {
      console.log(`✅ Node "${nodeId}" removed successfully`);
    } else {
      console.log(`❌ Node "${nodeId}" does not exist`);
    }
  }

  private handleAddLink(args: string[]): void {
    if (args.length !== 3) {
      console.log('❌ Usage: add-link <from> <to> <weight>');
      return;
    }

    const from = args[0];
    const to = args[1];
    const weight = parseFloat(args[2]);

    if (isNaN(weight) || weight <= 0) {
      console.log('❌ Weight must be a positive number');
      return;
    }

    if (from === to) {
      console.log('❌ Cannot create a link from a node to itself');
      return;
    }

    if (this.network.addLink(from, to, weight)) {
      console.log(`✅ Link "${from}" <--${weight}--> "${to}" added successfully`);
    } else {
      console.log(`❌ Failed to add link. Make sure both nodes exist and the link doesn't already exist.`);
    }
  }

  private handleRemoveLink(args: string[]): void {
    if (args.length !== 2) {
      console.log('❌ Usage: remove-link <from> <to>');
      return;
    }

    const from = args[0];
    const to = args[1];

    if (this.network.removeLink(from, to)) {
      console.log(`✅ Link between "${from}" and "${to}" removed successfully`);
    } else {
      console.log(`❌ Link between "${from}" and "${to}" does not exist`);
    }
  }

  private handleSendMessage(args: string[]): void {
    if (args.length < 3) {
      console.log('❌ Usage: send-message <from> <to> <message>');
      return;
    }

    const from = args[0];
    const to = args[1];
    const message = args.slice(2).join(' ');

    const result = this.network.sendMessage(from, to, message);
    
    if (result) {
      console.log(`Message sent successfully!`);
      console.log(`From: ${result.from}`);
      console.log(`To: ${result.to}`);
      console.log(`Content: "${result.content}"`);
      console.log(`Path: ${result.path.join(' → ')}`);
    } else {
      console.log(`❌ Failed to send message. Check that both nodes exist and are connected.`);
    }
  }

  private handleShow(): void {
    console.log(this.network.displayNetwork());
  }

  private showHelp(): void {
    console.log(`
📋 Available Commands:

  Node Management:
    add-node <node-id>            Add a new node to the network
    remove-node <node-id>         Remove a node from the network

  Link Management:
    add-link <from> <to> <weight> Add a weighted link between two nodes
    remove-link <from> <to>       Remove a link between two nodes

  Messaging:
    send-message <from> <to> <message>  Send a message from one node to another

  Network Information:
    show                          Display all nodes, links, and routing tables

  Utility:
    help                          Show this help message
    exit                          Exit the application
`);
  }
} 