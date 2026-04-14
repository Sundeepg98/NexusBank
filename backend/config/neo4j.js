require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const session = driver.session();

const withSession = async (callback) => {
  const s = driver.session();
  try {
    return await callback(s);
  } finally {
    await s.close();
  }
};

module.exports = { driver, session, withSession };
