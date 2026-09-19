import React, { useEffect, useState } from 'react';
import { Download, ShieldAlert, FileKey2, Lock, Unlock, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';

export function ExamCentreDashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, papersRes] = await Promise.all([
        api.get('/exams').catch(() => []),
        api.get('/papers').catch(() => [])
      ]);
      setExams(examsRes);
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

  const handleTransition = async (examId: number, nextStatus: string) => {
    setStatusMsg('');
    setErrorMsg('');
    try {
      await api.patch(`/exams/${examId}/transition`, { status: nextStatus });
      setStatusMsg(`Exam status updated to ${nextStatus.toUpperCase()}`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update exam status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'released':
        return <Badge variant="success">RELEASED / ACTIVE</Badge>;
      case 'locked':
        return <Badge variant="warning">LOCKED (TIMED RELEASE)</Badge>;
      case 'closed':
        return <Badge variant="danger">CLOSED / EXPIRED</Badge>;
      default:
        return <Badge variant="info">CREATED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Secure Examination Mode Portal
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Time-bound, state-machine enforced examination paper release engine.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-sm flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary rounded-lg text-white">
                <FileKey2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-main">Available Papers</p>
                <h3 className="text-2xl font-bold text-primary">{papers.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-500 rounded-lg text-white">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-main">Scheduled Exams</p>
                <h3 className="text-2xl font-bold text-amber-600">{exams.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500 rounded-lg text-white">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-main">Active Released Exams</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {exams.filter(e => e.status === 'released').length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam State Machine List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Examinations & State Machine Controls</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted">Loading scheduled exams...</div>
          ) : exams.length === 0 ? (
            <div className="py-8 text-center text-text-muted">No scheduled exam windows found.</div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="border border-border rounded-lg p-5 bg-white shadow-sm hover:border-primary/40 transition-all space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-lg text-text-main">{exam.name}</h3>
                        {getStatusBadge(exam.status)}
                      </div>
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-2">
                        <span>Paper ID: <strong className="font-mono text-text-main">{exam.paper_id}</strong></span>
                        <span>• Date: {exam.date} ({exam.start_time} - {exam.end_time})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {exam.status === 'created' && (
                        <Button size="sm" variant="outline" onClick={() => handleTransition(exam.id, 'locked')}>
                          <Lock className="w-3.5 h-3.5 mr-1" /> Lock Window
                        </Button>
                      )}
                      {exam.status === 'locked' && (
                        <Button size="sm" onClick={() => handleTransition(exam.id, 'released')}>
                          <Unlock className="w-3.5 h-3.5 mr-1" /> Release Key
                        </Button>
                      )}
                      {exam.status === 'released' && (
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleTransition(exam.id, 'closed')}>
                          <Lock className="w-3.5 h-3.5 mr-1" /> Close Exam
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-border/60 text-xs text-text-muted gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-primary" /> Max Downloads: {exam.max_downloads}
                      </span>
                      <span className="bg-surface px-2 py-0.5 rounded border border-border font-medium text-text-main">
                        Class: {exam.security_classification}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/papers/${exam.paper_id}`)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> View & Download Paper
                    </Button>
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
