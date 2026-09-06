import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Upload, FileText, Search, Eye, X, BookOpen, CheckCircle, Radio, Brain, Loader2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { knowledgeAPI } from '../services/api';

const defaultDemoDocs = [
  {
    _id: 'doc-1',
    title: 'Enterprise Pricing Guidelines 2026',
    fileName: 'Enterprise_Pricing_Guidelines_2026.pdf',
    fileType: 'PDF Specification',
    updatedAt: '2026-08-20',
    status: 'processed',
    content: `DEALPILOT ENTERPRISE PRICING GUIDELINES 2026

1. PRODUCT TIERS & SEAT RATES:
- Starter Plan: $49/user/month ($39/user/month billed annually). Minimum 1 seat, maximum 10 seats. Features include standard AI qualification, basic CRM sync, and email follow-ups.
- Growth Plan: $99/user/month ($79/user/month billed annually). Minimum 11 seats, maximum 50 seats. Features include adaptive AI negotiation, RAG knowledge integration, and Google Calendar booking.
- Enterprise Suite: $199/user/month ($159/user/month billed annually). Minimum 51 seats, up to 10,000 seats. Features include real-time voice RTC, custom negotiation rules, and human agent escalation.

2. VOLUME DISCOUNTS & CONCESSION RULES:
- Tiered Volume Discounts: 11-50 users: 5% discount; 51-200 users: 15% discount; 201+ users: 20% discount.
- Maximum Concession Ceiling: Hard limit cap of 25% discount across all plans.
- Policy Approval Requirements: Any discount request exceeding standard tier limits up to 25% is automatically flagged. Any request above 25% requires VP Sales manual approval (policyStatus = REQUIRES_APPROVAL).`,
  },
  {
    _id: 'doc-2',
    title: 'Competitor Comparison Matrix',
    fileName: 'Competitor_Comparison_Matrix.docx',
    fileType: 'Battlecard',
    updatedAt: '2026-08-28',
    status: 'processed',
    content: `DEALPILOT COMPETITOR BATTLECARD & COMPARISON MATRIX

1. DEALPILOT vs SALESFORCE vs HUBSPOT:
- AI Sales Conversations: DealPilot provides real-time voice RTC calls powered by Agora and Gemini 2.5 Flash. Salesforce and HubSpot rely on text-only chat assistants or third-party add-ons.
- Real-Time Negotiation Guardrails: DealPilot enforces deterministic pricing rules with a 25% maximum discount cap and automatic VP approval routing. Salesforce requires complex CPQ workflows.
- Persistent Deal Memory: DealPilot maintains a structured source-of-truth state for requirements (e.g. 50 -> 200 users), competitor tags, and objections after every voice turn.
- Next Best Action & Scoring: DealPilot computes a 0-100 rubric deal score and actionable next-best-action guidance in real time.`,
  },
  {
    _id: 'doc-3',
    title: 'Security & SLA Compliance FAQ',
    fileName: 'Security_SLA_Compliance_FAQ.pdf',
    fileType: 'Compliance',
    updatedAt: '2026-08-15',
    status: 'processed',
    content: `DEALPILOT ENTERPRISE SECURITY & SLA COMPLIANCE FAQ

1. DATA HANDLING & PRIVACY:
- All communications are encrypted in transit via TLS 1.3 and at rest using AES-256. Customer conversation transcripts and deal state memory are isolated per enterprise tenant.

2. AUTHENTICATION & ACCESS CONTROL:
- Enterprise sessions use JWT token authorization with role-based access control (RBAC). For hackathon demonstrations, a configurable DEMO_MODE toggle allows seamless evaluation.

3. AUDITABILITY & GOVERNANCE:
- All pricing concessions, policy status changes (APPROVED vs REQUIRES_APPROVAL), and human escalation events are immutably logged with timestamps and user IDs.

4. AVAILABILITY & SLA:
- DealPilot guarantees 99.9% platform availability for real-time Agora voice streams and backend intelligence services.

5. HUMAN ESCALATION PROTOCOL:
- Automated routing to human sales representatives occurs when concession limits are exceeded or explicit human assistance is requested.`,
  },
  {
    _id: 'doc-4',
    title: 'DealPilot Product Overview',
    fileName: 'DealPilot_Product_Overview.pdf',
    fileType: 'Product Specification',
    updatedAt: '2026-08-30',
    status: 'processed',
    content: `DEALPILOT PLATFORM PRODUCT OVERVIEW

1. CORE CAPABILITIES:
- DealPilot converts text and voice conversations into dynamic sales intelligence and automated commercial actions.
- Real-Time Voice Agent: Agora Cloud Conversational AI REST Engine v2 + Microsoft Neural TTS.
- Gemini 2.5 Flash Strategist: Analyzes customer intent, extracts user seat scope (e.g. 50 -> 200 users), identifies competitors (e.g. Salesforce), and records commercial objections.
- Deal Memory & Rubric Scoring: Maintains source-of-truth state, calculates a 0-100 rubric deal score across 6 weighted categories, and recommends Next Best Actions.
- Pricing Guard & Action Router: Enforces discount ceilings (25% max) and automates Google Calendar demo booking.`,
  },
  {
    _id: 'doc-5',
    title: 'DealPilot Sales FAQ',
    fileName: 'DealPilot_Sales_FAQ.docx',
    fileType: 'FAQ',
    updatedAt: '2026-09-01',
    status: 'processed',
    content: `DEALPILOT FREQUENTLY ASKED SALES QUESTIONS

Q1: What is DealPilot?
A: DealPilot is an adaptive AI sales agent that conducts real-time voice qualification calls, enforces pricing negotiation guardrails, and books product demos automatically.

Q2: How does the voice agent work?
A: Customer speaks into browser microphone -> Agora RTC -> STT -> Gemini 2.5 Flash -> Deal Memory / Pricing Engine -> Response -> Agora RTC -> Customer speaker.

Q3: How does DealPilot remember customer requirements?
A: Extracted parameters (user count, budget, features) are merged into MongoDB Deal Memory after every voice turn.

Q4: How does pricing negotiation work?
A: Backend Pricing Engine evaluates quotes against official catalog tiers. Discounts are capped at 25%, and requests >25% trigger approval routing.

Q5: Can it handle competitors and schedule demos?
A: Yes, identifies competitor mentions (e.g. Salesforce) and schedules confirmed Google Calendar appointments.`,
  },
];

