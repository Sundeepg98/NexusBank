const { withSession } = require('../config/neo4j');

const getBeneficiaries = async (req, res) => {
  try {
    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_BENEFICIARY]->(b:Beneficiary)
         RETURN b ORDER BY b.createdAt DESC`,
        { userId: req.user.userId }
      )
    );

    const beneficiaries = result.records.map(r => {
      const props = r.get('b').properties;
      return {
        id: props.id,
        accountNumber: props.accountNumber,
        nickname: props.nickname,
        bankName: props.bankName,
        createdAt: props.createdAt ? props.createdAt.toString() : null
      };
    });

    res.json({ beneficiaries });
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    res.status(500).json({ error: 'Failed to get beneficiaries' });
  }
};

const addBeneficiary = async (req, res) => {
  try {
    const { accountNumber, nickname, bankName } = req.body;

    if (!accountNumber || !nickname || !bankName) {
      return res.status(400).json({ error: 'accountNumber, nickname, and bankName are required' });
    }

    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         CREATE (b:Beneficiary {
           id: randomUUID(),
           accountNumber: $accountNumber,
           nickname: $nickname,
           bankName: $bankName,
           createdAt: datetime()
         })
         CREATE (u)-[:HAS_BENEFICIARY]->(b)
         RETURN b`,
        { userId: req.user.userId, accountNumber, nickname, bankName }
      )
    );

    if (result.records.length === 0) {
      return res.status(500).json({ error: 'Failed to add beneficiary' });
    }

    const beneficiary = result.records[0].get('b').properties;
    res.status(201).json({
      message: 'Beneficiary added',
      beneficiary: {
        id: beneficiary.id,
        accountNumber: beneficiary.accountNumber,
        nickname: beneficiary.nickname,
        bankName: beneficiary.bankName,
        createdAt: beneficiary.createdAt ? beneficiary.createdAt.toString() : null
      }
    });
  } catch (error) {
    console.error('Add beneficiary error:', error);
    res.status(500).json({ error: 'Failed to add beneficiary' });
  }
};

const deleteBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;

    await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_BENEFICIARY]->(b:Beneficiary {id: $id})
         DETACH DELETE b`,
        { userId: req.user.userId, id }
      )
    );

    res.json({ message: 'Beneficiary removed' });
  } catch (error) {
    console.error('Delete beneficiary error:', error);
    res.status(500).json({ error: 'Failed to remove beneficiary' });
  }
};

module.exports = { getBeneficiaries, addBeneficiary, deleteBeneficiary };
