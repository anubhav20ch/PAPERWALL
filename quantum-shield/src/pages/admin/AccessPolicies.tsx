import React, { useEffect, useState } from 'react';
import { Shield, Plus, Clock, Key, CheckCircle, AlertTriangle, FileText, Lock, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';

export function AccessPolicies() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [paperId, setPaperId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxDownloads, setMaxDownloads] = useState(5);
  const [requiredRole, setRequiredRole] = useState<number | ''>('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [requireSignature, setRequireSignature] = useState(true);
  const [requireIntegrity, setRequireIntegrity] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policiesRes, papersRes] = await Promise.all([
        api.get('/policies'),
        api.get('/papers')
      ]);
      setPolicies(policiesRes);
      setPapers(papersRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!paperId || !name) {
      setErrorMsg('Please select a paper and enter a policy name.');
      return;
    }

    try {
      const payload: any = {
        paper_id: paperId,
        name,
        description: description || undefined,
        max_downloads: Number(maxDownloads),
        required_role: requiredRole ? Number(requiredRole) : null,
        valid_from: validFrom ? new Date(validFrom).toISOString() : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        require_signature_verification: requireSignature,
        require_integrity_verification: requireIntegrity
      };

      await api.post('/policies', payload);
      setSuccessMsg('Access Policy successfully created!');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create policy');
    }
  };

  const resetForm = () => {
    setPaperId('');
    setName('');
    setDescription('');
    setMaxDownloads(5);
    setRequiredRole('');
    setValidFrom('');
    setValidUntil('');
    setRequireSignature(true);
    setRequireIntegrity(true);
  };

  const getRoleName = (roleId?: number) => {
    if (roleId === 1) return 'Administrator';
    if (roleId === 2) return 'Professor';
    if (roleId === 3) return 'Exam Centre';
    return 'Any Authenticated User';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Zero-Trust Access Policies
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Configure server-side composable attribute-based access control (ABAC) policies.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Policy
        </Button>
      </div>

      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-sm flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center text-text-main">
              <Lock className="w-5 h-5 mr-2 text-primary" />
              New Access Control Policy
            </h2>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Target Exam Paper</label>
                <select
                  value={paperId}
                  onChange={(e) => setPaperId(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                >
                  <option value="">-- Select Paper --</option>
                  {papers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.title} ({p.course_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Policy Title</label>
                <input
                  type="text"
                  placeholder="e.g. Centre North Exam Window Policy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Required Role</label>
                  <select
                    value={requiredRole}
                    onChange={(e) => setRequiredRole(e.target.value ? Number(e.target.value) : '')}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Any Authenticated User</option>
                    <option value={1}>Admin Only (1)</option>
                    <option value={2}>Professor Only (2)</option>
                    <option value={3}>Exam Centre Only (3)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Max Download Quota</label>
                  <input
                    type="number"
                    min="1"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(Number(e.target.value))}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Valid From</label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Valid Until</label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <label className="flex items-center text-sm font-medium text-text-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireSignature}
                    onChange={(e) => setRequireSignature(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary mr-2"
                  />
                  Enforce ML-DSA (Dilithium) Signature Verification
                </label>
                <label className="flex items-center text-sm font-medium text-text-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireIntegrity}
                    onChange={(e) => setRequireIntegrity(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary mr-2"
                  />
                  Enforce SHA3-256 Digest Match Verification
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Policy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Policy List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Access Control Policies ({policies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted">Loading policies...</div>
          ) : policies.length === 0 ? (
            <div className="py-8 text-center text-text-muted">No access policies configured yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((p) => (
                <div key={p.id} className="border border-border rounded-lg p-5 bg-surface space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-text-main text-base">{p.name}</h3>
                      <p className="text-xs text-text-muted flex items-center mt-0.5">
                        <FileText className="w-3.5 h-3.5 mr-1 text-primary" /> Target Paper: <span className="font-mono ml-1 font-semibold text-text-main">{p.paper_id}</span>
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                    <div className="flex items-center text-text-muted">
                      <UserCheck className="w-3.5 h-3.5 mr-1 text-primary" />
                      Role: <span className="font-semibold text-text-main ml-1">{getRoleName(p.required_role)}</span>
                    </div>
                    <div className="flex items-center text-text-muted">
                      <Key className="w-3.5 h-3.5 mr-1 text-primary" />
                      Quota: <span className="font-mono font-semibold text-text-main ml-1">{p.current_downloads}/{p.max_downloads} downloads</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-text-muted pt-1">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-primary" />
                      Window: {p.valid_from ? new Date(p.valid_from).toLocaleString() : 'Immediate'} → {p.valid_until ? new Date(p.valid_until).toLocaleString() : 'Unrestricted'}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/60">
                    {p.require_signature_verification && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200">
                        ML-DSA Enforced
                      </span>
                    )}
                    {p.require_integrity_verification && (
                      <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-200">
                        SHA3 Check
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
