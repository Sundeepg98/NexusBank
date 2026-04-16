const crypto = require('crypto');
const { withSession } = require('./neo4j');
const logger = require('./logger');

const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  MOCK: 'mock'
};

const PURPOSES = {
  OTP_VERIFY: 'otp_verify',
  OTP_TRANSFER: 'otp_transfer',
  LOGIN_ALERT: 'login_alert',
  TRANSFER_COMPLETE: 'transfer_complete',
  PASSWORD_CHANGED: 'password_changed'
};

const sendNotification = async (channel, purpose, userData = {}, customMessage = '') => {
  const id = crypto.randomUUID();

  const notification = {
    id,
    channel,
    purpose,
    userId: userData.userId || null,
    email: userData.email || null,
    phone: userData.phone || null,
    message: customMessage,
    status: 'sent',
    createdAt: Date.now()
  };

  const logMsg = `[NOTIFICATION] channel=${channel} purpose=${purpose} user=${userData.email || userData.userId || 'unknown'}`;
  if (process.env.NODE_ENV === 'test') {
    console.log(logMsg);
  } else {
    logger.info(logMsg, { notificationId: id });
  }

  try {
    await withSession(session =>
      session.run(
        `CREATE (n:Notification {
          id: $id,
          channel: $channel,
          purpose: $purpose,
          userId: $userId,
          email: $email,
          phone: $phone,
          message: $message,
          status: $status,
          createdAt: datetime()
        })`,
        notification
      )
    );
  } catch (error) {
    logger.error('Failed to store notification', { error: error.message, notification });
  }

  return { success: true, notificationId: id };
};

const sendOTPNotification = async (channel, metadata = {}) => {
  return sendNotification(
    channel || CHANNELS.MOCK,
    PURPOSES.OTP_VERIFY,
    {
      userId: metadata.userId,
      email: metadata.email,
      phone: metadata.phone
    },
    `OTP for ${metadata.purpose || 'verification'}`
  );
};

module.exports = {
  sendNotification,
  sendOTPNotification,
  CHANNELS,
  PURPOSES
};
