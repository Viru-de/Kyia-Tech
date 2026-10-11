import React from 'react';
import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  ExternalLink,
  Sparkles,
  Code2,
  Cpu,
  Search,
  Bot,
  Server,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openWhatsAppChat } from '../../utils/formatters';

export const AboutKlyiaView: React.FC = () => {
  const { companySettings } = useApp();

  const services = [
    {
      title: 'Web Development & Design',
      desc: 'High-speed, responsive corporate portals, e-commerce stores, and headless landing pages optimized for conversions.',
      icon: Code2,
    },
    {
      title: 'Custom Web Applications & Software',
      desc: 'Full-stack enterprise SaaS platforms, dashboards, workflow automations, and custom business management software.',
      icon: Cpu,
    },
    {
      title: 'AI Chatbots & Generative AI Agents',
      desc: 'Custom Gemini and LLM-powered WhatsApp agents, website concierge bots, triage assistants, and automated customer support.',
      icon: Bot,
    },
    {
      title: 'SEO & GEO/AEO Optimization',
      desc: 'Traditional search ranking combined with modern Generative Engine Optimization (GEO/AEO) for ChatGPT, Perplexity & Google SGE visibility.',
      icon: Search,
    },
    {
      title: 'Cloud Hosting, Domains & Business Email',
      desc: 'NVMe VPS servers, GoDaddy / Hostinger domain provisioning, Google Workspace & Zoho business email deployment, and automated SSL.',
      icon: Server,
    },
    {
      title: 'Digital Marketing & Social Media',
      desc: 'Performance Google Ads, Meta ad campaigns, brand positioning, and B2B high-intent lead generation.',
      icon: Sparkles,
    },
    {
      title: 'Annual Maintenance Contracts (AMC)',
      desc: '24/7 uptime monitoring, weekly cloud backups, security patches, framework upgrades, and priority bug resolution SLAs.',
      icon: Wrench,
    },
    {
      title: 'Technology Consulting & Architecture',
      desc: 'Modern cloud infrastructure consulting, database scaling, API integrations, and digital transformation roadmaps.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Brand Showcase */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Technology Partner</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            {companySettings.companyName || 'KLYIA TECHNOLOGY'}
          </h1>
          <p className="text-base sm:text-lg font-semibold text-cyan-300">
            {companySettings.tagline || 'Web • Software • Digital • AI Solutions'}
          </p>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-2">
            Klyia Technology delivers production-grade web applications, modern software systems, generative AI chatbots, digital marketing, and cloud infrastructure for growing enterprises worldwide.
          </p>

          {/* Core Action Buttons (Section 34 requirement) */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <a
              href={`tel:${companySettings.phone}`}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Call: {companySettings.phone}</span>
            </a>

            <button
              onClick={() =>
                openWhatsAppChat(
                  companySettings.phone,
                  'Hi Klyia Technology! I would like to inquire about your software and web development services.'
                )
              }
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </button>

            <a
              href={`mailto:${companySettings.email}`}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Email: {companySettings.email}</span>
            </a>

            <a
              href={companySettings.website}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Services Portfolio Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Our Core Technology Capabilities
          </h2>
          <p className="text-xs text-slate-500">
            End-to-end engineering, cloud deployment, and digital growth services
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.title}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-cyan-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{svc.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{svc.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Details & Compliance Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Registered Office & Contact Headquarters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-700">
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
              Registered Office
            </span>
            <p className="font-semibold text-slate-900">{companySettings.companyName}</p>
            <p className="text-slate-600 mt-0.5">{companySettings.address}</p>
            <p className="text-slate-600">
              {companySettings.area}, {companySettings.city}
            </p>
            <p className="text-slate-600">
              {companySettings.state} - {companySettings.pincode}, {companySettings.country}
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
              Statutory Credentials
            </span>
            <p className="text-slate-700">
              GSTIN: <strong className="font-mono text-slate-900">{companySettings.gstin || 'Configured'}</strong>
            </p>
            <p className="text-slate-700 mt-1">
              PAN: <strong className="font-mono text-slate-900">{companySettings.pan || 'Configured'}</strong>
            </p>
            <p className="text-slate-700 mt-1">
              Bank: <strong>{companySettings.bankName}</strong>
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
              Direct Support
            </span>
            <p className="text-slate-700">
              Phone:{' '}
              <a href={`tel:${companySettings.phone}`} className="font-bold text-cyan-700 hover:underline">
                {companySettings.phone}
              </a>
            </p>
            <p className="text-slate-700 mt-1">
              WhatsApp:{' '}
              <a href={`https://wa.me/91${companySettings.phone}`} className="font-bold text-emerald-600 hover:underline">
                {companySettings.phone}
              </a>
            </p>
            <p className="text-slate-700 mt-1">
              Email:{' '}
              <a href={`mailto:${companySettings.email}`} className="font-bold text-slate-900 hover:underline">
                {companySettings.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
