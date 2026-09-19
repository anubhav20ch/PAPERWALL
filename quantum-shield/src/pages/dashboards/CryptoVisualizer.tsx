import React, { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, WifiOff, CheckCircle2, FileText, Key, Hash, ShieldCheck, FileSignature, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';

export function CryptoVisualizer() {
  const [level, setLevel] = useState<1 | 2 | 3>(2);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string>('');
  const [simulating, setSimulating] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    api.get('/papers').then(setPapers).catch(console.error);

    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/crypto-events?token=${token}`;

    const connectWs = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setEvents((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50 events

          // Highlight stage in Level 2 Flow Diagram
          if (data.algorithm) {
            setActiveStage(data.algorithm);
            setTimeout(() => setActiveStage(null), 2500);
          }
        } catch (err) {
          console.error('WS Parse Error:', err);
        }
      };

      socket.onclose = () => {
        setConnected(false);
        // Reconnect after 3s
        setTimeout(connectWs, 3000);
      };

      socket.onerror = (err) => {
        console.error('WS Error:', err);
        socket.close();
      };
    };

    connectWs();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const triggerTestSimulation = async () => {
    if (!selectedPaper) {
      alert("Please select a paper first.");
      return;
    }
    setSimulating(true);
    try {
      await api.get(`/papers/${selectedPaper}/download`);
    } catch (e) {
      // Intentionally capture response
    } finally {
      setSimulating(false);
    }
  };

  const getStageHighlight = (stageAlgo: string) => {
    if (activeStage === stageAlgo) {
      return 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105 transition-all duration-300';
    }
    return 'border-border bg-surface opacity-80';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            Live Post-Quantum Cryptographic Visualizer
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time WebSocket event streaming & multi-level pipeline execution trace.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${connected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 mr-1.5 animate-pulse text-green-600" /> WebSocket Connected
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Reconnecting...
              </>
            )}
          </span>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="flex bg-surface p-1 rounded-xl border border-border max-w-xl">
        <button
          onClick={() => setLevel(1)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${level === 1 ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
          Level 1: Overview Feed
        </button>
        <button
          onClick={() => setLevel(2)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${level === 2 ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
          Level 2: Pipeline Flow Diagram
        </button>
        <button
          onClick={() => setLevel(3)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${level === 3 ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
          Level 3: Technical Detail
        </button>
      </div>

      {/* Test Trigger Control Bar */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Play className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-text-main">Live Event Trigger</p>
              <p className="text-xs text-text-muted">Trigger a cryptographic download event to watch live WebSocket streaming.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-border rounded-md font-medium focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">-- Select Exam Paper --</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>{p.id}: {p.title}</option>
              ))}
            </select>
            <Button size="sm" onClick={triggerTestSimulation} disabled={simulating}>
              {simulating ? 'Executing...' : 'Trigger Pipeline'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LEVEL 1: OVERVIEW FEED */}
      {level === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Overview Feed ({events.length} Events)</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                <Activity className="w-10 h-10 mx-auto opacity-20 mb-2" />
                Listening for real-time WebSocket events... (Perform an upload or download to trigger)
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg bg-white shadow-sm hover:border-primary/40 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        {evt.algorithm === 'AES-256-GCM' ? <Key className="w-5 h-5" /> :
                         evt.algorithm === 'SHA3-256' ? <Hash className="w-5 h-5" /> :
                         evt.algorithm === 'ML-KEM-768' ? <ShieldCheck className="w-5 h-5" /> :
                         <FileSignature className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-main">
                          Paper <span className="font-mono text-primary">{evt.paper_id}</span> • {evt.operation} with {evt.algorithm}
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          Executed by <strong className="text-text-main">{evt.actor}</strong> at {new Date(evt.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={evt.status === 'SUCCESS' ? 'success' : 'danger'}>
                      {evt.status} ({evt.duration_ms} ms)
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LEVEL 2: PIPELINE FLOW DIAGRAM */}
      {level === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Animated Cryptographic Pipeline Flow Diagram</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 py-6">
            <p className="text-xs text-text-muted text-center">
              Watch real-time cryptographic execution steps illuminate as events stream over the WebSocket.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Stage 1: SHA3 */}
              <div className={`p-4 rounded-xl border text-center transition-all ${getStageHighlight('SHA3-256')}`}>
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Hash className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-text-main">1. SHA3-256</h4>
                <p className="text-[10px] text-text-muted mt-1">Plaintext Hash Digest</p>
              </div>

              {/* Stage 2: AES */}
              <div className={`p-4 rounded-xl border text-center transition-all ${getStageHighlight('AES-256-GCM')}`}>
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Key className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-text-main">2. AES-256-GCM</h4>
                <p className="text-[10px] text-text-muted mt-1">Payload Encryption</p>
              </div>

              {/* Stage 3: ML-KEM */}
              <div className={`p-4 rounded-xl border text-center transition-all ${getStageHighlight('ML-KEM-768')}`}>
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-text-main">3. ML-KEM-768</h4>
                <p className="text-[10px] text-text-muted mt-1">DEK Key Encapsulation</p>
              </div>

              {/* Stage 4: ML-DSA */}
              <div className={`p-4 rounded-xl border text-center transition-all ${getStageHighlight('ML-DSA-65')}`}>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileSignature className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-text-main">4. ML-DSA-65</h4>
                <p className="text-[10px] text-text-muted mt-1">Distributor Signature</p>
              </div>

              {/* Stage 5: Package */}
              <div className="p-4 rounded-xl border border-border bg-surface text-center opacity-90">
                <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-text-main">5. Encrypted .QS</h4>
                <p className="text-[10px] text-text-muted mt-1">Server Payload Package</p>
              </div>
            </div>

            {/* Active Execution Callout */}
            {activeStage && (
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg text-center animate-pulse text-xs font-semibold text-primary">
                Active Execution Step: <span className="font-bold uppercase tracking-wider">{activeStage}</span> — Processing Cryptographic Primitive...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LEVEL 3: TECHNICAL DETAIL */}
      {level === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Technical Execution Inspector (Microsecond Telemetry)</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="py-8 text-center text-text-muted">No technical event trace logs captured yet.</div>
            ) : (
              <div className="space-y-4">
                {events.map((evt, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 bg-surface space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-text-main font-bold">
                      <span className="text-primary font-mono">[EVENT #{evt.id || idx + 1}] {evt.operation}</span>
                      <span className="text-text-muted text-[11px]">{evt.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-text-muted block">Paper ID:</span>
                        <span className="font-bold text-text-main">{evt.paper_id}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Algorithm:</span>
                        <span className="font-bold text-text-main">{evt.algorithm}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Duration:</span>
                        <span className="font-bold text-blue-600">{evt.duration_ms} ms</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Actor:</span>
                        <span className="font-bold text-text-main">{evt.actor}</span>
                      </div>
                    </div>

                    {evt.key_id && (
                      <div>
                        <span className="text-text-muted block text-[10px]">Truncated Key ID / Signature:</span>
                        <span className="text-purple-600 break-all">{evt.key_id}... [TRUNCATED]</span>
                      </div>
                    )}
                    {evt.hash_value && (
                      <div>
                        <span className="text-text-muted block text-[10px]">Truncated Hash Digest:</span>
                        <span className="text-orange-600 break-all">{evt.hash_value}... [TRUNCATED]</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
