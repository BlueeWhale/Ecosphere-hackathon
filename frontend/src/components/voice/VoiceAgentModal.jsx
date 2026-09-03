import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  BrainCircuit,
  Radio,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { voiceAPI } from '../../services/api';

const CALL_STATES = {
  OFFLINE: 'OFFLINE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING',
  ENDED: 'ENDED',
};

export function VoiceAgentModal({ dealId, dealCompany, onClose, onDealStateUpdated }) {
  const [callState, setCallState] = useState(CALL_STATES.CONNECTING);
  const [voiceMode, setVoiceMode] = useState('CONNECTING');
  const [isMuted, setIsMuted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [agentSessionId, setAgentSessionId] = useState(null);
  const [channelName, setChannelName] = useState('');
  const [customerUid, setCustomerUid] = useState(null);
  const [agentUid, setAgentUid] = useState(999999);
  const [remoteAudioActive, setRemoteAudioActive] = useState(false);
  const [transcriptTurns, setTranscriptTurns] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualUtterance, setManualUtterance] = useState('');

  const customerClientRef = useRef(null);
  const customerAudioTrackRef = useRef(null);
  const remoteAgentTrackRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptTurns, interimText]);

  // Duration Timer
  useEffect(() => {
    if (callState !== CALL_STATES.OFFLINE && callState !== CALL_STATES.CONNECTING && callState !== CALL_STATES.ENDED) {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // Initialize SINGLE Customer Client & Listen to Remote Agora AI Agent (UID 999999)
  useEffect(() => {
    let isCancelled = false;

    async function startGenuineAgoraVoiceCall() {
      try {
        setCallState(CALL_STATES.CONNECTING);
        setErrorMessage('');

        // 1. Request voice session from backend (Triggers Agora Conversational AI REST API v2 on server)
        const sessionRes = await voiceAPI.createSession(dealId);
        if (!sessionRes.data?.success) {
          throw new Error(sessionRes.data?.message || 'Failed to create voice session');
        }

        const {
          sessionId: sId,
          channelName: cName,
          appId,
          customer,
          agent,
          isMock,
        } = sessionRes.data.data;

        if (isCancelled) return;

        setSessionId(sId);
        setAgentSessionId(agent?.agentSessionId);
        setChannelName(cName);
        setCustomerUid(customer?.uid);
        setAgentUid(agent?.uid || 999999);

        // 2. Initialize SINGLE Customer Client in Browser
        const customerClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        customerClientRef.current = customerClient;

        // Customer subscribes to incoming remote audio track from Remote Agent (UID 999999)
        customerClient.on('user-published', async (user, mediaType) => {
          if (mediaType === 'audio') {
            try {
              const remoteTrack = await customerClient.subscribe(user, mediaType);
              remoteAgentTrackRef.current = remoteTrack;
              remoteTrack.play();
              setRemoteAudioActive(true);
              setCallState(CALL_STATES.SPEAKING);
            } catch (subErr) {
              console.warn('[Agora RTC Remote Audio Subscribe Notice]:', subErr);
            }
          }
        });

        customerClient.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'audio') {
            setRemoteAudioActive(false);
            setCallState(CALL_STATES.LISTENING);
          }
        });

        if (!isMock && appId && !appId.includes('demo_')) {
          // Join Customer Client to Agora Channel and publish microphone
          await customerClient.join(appId, cName, customer.token, customer.uid);
          const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
          customerAudioTrackRef.current = micTrack;
          await customerClient.publish([micTrack]);
          setVoiceMode('REMOTE_AGORA_AI');
        } else {
          console.log('[Agora Dev Mode]: Single customer client active. Remote cloud agent simulated.');
          setVoiceMode('DEV_FALLBACK');
        }

        if (isCancelled) return;
        setCallState(CALL_STATES.LISTENING);

        // Initial Greeting
        setTranscriptTurns([
          {
            speaker: 'agent',
            text: `Hello! I'm your DealPilot AI sales partner. I'm reviewing the active requirements for ${dealCompany || 'your team'}. How can I assist with your deployment scope or pricing today?`,
            timestamp: new Date(),
          },
        ]);

        // 3. Initialize Speech-to-Text
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let interim = '';
            // Client-side barge-in interruption handler
            if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
              window.speechSynthesis.cancel();
            }
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                setInterimText('');
                handleFinalTranscript(transcript, sId);
              } else {
                interim += transcript;
              }
            }
            if (interim) {
              setInterimText(interim);
              setCallState(CALL_STATES.LISTENING);
            }
          };

          recognition.onerror = (err) => {
            console.warn('[STT Warning]: SpeechRecognition error:', err.error);
          };

          recognition.onend = () => {
            if (customerClientRef.current && callState !== CALL_STATES.ENDED) {
              try {
                recognition.start();
              } catch (_) {}
            }
          };

          try {
            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            console.warn('[STT Notice]: SpeechRecognition auto-start blocked:', e);
          }
        }
      } catch (err) {
        console.error('Failed to start genuine remote Agora voice call:', err);
        setErrorMessage(err.message || 'Unable to establish Agora voice connection.');
        setCallState(CALL_STATES.ENDED);
      }
    }

    startGenuineAgoraVoiceCall();

    return () => {
      isCancelled = true;
      cleanupCall();
    };
  }, [dealId]);

  // Clean up single customer audio track and client connection
  const cleanupCall = async () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (customerAudioTrackRef.current) {
        customerAudioTrackRef.current.close();
        customerAudioTrackRef.current = null;
      }
      if (customerClientRef.current) {
        await customerClientRef.current.leave();
        customerClientRef.current = null;
      }
    } catch (err) {
      console.warn('Error during voice cleanup:', err);
    }
  };

  // Process finalized customer speech turn
  const handleFinalTranscript = async (customerText, activeSessionId = sessionId) => {
    if (!customerText || !customerText.trim()) return;

    // Add customer turn to transcript UI
    const customerTurn = {
      speaker: 'customer',
      text: customerText.trim(),
      timestamp: new Date(),
    };
    setTranscriptTurns((prev) => [...prev, customerTurn]);
    setCallState(CALL_STATES.THINKING);

    try {
      // Send customer transcript to DealPilot AI Brain
      const res = await voiceAPI.processTranscript({
        dealId,
        sessionId: activeSessionId,
        transcript: customerText.trim(),
      });

      if (res.data?.success) {
        const { response: agentText, analysis, dealState } = res.data.data;
        setLastAnalysis(analysis);

        // Add agent response to transcript UI
        const agentTurn = {
          speaker: 'agent',
          text: agentText,
          intent: analysis?.intent,
          timestamp: new Date(),
        };
        setTranscriptTurns((prev) => [...prev, agentTurn]);

        // Refresh Deal State in parent page
        if (onDealStateUpdated && dealState) {
          onDealStateUpdated(dealState);
        }

        // If local dev fallback mode, play audio synthesized speech
        if (voiceMode === 'DEV_FALLBACK') {
          playDevFallbackSpeech(agentText);
        }
      }
    } catch (err) {
      console.error('Error processing voice turn:', err);
      setCallState(CALL_STATES.LISTENING);
    }
  };

  // Local Dev Fallback: Browser SpeechSynthesis
  const playDevFallbackSpeech = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.onstart = () => setCallState(CALL_STATES.SPEAKING);
      utterance.onend = () => setCallState(CALL_STATES.LISTENING);
      utterance.onerror = () => setCallState(CALL_STATES.LISTENING);
      window.speechSynthesis.speak(utterance);
    } else {
      setCallState(CALL_STATES.LISTENING);
    }
  };

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    if (customerAudioTrackRef.current) {
      const nextState = !isMuted;
      customerAudioTrackRef.current.setEnabled(!nextState);
      setIsMuted(nextState);
    } else {
      setIsMuted(!isMuted);
    }
  };

  // End Call Handler
  const handleEndCall = async () => {
    setCallState(CALL_STATES.ENDED);
    await cleanupCall();

    if (sessionId) {
      try {
        await voiceAPI.endSession({
          sessionId,
          agentSessionId,
          duration: durationSeconds,
        });
      } catch (err) {
        console.warn('Error reporting session end:', err);
      }
    }
  };

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full ${
                  callState === CALL_STATES.CONNECTED ||
                  callState === CALL_STATES.LISTENING ||
                  callState === CALL_STATES.THINKING ||
                  callState === CALL_STATES.SPEAKING
                    ? 'bg-emerald-400'
                    : callState === CALL_STATES.CONNECTING
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>DealPilot Voice Agent</span>
                {voiceMode === 'REMOTE_AGORA_AI' ? (
                  <Badge variant="success" className="text-[10px] flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> REMOTE AGORA AI AGENT (UID 999999)
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px] flex items-center gap-1">
                    <Server className="w-2.5 h-2.5" /> LOCAL DEV FALLBACK
                  </Badge>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Channel: {channelName || 'Connecting...'} • Customer UID: {customerUid || '...'} • Remote Agent UID: {agentUid || 999999}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime(durationSeconds)}</span>
            </div>
          </div>
        </div>

        {/* State Banner with Audio Activity Indicator */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-slate-400">Call State:</span>
            <span
              className={`font-semibold uppercase ${
                callState === CALL_STATES.SPEAKING
                  ? 'text-purple-400'
                  : callState === CALL_STATES.THINKING
                  ? 'text-amber-400'
                  : callState === CALL_STATES.LISTENING
                  ? 'text-emerald-400'
                  : 'text-slate-200'
              }`}
            >
              {callState}
            </span>
            {remoteAudioActive && (
              <span className="text-emerald-400 text-[10px] ml-2 flex items-center gap-1 font-semibold">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" /> Subscribed Remote Audio Stream (UID 999999)
              </span>
            )}
          </div>

          {lastAnalysis && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                Intent: {lastAnalysis.intent}
              </Badge>
              {lastAnalysis.objections?.length > 0 && (
                <Badge variant="danger" className="text-[10px]">
                  {lastAnalysis.objections[0].type} Objection
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Live Scrolling Transcript Window */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[260px] text-xs">
          {transcriptTurns.map((turn, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${turn.speaker === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              {turn.speaker === 'agent' && (
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  turn.speaker === 'customer'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75">
                  <span className="font-semibold uppercase tracking-wider">
                    {turn.speaker === 'customer' ? 'Customer' : 'Remote Agora AI Agent (UID 999999)'}
                  </span>
                  <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="leading-relaxed">{turn.text}</p>
              </div>
            </div>
          ))}

          {/* Interim Real-time Customer Utterance Preview */}
          {interimText && (
            <div className="flex justify-end">
              <div className="max-w-[80%] p-3 rounded-2xl bg-blue-600/40 border border-blue-500/40 text-blue-100 rounded-br-none italic">
                <span className="text-[10px] block opacity-75">Speaking into mic...</span>
                <p>{interimText}</p>
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 mx-4 mb-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Voice / Text Simulator Input */}
        <div className="p-3 bg-slate-950/30 border-t border-slate-800/80 flex gap-2">
          <input
            type="text"
            value={manualUtterance}
            onChange={(e) => setManualUtterance(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualUtterance.trim()) {
                handleFinalTranscript(manualUtterance);
                setManualUtterance('');
              }
            }}
            placeholder="Speak into microphone or enter statement..."
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => {
              if (manualUtterance.trim()) {
                handleFinalTranscript(manualUtterance);
                setManualUtterance('');
              }
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Send Speech
          </button>
        </div>

        {/* Call Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`p-3 rounded-xl border transition-colors ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {callState !== CALL_STATES.ENDED ? (
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/20"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Close Window</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceAgentModal;
