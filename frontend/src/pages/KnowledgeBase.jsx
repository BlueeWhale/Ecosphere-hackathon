import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Upload, FileText, Search } from 'lucide-react';

const docsDemo = [
  { title: 'Enterprise Pricing Guidelines 2026.pdf', type: 'PDF Specification', updated: '2026-08-20', status: 'Indexed' },
  { title: 'Competitor Comparison Matrix.docx', type: 'Battlecard', updated: '2026-08-28', status: 'Indexed' },
  { title: 'Security & SLA Compliance FAQ.pdf', type: 'Compliance', updated: '2026-08-15', status: 'Indexed' },
];

export function KnowledgeBase() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base (RAG)"
        subtitle="Document knowledge repository for zero-hallucination product answers."
        action={<Button icon={Upload}>Upload Knowledge Document</Button>}
      />

      <Card>
        <div className="relative max-w-sm mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {docsDemo.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    {doc.title}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{doc.type}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{doc.updated}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="success">{doc.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// src/pages/Conversations.jsx ke end mein:
export default KnowledgeBase;