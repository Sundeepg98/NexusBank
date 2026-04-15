const { withSession } = require('./neo4j');

async function setupIndexes() {
  const indexes = [
    { label: 'User', property: 'email', unique: true },
    { label: 'Account', property: 'accountNumber', unique: true },
    { label: 'Beneficiary', property: 'accountNumber', unique: false }
  ];

  for (const index of indexes) {
    try {
      await withSession(session =>
        session.run(
          `CREATE INDEX ${index.label}_${index.property}_index IF NOT EXISTS FOR (n:${index.label}) ON (n.${index.property})`,
          {}
        )
      );
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log(`Index on ${index.label}(${index.property}) already exists`);
      } else {
        console.log(`Index creation warning for ${index.label}(${index.property}):`, e.message);
      }
    }
  }
}

function setupIndexesOnStartup() {
  setupIndexes().catch(console.error);
}

module.exports = { setupIndexes, setupIndexesOnStartup };
