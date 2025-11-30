import { Framework } from './src/framework';

// Import the Task entity definition (this registers it)
import './src/examples/simple-entity';

// Create and start the framework
const app = new Framework({
  dbPath: './data.db',
  port: 3000,
});

await app.initialize();
await app.start();
