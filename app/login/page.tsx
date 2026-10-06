'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DataStore } from '@/services/store';
import { Sparkles, Lock, User, ArrowRight, HelpCircle, X, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Access Request Form State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqUsername, setReqUsername] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      error('Required Fields', 'Please enter your username/email and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(identifier.trim(), password);
    if (!res.success) {
      error('Login Failed', res.error || 'Invalid credentials.');
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqUsername.trim() || !reqEmail.trim() || !reqPassword.trim()) {
      error('Missing Fields', 'Please fill out all required sign-up fields.');
      return;
    }
    setIsSubmittingReq(true);
    try {
      DataStore.createAccessRequest({
        full_name: reqName,
        username: reqUsername,
        email: reqEmail,
        password: reqPassword,
        note: reqNote,
      });
      success(
        'Request Submitted to Admin',
        `Your account request for ${reqEmail} has been sent to the Family Administrator. You will receive an email notification upon approval.`
      );
      setRequestModalOpen(false);
      setReqName('');
      setReqUsername('');
      setReqEmail('');
      setReqPassword('');
      setReqNote('');
    } catch (err: any) {
      error('Submission Failed', err?.message || 'Failed to submit request.');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Family Expense Management
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Private Family Financial System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 sm:px-10 shadow-premium rounded-card border border-border">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1"
              >
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-900 dark:text-white"
                  placeholder="Enter username or email"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-900 dark:text-white"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isSubmitting}>
              <span>Login</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-primary font-medium hover:underline"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Request Account Access &rarr;
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
            &larr; Back to Home
          </Link>
        </div>
      </div>

      {/* Access Request Sign Up Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-card border border-border shadow-xl max-w-md w-full relative">
            <button
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 text-white flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Request Account Access</h3>
            <p className="text-xs text-gray-500 mb-4">
              Submit your registration details for Family Administrator approval.
            </p>

            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="e.g. Awais Iqbal"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={reqUsername}
                    onChange={(e) => setReqUsername(e.target.value)}
                    placeholder="e.g. awais01"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    placeholder="awais@family.com"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Desired Password
                </label>
                <input
                  type="password"
                  required
                  value={reqPassword}
                  onChange={(e) => setReqPassword(e.target.value)}
                  placeholder="Set account password"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Note to Admin (Optional)
                </label>
                <input
                  type="text"
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  placeholder="e.g. Member - Son / Family Member"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRequestModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingReq}>
                  Submit Access Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-card border border-border shadow-xl max-w-sm w-full text-center relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-primary flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Password Recovery</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              For security in this private family system, passwords are not emailed automatically.
              <br /><br />
              Please contact your <strong>Family Administrator</strong> to generate a secure temporary password reset for your account.
            </p>
            <Button variant="primary" size="sm" onClick={() => setForgotModalOpen(false)} className="w-full">
              Got It
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
