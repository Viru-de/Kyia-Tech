import React, { useState } from 'react';
import {
  Kanban,
  Plus,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PipelineStage, Client } from '../../types';
import { formatINR, openWhatsAppChat } from '../../utils/formatters';
import { Badge } from '../common/Badge';

const ALL_STAGES: PipelineStage[] = [
  'Upcoming / Requirement / Project Discussion',
  'New Lead',
  'Contacted',
  'Requirement Received',
  'Quotation Prepared',
  'Quotation Sent',
  'Follow-up',
  'Negotiation',
  'Confirmed',
  'Advance Received',
  'Work Started',
  'Work in Progress',
  'Work Completed',
  'Payment Pending',
  'Renewal Due',
  'Renewed',
  'Lost',
];

interface ClientPipelineViewProps {
  onOpenQuickAction: (actionType: string) => void;
}

export const ClientPipelineView: React.FC<ClientPipelineViewProps> = ({ onOpenQuickAction }) => {
  const { clients, updateClient, purchases, setCurrentTab, setSelectedClientId, getClientFinancials } = useApp();
  const [activeFilterStage, setActiveFilterStage] = useState<string>('all');

  const moveStage = (client: Client, newStage: PipelineStage) => {
    updateClient(client.id, { pipelineStage: newStage });
  };

  const getClientValue = (clientId: string) => {
    const fin = getClientFinancials(clientId);
    return fin.totalBilled > 0 ? fin.totalBilled : null;
  };

  const getClientServiceTitle = (clientId: string) => {
    const p = purchases.find((pur) => pur.clientId === clientId);
    return p ? (p.customServiceTitle || p.serviceType) : 'General Technology Requirement';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Client Sales & Delivery Pipeline</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold font-mono">
              CRM Stages
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Track lead qualification, proposal follow-ups, advance collection, delivery, and renewals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenQuickAction('client')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Lead / Client
          </button>
        </div>
      </div>

      {/* Pipeline Stage Quick Switcher Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setActiveFilterStage('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFilterStage === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Stages ({clients.length})
        </button>
        {ALL_STAGES.map((stg) => {
          const count = clients.filter((c) => c.pipelineStage === stg).length;
          return (
            <button
              key={stg}
              onClick={() => setActiveFilterStage(stg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilterStage === stg
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{stg}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilterStage === stg ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar min-h-[550px]">
        {ALL_STAGES.filter((stg) => activeFilterStage === 'all' || activeFilterStage === stg).map(
          (stage, stageIndex) => {
            const stageClients = clients.filter((c) => c.pipelineStage === stage);
            const totalStageValue = stageClients.reduce((acc, c) => {
              const val = getClientValue(c.id);
              return acc + (val || 0);
            }, 0);

            return (
              <div
                key={stage}
                className="w-72 shrink-0 bg-slate-100/80 rounded-2xl p-3 border border-slate-200/90 flex flex-col max-h-[750px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="truncate">
                    <span className="text-xs font-extrabold text-slate-800 block truncate">
                      {stage}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {stageClients.length} deal{stageClients.length === 1 ? '' : 's'} •{' '}
                      {formatINR(totalStageValue)}
                    </span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center shrink-0">
                    {stageClients.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  {stageClients.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                      No clients in this stage
                    </div>
                  ) : (
                    stageClients.map((client) => {
                      const clientVal = getClientValue(client.id);
                      const serviceTitle = getClientServiceTitle(client.id);
                      const prevStage = stageIndex > 0 ? ALL_STAGES[stageIndex - 1] : null;
                      const nextStage = stageIndex < ALL_STAGES.length - 1 ? ALL_STAGES[stageIndex + 1] : null;

                      return (
                        <div
                          key={client.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-cyan-300 transition-all space-y-2 group"
                        >
                          {/* Client title and brand */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  setCurrentTab('crm-clients');
                                }}
                                className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 text-left hover:underline block leading-tight cursor-pointer"
                              >
                                {client.name}
                              </button>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {client.clientId}
                              </span>
                            </div>
                            <Badge
                              variant={
                                client.clientType === 'RETURNING CLIENT'
                                  ? 'purple'
                                  : client.clientType === 'NEW CLIENT'
                                  ? 'primary'
                                  : 'neutral'
                              }
                            >
                              {client.clientType === 'RETURNING CLIENT' ? 'Return' : 'New'}
                            </Badge>
                          </div>

                          {/* Service scope */}
                          <p className="text-[11px] text-slate-600 line-clamp-2 font-medium">
                            {serviceTitle}
                          </p>

                          {/* Deal Value & Assignee */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="font-extrabold text-slate-900">
                              {clientVal ? formatINR(clientVal) : 'TBD'}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              {client.assignedTo || 'Klyia Team'}
                            </span>
                          </div>

                          {/* Action Buttons: WhatsApp, Call, Quick Move */}
                          <div className="flex items-center justify-between pt-1 gap-1">
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${client.phone}`}
                                className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-slate-100 rounded-md transition-colors"
                                title="Call Client"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              {client.whatsapp && (
                                <button
                                  onClick={() =>
                                    openWhatsAppChat(
                                      client.whatsapp,
                                      `Hi ${client.contactPerson || client.name}, following up regarding our project discussion with Klyia Technology.`
                                    )
                                  }
                                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                  title="WhatsApp Chat"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Stage Steppers */}
                            <div className="flex items-center gap-1">
                              {prevStage && (
                                <button
                                  onClick={() => moveStage(client, prevStage)}
                                  className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md text-[10px] flex items-center cursor-pointer"
                                  title={`Back to ${prevStage}`}
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {nextStage && (
                                <button
                                  onClick={() => moveStage(client, nextStage)}
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-md flex items-center gap-0.5 cursor-pointer"
                                  title={`Move to ${nextStage}`}
                                >
                                  <span>Next</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};
