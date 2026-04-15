require('dotenv').config();
const { driver } = require('./config/neo4j');

async function main() {
  const session = driver.session();
  try {
    const email = process.argv[2] || 'prove@test.com';
    const userResult = await session.run(
      'MATCH (u:User {email: $email}) RETURN u.id',
      { email }
    );
    if (userResult.records.length === 0) {
      console.log('User not found');
      return;
    }
    const userId = userResult.records[0].get('u.id');

    const otpResult = await session.run(
      'MATCH (o:OTPEntry) WHERE o.userId = $userId RETURN o ORDER BY o.createdAt DESC LIMIT 1',
      { userId }
    );
    if (otpResult.records.length === 0) {
      console.log('No OTP found');
      return;
    }
    const props = otpResult.records[0].get('o').properties;
    console.log('OTP:', props.otp);
    console.log('OTPId:', props.otpId);
  } finally {
    await session.close();
    driver.close();
  }
}

main();