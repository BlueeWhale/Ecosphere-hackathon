import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Clock } from 'lucide-react';

const tasksDemo = [
  { customer: 'Ananya Verma', action: 'Send customized enterprise proposal', due: 'Tomorrow, 10:00 AM', priority: 'High' },
  { customer: 'Vikram Malhotra', action: 'Follow up on technical security review', due: 'Sep 04, 2026', priority: 'Medium' },
];

export function FollowUps() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-Up Queue"
        subtitle="Automated follow-up tasks generated post conversation."
      />

      <Card>
        <div className="space-y-3">
          {tasksDemo.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">{item.action}</p>
                <p className="text-xs text-slate-400">Target Client: <span className="text-slate-300">{item.customer}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {item.due}
                </div>
                <Badge variant={item.priority === 'High' ? 'danger' : 'warning'}>{item.priority}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// src/pages/Conversations.jsx ke end mein:
export default FollowUps;