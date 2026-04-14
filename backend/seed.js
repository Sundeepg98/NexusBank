const neo4j = require('neo4j-driver');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function seed() {
  const session = driver.session();
  
  try {
    // Create demo user
    const userResult = await session.run(`
      CREATE (u:User {
        id: randomUUID(),
        username: 'demo',
        email: 'demo@nexusbank.com',
        password: '$2a$10$K4I6JqYqKqKqKqKqKqKqKeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK',
        firstName: 'Demo',
        lastName: 'User',
        phone: '1234567890',
        createdAt: datetime()
      })
      RETURN u
    `);
    const user = userResult.records[0].get('u').properties;
    console.log('✓ Created user:', user.email);
    
    // Create demo account
    const accResult = await session.run(`
      MATCH (u:User {email: 'demo@nexusbank.com'})
      CREATE (a:Account {
        id: randomUUID(),
        accountNumber: '123456789012',
        accountType: 'SAVINGS',
        balance: 50000,
        createdAt: datetime()
      })
      CREATE (u)-[:HAS_ACCOUNT]->(a)
      RETURN a
    `);
    const account = accResult.records[0].get('a').properties;
    console.log('✓ Created account:', account.accountNumber, '- Balance:', account.balance);
    
    // Create second demo account for transfers
    const acc2Result = await session.run(`
      CREATE (u:User {
        id: randomUUID(),
        username: 'alice',
        email: 'alice@nexusbank.com',
        password: '$2a$10$K4I6JqYqKqKqKqKqKqKqKeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK',
        firstName: 'Alice',
        lastName: 'Smith',
        phone: '9876543210',
        createdAt: datetime()
      })
      WITH u
      CREATE (a:Account {
        id: randomUUID(),
        accountNumber: '987654321098',
        accountType: 'SAVINGS',
        balance: 25000,
        createdAt: datetime()
      })
      CREATE (u)-[:HAS_ACCOUNT]->(a)
      RETURN a
    `);
    const account2 = acc2Result.records[0].get('a').properties;
    console.log('✓ Created account:', account2.accountNumber, '- Balance:', account2.balance);
    
    // Create some transactions
    await session.run(`
      MATCH (a:Account {accountNumber: '123456789012'})
      CREATE (t:Transaction {
        id: randomUUID(),
        amount: 1000,
        description: 'Initial deposit',
        timestamp: datetime()
      })
      CREATE (a)-[:RECEIVED]->(t)
    `);
    console.log('✓ Created initial transaction');
    
    console.log('\n✓ Database seeded successfully!');
    console.log('\nDemo accounts:');
    console.log('  - Account 1: 123456789012 (Demo User) - Balance: 50000');
    console.log('  - Account 2: 987654321098 (Alice Smith) - Balance: 25000');
    
  } catch (e) {
    console.log('✗ Error:', e.message);
  }
  
  await session.close();
  await driver.close();
}

seed();