function getStatusBadge(status, chunkCount) {
  if (status === 'processing') {
    return (
      <Badge variant="purple">
        <Loader2 className="w-3 h-3 mr-1 inline animate-spin" />
        Indexing
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge variant="danger">
        <XCircle className="w-3 h-3 mr-1 inline" />
        Failed
      </Badge>
    );
  }
  if (status === 'processed') {
    if (!chunkCount || chunkCount === 0) {
      return (
        <Badge variant="warning">
          <AlertTriangle className="w-3 h-3 mr-1 inline" />
          No Chunks
        </Badge>
      );
    }
    return (
      <Badge variant="success">
        <CheckCircle className="w-3 h-3 mr-1 inline" />
        Indexed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock className="w-3 h-3 mr-1 inline" />
      Pending
    </Badge>
  );
}

function formatLastIndexed(doc) {
  const ts = doc.lastIndexedAt || doc.updatedAt;
  if (!ts) return 'Never';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return 'Never';
  return d.toISOString().split('T')[0];
}

export function KnowledgeBase() {
  const [docs, setDocs] = useState(defaultDemoDocs);
  const [searchTerm, setSearchTerm] = useState('');
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [semanticResults, setSemanticResults] = useState([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('PDF Specification');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!useSemanticSearch) {
      setSemanticResults([]);
      return;
    }
    if (!searchTerm || !searchTerm.trim()) {
      setSemanticResults([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setSemanticLoading(true);
      try {
        const res = await knowledgeAPI.searchDocs({ query: searchTerm.trim() });
        if (!cancelled && res.data?.success) {
          setSemanticResults(res.data.data?.results || []);
        }
      } catch (err) {
        if (!cancelled) setSemanticResults([]);
      } finally {
        if (!cancelled) setSemanticLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchTerm, useSemanticSearch]);

  useEffect(() => {
    async function fetchDocs() {
      try {
        setLoading(true);
        const res = await knowledgeAPI.getDocs();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setDocs(res.data.data);
        }
      } catch (err) {
        console.warn('Using seeded default knowledge docs:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: newTitle,
        fileName: `${newTitle.replace(/\s+/g, '_')}.pdf`,
        fileType: newType,
        content: newContent || 'Custom uploaded knowledge document.',
        status: 'processed',
        source: 'upload',
      };

      try {
        const res = await knowledgeAPI.createDoc(payload);
        if (res.data?.success && res.data.data) {
          setDocs((prev) => [res.data.data, ...prev]);
        } else {
          setDocs((prev) => [{ ...payload, _id: `doc-${Date.now()}`, updatedAt: new Date().toISOString().split('T')[0] }, ...prev]);
        }
      } catch (err) {
        setDocs((prev) => [{ ...payload, _id: `doc-${Date.now()}`, updatedAt: new Date().toISOString().split('T')[0] }, ...prev]);
      }

      setNewTitle('');
      setNewContent('');
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const semanticDocIds = useSemanticSearch && semanticResults.length > 0
    ? new Set(semanticResults.map((r) => String(r.documentId)))
    : null;

  const filteredDocs = docs.filter((doc) => {
    if (useSemanticSearch && semanticDocIds) {
      return semanticDocIds.has(String(doc._id));
    }
    const search = searchTerm.toLowerCase();
    return (
      (doc.title || '').toLowerCase().includes(search) ||
      (doc.fileType || doc.type || '').toLowerCase().includes(search) ||
      (doc.content || '').toLowerCase().includes(search)
    );
  });

  const docChunkCount = (doc) => (typeof doc.chunkCount === 'number' ? doc.chunkCount : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base Repository"
        subtitle="Indexed product specifications, competitor battlecards, and sales compliance guidelines."
        action={
          <Button onClick={() => setIsUploadModalOpen(true)} icon={Upload} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
            Upload Knowledge Document
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                useSemanticSearch
                  ? 'Semantic search: e.g. "What security commitments do we offer?"...'
                  : 'Search knowledge documents by title or category...'
              }
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setUseSemanticSearch((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              useSemanticSearch
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/15'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title={useSemanticSearch ? 'Semantic search active (vector similarity)' : 'Toggle semantic vector search'}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Semantic</span>
            {useSemanticSearch && semanticLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          </button>
        </div>

        {useSemanticSearch && semanticResults.length > 0 && (
          <div className="mb-4 p-3 bg-slate-950/70 border border-indigo-500/10 rounded-xl space-y-2 max-h-48 overflow-y-auto">
            <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Top {semanticResults.length} semantically matched chunks
            </div>
            {semanticResults.slice(0, 5).map((r, idx) => (
              <div key={idx} className="text-[11px] text-slate-400 border-l-2 border-indigo-500/40 pl-2.5 py-0.5">
                <span className="text-slate-200 font-medium">{r.documentName}</span>
                <span className="ml-2 text-indigo-400 font-mono">score {Number(r.score || 0).toFixed(3)}</span>
                <div className="text-slate-500 truncate">{r.text?.slice(0, 120)}...</div>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Last Indexed</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-xs">
              {filteredDocs.map((doc, idx) => {
                const dateStr = doc.updatedAt ? new Date(doc.updatedAt).toISOString().split('T')[0] : doc.updated || '2026-09-01';
                return (
                  <tr key={doc._id || idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{doc.title}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{doc.fileType || doc.type}</td>
                    <td className="py-3 px-4 text-slate-300 text-xs font-mono tabular-nums">
                      {docChunkCount(doc)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs font-mono whitespace-nowrap">
                      {formatLastIndexed(doc)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs font-mono whitespace-nowrap">{dateStr}</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(doc.status, docChunkCount(doc))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VIEW DOCUMENT CONTENT MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{selectedDoc.title}</span>
              </h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="purple">{selectedDoc.fileType || selectedDoc.type}</Badge>
              {getStatusBadge(selectedDoc.status, docChunkCount(selectedDoc))}
              <span className="text-slate-500 text-[11px] font-mono inline-flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {docChunkCount(selectedDoc)} chunks
              </span>
              <span className="text-slate-500 text-[11px] font-mono inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatLastIndexed(selectedDoc)}
              </span>
              <span className="text-slate-500 font-mono text-[11px] ml-auto">
                File: {selectedDoc.fileName || `${selectedDoc.title}.pdf`}
              </span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
              {selectedDoc.content || 'Document content indexed.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Upload Knowledge Document</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sales Playbook 2026.pdf"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Document Category Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="PDF Specification">PDF Specification</option>
                  <option value="Battlecard">Battlecard</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Product Specification">Product Specification</option>
                  <option value="FAQ">FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Document Content</label>
                <textarea
                  rows="4"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter specifications, pricing rules, or competitor battlecard text..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  {isSubmitting ? 'Indexing Document...' : 'Index & Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeBase;
