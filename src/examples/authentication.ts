/**
 * Example: Basic Authentication
 * 
 * This example demonstrates how to add authentication to your Matte.js application.
 * Users can register, login, and logout. Authenticated users' usernames are automatically
 * attached to entities they create (for ownedEntity types).
 */

import { Matte, ownedEntity, string, richtext } from '../framework';

// Define an entity that tracks ownership
const Note = ownedEntity('Note', [
  string('title').required().label('Title'),
  richtext('content').label('Content'),
]);

// Create the app
const app = new Matte({
  port: 3000,
  dbPath: ':memory:',
});

// Register some test users
app.auth.registerUser('alice', 'password123');
app.auth.registerUser('bob', 'securepass');
app.auth.registerUser('admin', 'admin123');

// Register the entity
app.register(Note);

// Start the server
await app.start();

console.log('✅ Authentication example running on http://localhost:3000');
console.log('');
console.log('👤 Test users:');
console.log('   - alice / password123');
console.log('   - bob / securepass');
console.log('   - admin / admin123');
console.log('');
console.log('📝 Try logging in and creating notes!');
console.log('   Each note will be automatically owned by the logged-in user.');
