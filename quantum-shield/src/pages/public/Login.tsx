import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, User, Building } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login State
  const [email, setEmail] = useState('admin@quantumshield.com');
  const [password, setPassword] = useState('admin123');

  // Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [regRoleId, setRegRoleId] = useState(2);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      
      const res = await api.postFormUrlEncoded('/login', params);
      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        const userData = await api.get('/me');
        login(res.access_token, userData);
        
        let role_name = 'admin';
        if (userData.role_id === 2) role_name = 'professor';
        if (userData.role_id === 3) role_name = 'centre';
        navigate(`/dashboard/${role_name}`);
      }
    } catch (error: any) {
      alert(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        email: regEmail,
        name: regName,
        password: regPassword,
        department: department,
        role_id: Number(regRoleId)
      };

      const res = await api.post('/register', payload);
      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        const userData = await api.get('/me');
        login(res.access_token, userData);

        let role_name = 'professor';
        if (userData.role_id === 1) role_name = 'admin';
        if (userData.role_id === 3) role_name = 'centre';
        navigate(`/dashboard/${role_name}`);
      }
    } catch (error: any) {
      alert(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            {isRegister ? 'Register for QuantumShield Framework' : 'Sign in to QuantumShield Framework'}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex border-b border-border">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                  !isRegister
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
                onClick={() => setIsRegister(false)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                  isRegister
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
                onClick={() => setIsRegister(true)}
              >
                Create Account
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {!isRegister ? (
              /* SIGN IN FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      required
                      className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="user@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-main">Password</label>
                    <a href="#" className="text-xs text-primary hover:underline">Forgot Password?</a>
                  </div>
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

                <Button type="submit" className="w-full mt-6" size="lg" isLoading={isLoading}>
                  Sign In securely
                </Button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Dr. Grace Hopper"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
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
                      placeholder="grace.hopper@university.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="password"
                      required
                      className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main">Department / Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main">Select Role</label>
                  <select
                    value={regRoleId}
                    onChange={(e) => setRegRoleId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                  >
                    <option value={2}>Professor / Content Author</option>
                    <option value={3}>Exam Centre Proctor</option>
                    <option value={1}>System Administrator</option>
                  </select>
                </div>

                <Button type="submit" className="w-full mt-6" size="lg" isLoading={isLoading}>
                  Create Account & Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

