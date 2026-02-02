/**
 * Test MongoDB Atlas Connection
 * Verifies that the Atlas connection is working properly
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`)
};

async function testConnection() {
  console.log('\n' + '='.repeat(60));
  log.title('🧪 MongoDB Atlas Connection Test');
  console.log('='.repeat(60) + '\n');

  const MONGODB_URI = process.env.MONGODB_URI;

  // Check if URI is configured
  if (!MONGODB_URI) {
    log.error('MONGODB_URI not found in .env file');
    process.exit(1);
  }

  // Check if it's Atlas URI
  if (MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1')) {
    log.warning('Detected local MongoDB URI, not Atlas');
    log.info('Current URI: ' + MONGODB_URI);
    log.info('Update .env with your MongoDB Atlas connection string');
    process.exit(1);
  }

  log.info('Testing connection to MongoDB Atlas...');
  log.info('URI: ' + MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    log.success('Connected to MongoDB Atlas successfully!');

    // Get database stats
    const db = mongoose.connection.db;
    const stats = await db.stats();

    log.title('📊 Database Information');
    console.log(`Database Name: ${colors.bright}${db.databaseName}${colors.reset}`);
    console.log(`Collections: ${colors.bright}${stats.collections}${colors.reset}`);
    console.log(`Data Size: ${colors.bright}${(stats.dataSize / 1024).toFixed(2)} KB${colors.reset}`);
    console.log(`Storage Size: ${colors.bright}${(stats.storageSize / 1024).toFixed(2)} KB${colors.reset}`);
    console.log(`Indexes: ${colors.bright}${stats.indexes}${colors.reset}`);

    // List collections
    const collections = await db.listCollections().toArray();
    
    if (collections.length > 0) {
      log.title('📚 Collections');
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        log.success(`${col.name}: ${count} documents`);
      }
    } else {
      log.warning('No collections found (database is empty)');
    }

    // Test write operation
    log.title('✍️ Testing Write Operation');
    const testCollection = db.collection('connection_test');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'MongoDB Atlas connection test'
    };
    
    const result = await testCollection.insertOne(testDoc);
    log.success('Write test successful! Inserted document ID: ' + result.insertedId);

    // Test read operation
    log.title('👁️ Testing Read Operation');
    const readDoc = await testCollection.findOne({ _id: result.insertedId });
    log.success('Read test successful! Retrieved document');

    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    log.success('Cleanup successful! Deleted test document');

    // Connection details
    log.title('🔗 Connection Details');
    console.log(`Host: ${colors.bright}${mongoose.connection.host}${colors.reset}`);
    console.log(`Port: ${colors.bright}${mongoose.connection.port || 'N/A (SRV)'}${colors.reset}`);
    console.log(`Ready State: ${colors.bright}${mongoose.connection.readyState === 1 ? 'Connected' : 'Unknown'}${colors.reset}`);

    log.title('✅ All Tests Passed!');
    log.success('MongoDB Atlas is configured correctly and ready to use');
    log.info('You can now run: node migrate-to-atlas.js');

  } catch (error) {
    log.error('\n❌ Connection Test Failed!');
    log.error(`Error: ${error.message}`);
    
    if (error.message.includes('authentication')) {
      log.warning('\nPossible causes:');
      log.info('1. Incorrect username or password in connection string');
      log.info('2. Database user not created in Atlas');
      log.info('3. User does not have proper permissions');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      log.warning('\nPossible causes:');
      log.info('1. IP address not whitelisted in Network Access');
      log.info('2. Incorrect cluster URL in connection string');
      log.info('3. Network/firewall blocking connection');
    } else if (error.message.includes('bad auth')) {
      log.warning('\nPossible causes:');
      log.info('1. Password contains special characters that need URL encoding');
      log.info('2. Wrong database name in connection string');
    }

    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log.info('\nConnection closed');
  }

  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

// Run test
testConnection();
