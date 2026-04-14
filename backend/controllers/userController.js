const { withSession } = require('../config/neo4j');

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.user; // from auth middleware
    
    // Delete all user's accounts first
    await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account)
         DETACH DELETE a`,
        { userId }
      )
    );
    
    // Delete user's beneficiaries
    await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_BENEFICIARY]->(b:Beneficiary)
         DETACH DELETE b`,
        { userId }
      )
    );
    
    // Delete user
    await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         DETACH DELETE u`,
        { userId }
      )
    );
    
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = { deleteUser };
