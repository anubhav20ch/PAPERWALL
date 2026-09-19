import React, { useState, useEffect } from 'react';
import { ShieldAlert, Fingerprint, LockOpen, FileWarning, KeyRound, Bug, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';

export function AttackSimulation() {
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string>('');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get('/papers').then(setPapers).catch(console.error);
  }, []);

  const runAttack = async (attackType: string) => {
    if (!selectedPaper) {
      alert("Please select a target paper first.");
      return;
    }
    
    setSimulating(true);
    setResult(null);
    try {
      if (attackType === 'Key Rotation') {
        const res = await api.post(`/simulations/rotate-key/${selectedPaper}`, { reason: "Manual Emergency Key Rotation Triggered" });
        setResult({
          type: "ML-KEM / ML-DSA Key Rotation",
          detection_method: "PQC Key Wrap Engine",
          reason: res.message,
          success: true,
          attack_succeeded: false,
          actions: ["Key pair re-signed", "Provenance chain updated"]
        });
      } else {
        const res = await api.post('/simulations/key-compromise', {
          paper_id: selectedPaper,
          compromise_type: attackType
        });
        const attackSucceeded = res.attack_succeeded || selectedPaper === 'P-VULN-001';
        setResult({
          type: attackType,
          detection_method: res.detection_method || (attackSucceeded ? "Legacy RSA-2048 / Unencrypted Storage (VULNERABLE)" : "PQC Verification Engine (ML-KEM-768 / ML-DSA-65)"),
          reason: res.status_message || (attackSucceeded ? "VULNERABILITY EXPOSED: Document payload breached!" : "ATTACK BLOCKED: Verification Engine intercepted threat."),
          success: !attackSucceeded,
          attack_succeeded: attackSucceeded,
          actions: res.recommended_actions || []
        });
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Simulation failed.");
    }
    setSimulating(false);
  };

  const attackScenarios = [
    { title: 'Simulate File Tampering', type: 'File Tampering', icon: FileWarning, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Flips a single byte in the ciphertext payload to test SHA3.' },
    { title: 'Simulate Invalid Signature', type: 'Invalid Signature', icon: Fingerprint, color: 'text-red-500', bg: 'bg-red-50', desc: 'Attaches a forged ML-DSA signature to test authentication.' },
    { title: 'Simulate Wrong AES Key', type: 'Wrong AES Key', icon: KeyRound, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Attempts to decrypt payload with an incorrect symmetric key.' },
    { title: 'Simulate Key Corruption', type: 'Key Corruption', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Corrupts the Kyber encapsulated key to test Decapsulation.' },
    { title: 'Simulate Unauthorized Access', type: 'Unauthorized Access', icon: LockOpen, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Attempts to download paper without correct Role claims.' },
    { title: 'Execute Key Rotation', type: 'Key Rotation', icon: ShieldAlert, color: 'text-green-600', bg: 'bg-green-50', desc: 'Triggers live ML-KEM and ML-DSA post-quantum key re-signing.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attack Simulation Lab</h1>
          <p className="text-sm text-text-muted mt-1">Execute mock attacks to test the Cryptographic Verification Engine against Secured and Vulnerable targets.</p>
        </div>
      </div>

      <Card className="border-red-200">
        <CardContent className="p-4 bg-red-50/50 flex items-center justify-between rounded-lg">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">Target Selection</p>
              <p className="text-sm text-red-600/80">Select an encrypted PQC paper or the Vulnerable Test Target paper.</p>
            </div>
          </div>
          <select 
            className="px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
          >
            <option value="">-- Select Exam Paper Target --</option>
            {papers.map(p => (
              <option key={p.id} value={p.id}>
                {p.id === 'P-VULN-001' ? '⚠️ [VULNERABLE TARGET] ' : '🛡️ [SECURED PQC] '} 
                ID {p.id}: {p.course_code} - {p.title}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attackScenarios.map((attack, i) => (
            <Card key={i} className="hover:border-red-300 transition-colors">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${attack.bg} ${attack.color} flex items-center justify-center mb-4`}>
                  <attack.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-text-main mb-1">{attack.title}</h3>
                <p className="text-sm text-text-muted h-10">{attack.desc}</p>
                <Button 
                  onClick={() => runAttack(attack.type)} 
                  disabled={simulating}
                  variant="outline"
                  className="w-full mt-4 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  Launch Attack
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Simulation Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              {simulating ? (
                <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                  <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-semibold text-red-600 animate-pulse">Injecting Malicious Payload...</p>
                </div>
              ) : result ? (
                <div className="space-y-6 flex flex-col h-full">
                  {result.attack_succeeded ? (
                    <div className="text-center space-y-2 bg-red-50 p-4 rounded-xl border border-red-200">
                      <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                        <FileWarning className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-extrabold text-red-600 tracking-wide">⚠️ ATTACK SUCCEEDED</h3>
                      <p className="text-xs font-semibold text-red-700">VULNERABILITY EXPOSED: Document Breached!</p>
                      <p className="text-xs text-red-600/80">Target paper lacks PQC protection. Plaintext payload & RSA signatures compromised.</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 bg-green-50 p-4 rounded-xl border border-green-200">
                      <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-extrabold text-green-700 tracking-wide">🛡️ ATTACK BLOCKED</h3>
                      <p className="text-xs text-green-700 font-semibold">The Verification Engine intercepted the threat.</p>
                      <p className="text-xs text-green-600/80">Post-quantum ML-KEM-768 & ML-DSA-65 algorithms protected the document.</p>
                    </div>
                  )}
                  
                  <div className="bg-surface p-4 rounded-lg border border-border space-y-3 flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">Attack Type</span>
                      <span className="text-sm font-semibold">{result.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">Target ID</span>
                      <span className="text-sm font-semibold">{selectedPaper}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">Security Layer</span>
                      <span className="text-sm font-semibold text-right max-w-[170px]">{result.detection_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">Status</span>
                      <span className={`text-sm font-bold ${result.attack_succeeded ? 'text-red-600' : 'text-green-600'}`}>
                        {result.reason}
                      </span>
                    </div>
                  </div>

                  {result.actions && result.actions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Recommended Actions:</p>
                      <ul className="text-xs space-y-1">
                        {result.actions.map((act: string, idx: number) => (
                          <li key={idx} className={`p-2 rounded border ${result.attack_succeeded ? 'bg-red-50 text-red-700 border-red-200 font-semibold' : 'bg-surface text-text-muted border-border'}`}>
                            • {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-text-muted text-center space-y-4">
                  <Bug className="w-12 h-12 opacity-20" />
                  <p>Select a target paper and launch an attack to monitor the engine's response.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
