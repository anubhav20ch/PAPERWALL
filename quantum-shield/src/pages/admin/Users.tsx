import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Key, X, Mail, Lock, User as UserIcon, Building } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { api } from '../../lib/api';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [roleId, setRoleId] = useState(2);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/threat/risk-scores');
      setUsers(res || []);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/register', {
        name,
        email,
        password,
        department,
        role_id: Number(roleId)
      });
      alert(`User ${name} created successfully!`);
      setShowModal(false);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'user_id' as keyof typeof users[0] },
    { header: 'User Name', accessor: 'name' as keyof typeof users[0] },
    { header: 'Email Address', accessor: 'email' as keyof typeof users[0] },
    { header: 'Role', accessor: 'role' as keyof typeof users[0] },
    { header: 'Department', accessor: 'department' as keyof typeof users[0] },
    { 
      header: 'Status', 
      accessor: (row: any) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ) 
    },
    {
      header: 'Actions',
      accessor: () => (
        <div className="flex space-x-2">
          <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Edit User">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Reset Password">
            <Key className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete User">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-text-muted mt-1">Manage accounts, roles, and access permissions across the framework.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <DataTable columns={columns} data={users} searchable />

      {/* ADD USER MODAL DIALOG */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-text-main">Add New User</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Dr. Alan Turing"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="turing@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Initial Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="password"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Department / Facility</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Computer Science / Exam Centre North"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Assign Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                >
                  <option value={2}>Professor / Content Author (Role 2)</option>
                  <option value={3}>Exam Centre Proctor (Role 3)</option>
                  <option value={1}>System Administrator (Role 1)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

