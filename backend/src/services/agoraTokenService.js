import agoraToken from 'agora-token';

const { RtcTokenBuilder, RtcRole } = agoraToken.default || agoraToken;

/**
 * Validates whether live Agora credentials are configured.
 */
export function validateAgoraConfig() {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  const isConfigured = Boolean(
    appId &&
    appCertificate &&
    !appId.includes('your_agora_app_id') &&
    !appCertificate.includes('your_agora_app_certificate')
  );

  return {
    isConfigured,
    appId: appId || '',
    hasCertificate: Boolean(appCertificate),
  };
}

/**
 * Generates short-lived Agora RTC tokens for voice channels.
 * Never leaks the AGORA_APP_CERTIFICATE to the client.
 */
export function generateRtcToken({
  channelName,
  uid,
  role = 'publisher',
  expirySeconds = Number(process.env.AGORA_TOKEN_EXPIRY) || 3600,
}) {
  if (!channelName || typeof channelName !== 'string') {
    const error = new Error('channelName is required to generate Agora token');
    error.statusCode = 400;
    throw error;
  }

  const numericUid = Number(uid) || Math.floor(100000 + Math.random() * 900000);
  const { isConfigured, appId } = validateAgoraConfig();
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!isConfigured) {
    // Development fallback token when live Agora credentials are not set
    return {
      token: `dev_mock_rtc_token_${channelName}_${numericUid}_${Date.now()}`,
      appId: appId || 'demo_dealpilot_agora_app_id',
      uid: numericUid,
      channelName,
      isMock: true,
      expiresInSeconds: expirySeconds,
    };
  }

  const agoraRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirySeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    numericUid,
    agoraRole,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return {
    token,
    appId,
    uid: numericUid,
    channelName,
    isMock: false,
    expiresInSeconds: expirySeconds,
  };
}

/**
 * Generates dual Agora RTC tokens for both Customer and the DealPilot AI Agent participant.
 */
export function generateSessionTokens({
  channelName,
  customerUid,
  agentUid = 999999,
  expirySeconds = Number(process.env.AGORA_TOKEN_EXPIRY) || 3600,
}) {
  const customerTokenResult = generateRtcToken({
    channelName,
    uid: customerUid,
    role: 'publisher',
    expirySeconds,
  });

  const agentTokenResult = generateRtcToken({
    channelName,
    uid: agentUid,
    role: 'publisher',
    expirySeconds,
  });

  return {
    channelName,
    appId: customerTokenResult.appId,
    isMock: customerTokenResult.isMock,
    expiresInSeconds: expirySeconds,
    customer: {
      uid: customerTokenResult.uid,
      token: customerTokenResult.token,
    },
    agent: {
      uid: agentTokenResult.uid,
      token: agentTokenResult.token,
      name: 'DealPilot AI Voice Agent',
    },
  };
}
