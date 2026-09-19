import React from 'react';
import { ShieldCheck, BookOpen, Users, Cpu, FileText, CheckCircle2, Lock, GitBranch, ShieldAlert, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export function About() {
  const creators = [
    {
      name: 'Anubhav Choudhary',
      role: 'Research & Cryptographic Engine Creation',
      icon: Cpu,
      color: 'bg-blue-500',
      description: 'Engineered the core PQC cryptographic engine (crypto_helpers.py), integrating NIST FIPS 203 (ML-KEM-768), FIPS 204 (ML-DSA-65), AES-256-GCM, and SHA3-256 primitives, and conducted foundational research against HNDL quantum attack vectors.'
    },
    {
      name: 'Abhijeet Kumar Chauhan',
      role: 'Frontend Creation as well as Integration Components',
      icon: Users,
      color: 'bg-emerald-500',
      description: 'Designed and implemented the complete React/TypeScript Single Page Application (SPA), including interactive dashboards, real-time WebSocket Crypto Visualizer, NIST FIPS-197 AES Sandbox, and seamless REST API integration.'
    },
    {
      name: 'Arpit Shah',
      role: 'Cryptographic Integration of the Parts',
      icon: GitBranch,
      color: 'bg-purple-500',
      description: 'Architected the end-to-end integration between post-quantum cryptographic key release, Zero-Trust Access Policy engine, Examination State Machine gating, and immutable SHA3-linked provenance audit chains.'
    }
  ];

  const researchPapers = [
    {
      code: 'Paper A',
      title: 'Design and implementation of an authenticated post-quantum session protocol using ML-KEM (Kyber), ML-DSA (Dilithium), and AES-256-GCM',
      authors: 'Akinlemi Olushola & S. P. Meenakshi',
      journal: 'Frontiers in Physics (2026)',
      doi: '10.3389/fphy.2025.1723966',
      summary: 'Establishes a 4-step session-layer handshake combining ML-DSA-65 endpoint authentication, ML-KEM-1024 key encapsulation, transcript-bound HKDF-SHA3-256 key derivation, and AES-256-GCM AEAD payload protection with explicit zeroization for forward secrecy.'
    },
    {
      code: 'Paper B',
      title: 'Hybrid Quantum-Safe Cryptographic Scheme With Secure Key Exchange and Signature Scheme',
      authors: 'Perera K. Maduni, Ilmu Byun, Jeongil Seo, & Kyeongjun Ko',
      journal: 'IEEE Access (2025)',
      doi: '10.1109/ACCESS.2025.3600068',
      summary: 'Integrates Kyber1024 key encapsulation and Dilithium5 digital signatures alongside classical ECDSA inside an Ethereum blockchain workflow using Merkle roots for decentralized proof verification.'
    }
  ];

  const additions = [
    {
      title: 'Deployed Multi-Tenant Application Stack',
      desc: 'Transformed protocol specifications into an enterprise web application with FastAPI REST API, PostgreSQL database, Alembic migrations, and React frontend.'
    },
    {
      title: 'Zero-Trust Policy Engine',
      desc: 'Enforces server-side access control evaluating user role ID, UTC time-windows, and per-document download quotas before releasing decryption keys.'
    },
    {
      title: 'Time-Gated Examination Lockbox',
      desc: 'High-security exam state machine (created -> locked -> released -> closed) preventing decapsulation and download outside active exam start windows.'
    },
    {
      title: 'Immutable Event Provenance Chain',
      desc: 'Maintains cryptographically hash-linked audit logs (prev_record_hash = SHA3-256(prev_event)) with tamper verification endpoints.'
    },
    {
      title: 'Insider Threat & Anomaly Scoring',
      desc: 'Calculates dynamic user behavior risk profiles and logs security incidents upon failed authentication or unauthorized access attempts.'
    },
    {
      title: 'Attack Simulation Lab & Live Key Rotation',
      desc: 'Features a non-destructive key compromise blast-radius simulator and live ML-DSA key re-signing engine for both secured PQC and vulnerable legacy targets.'
    },
    {
      title: 'Real-time Telemetry & Educational Sandboxes',
      desc: 'WebSocket-driven 3-level microsecond execution trace visualizer and interactive client-side NIST FIPS-197 AES S-Box sandbox.'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-8 shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Project Architecture & Governance</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">About QuantumShield</h1>
            <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
              QuantumShield is a post-quantum-cryptography-secured academic paper distribution and anti-leak governance system. 
              Designed to solve high-stakes exam paper leaks and counter Harvest-Now-Decrypt-Later (HNDL) quantum threats.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center flex-shrink-0">
            <Award className="w-8 h-8 text-amber-400 mx-auto mb-1" />
            <div className="text-xs text-slate-300">NIST PQC Standards</div>
            <div className="font-bold text-sm text-white">FIPS 203 & FIPS 204</div>
          </div>
        </div>
      </div>

      {/* Creators & Contributions Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-main flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Project Creators & Technical Contributions
          </h2>
          <p className="text-sm text-text-muted mt-1">Core engineering team responsible for QuantumShield's research, cryptography, and frontend integration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creators.map((c, idx) => (
            <Card key={idx} className="hover:border-primary/50 transition-all shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl ${c.color} text-white flex items-center justify-center shadow-md`}>
                    <c.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-text-main leading-tight">{c.name}</h3>
                    <span className="inline-block mt-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {c.role}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed border-t border-border pt-3">
                  {c.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Academic Research Foundations */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-main flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary" />
            Academic Research Foundations
          </h2>
          <p className="text-sm text-text-muted mt-1">QuantumShield builds upon state-of-the-art research published in peer-reviewed journals.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {researchPapers.map((p, idx) => (
            <Card key={idx} className="border-indigo-100 bg-slate-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{p.code}</span>
                  <span className="text-xs text-text-muted">{p.journal}</span>
                </div>
                <CardTitle className="text-base font-bold leading-snug">{p.title}</CardTitle>
                <div className="text-xs font-semibold text-text-muted mt-1">Authors: {p.authors}</div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-text-muted border-t border-border/60 pt-3">
                <p className="leading-relaxed">{p.summary}</p>
                <div className="text-[11px] font-mono text-indigo-600">DOI: {p.doi}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Novelty & Added Features */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-main flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-primary" />
            QuantumShield Innovations Beyond the Research Papers
          </h2>
          <p className="text-sm text-text-muted mt-1">What QuantumShield adds to transform raw cryptographic handshakes into a full production system.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {additions.map((item, idx) => (
            <Card key={idx} className="hover:bg-white transition-colors">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center space-x-2 text-primary font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed pl-6">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
