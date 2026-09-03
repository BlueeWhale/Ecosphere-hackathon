import axios from 'axios';

/**
 * Validates Agora Customer REST API Developer Credentials.
 */
export function validateAgoraRestConfig() {
  const appId = process.env.AGORA_APP_ID;
  const customerId = process.env.AGORA_CUSTOMER_ID;
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

  const isConfigured = Boolean(
    appId &&
    customerId &&
    customerSecret &&
    !appId.includes('your_') &&
    !customerId.includes('your_') &&
    !customerSecret.includes('your_')
  );

  return {
    isConfigured,
    appId: appId || '',
    customerId: customerId || '',
    customerSecret: customerSecret || '',
  };
}

/**
 * Sends REST request to Agora Conversational AI REST API v2 to provision a remote cloud worker (UID: 999999).
 */
export async function startRemoteAgent({
  channelName,
  customerUid,
  agentUid = 999999,
  agentToken,
  dealId,
  hostUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000',
}) {
  const { isConfigured, appId, customerId, customerSecret } = validateAgoraRestConfig();

  if (!isConfigured) {
    console.log('[Agora Cloud Agent]: Live Customer REST credentials not configured. Using local dev-session state.');
    return {
      agentSessionId: `mock_agent_session_${dealId}_${Date.now()}`,
      isMock: true,
      agentUid,
    };
  }

  const authHeader = 'Basic ' + Buffer.from(`${customerId}:${customerSecret}`).toString('base64');
  const endpoint = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/start`;

  const payload = {
    name: `dealpilot_agent_${dealId}`,
    properties: {
      channel_name: channelName,
      agent_rtc_uid: String(agentUid),
      agent_rtc_token: agentToken,
      remote_rtc_uids: [String(customerUid)],
      turn_detection: {
        mode: 'server_vad',
        speech_interrupt: true,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      llm: {
        url: `${hostUrl}/api/voice/agent-llm`,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      },
      asr: {
        language: 'en-US',
      },
      tts: {
        vendor: 'microsoft',
      },
    },
  };

  try {
    const res = await axios.post(endpoint, payload, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return {
      agentSessionId: res.data?.agent_session_id || res.data?.id || `agent_session_${Date.now()}`,
      isMock: false,
      agentUid,
    };
  } catch (err) {
    console.warn('[Agora Cloud Agent Error]: Failed to start remote cloud agent via REST API.', err.message);
    return {
      agentSessionId: `mock_agent_session_${dealId}_${Date.now()}`,
      isMock: true,
      agentUid,
      error: err.message,
    };
  }
}

/**
 * Sends REST request to Agora Conversational AI REST API v2 to terminate the remote agent cloud worker.
 */
export async function stopRemoteAgent({ agentSessionId }) {
  const { isConfigured, appId, customerId, customerSecret } = validateAgoraRestConfig();

  if (!isConfigured || !agentSessionId || agentSessionId.startsWith('mock_')) {
    return { success: true, isMock: true };
  }

  const authHeader = 'Basic ' + Buffer.from(`${customerId}:${customerSecret}`).toString('base64');
  const endpoint = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/stop`;

  try {
    await axios.post(
      endpoint,
      { agent_session_id: agentSessionId },
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );
    return { success: true, isMock: false };
  } catch (err) {
    console.warn('[Agora Cloud Agent Warning]: Error stopping remote cloud agent.', err.message);
    return { success: false, error: err.message };
  }
}
