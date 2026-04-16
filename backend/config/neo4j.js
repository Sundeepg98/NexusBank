require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
  {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30000,
    maxTransactionRetryTime: 30000,
    initialRetryDelay: 1000,
    retryDelayMultiplier: 2,
    maxRetryDelay: 30000
  }
);

async function verifyConnection() {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('Neo4j connection verified');
  } catch (error) {
    console.error('Neo4j connection failed:', error.message);
    process.exit(1);
  } finally {
    await session.close();
  }
}

const withSession = async (callback) => {
  const s = driver.session();
  try {
    return await callback(s);
  } finally {
    await s.close();
  }
};

const toNumber = (value) => {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }
  return value;
};

module.exports = { driver, withSession, verifyConnection, toNumber };
