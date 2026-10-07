'use client';

import React, { useState, useEffect } from 'react';
import { DataStore, subscribe } from '@/services/store';
import { Profile, MemberFinancialSummary, AccessRequest } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  ExternalLink,
  KeyRound,
  Ban,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Mail,
  Send,
  UserCheck,
  XCircle,
  Trash2,
} from 'lucide-react';

export default function AdminMembersPage() {
  const { success, error } = useToast();
  const [members, setMembers] = useState<MemberFinancialSummary[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [search, setSearch] = useState('');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newInitialBudget, setNewInitialBudget] = useState('20000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Temporary Credential Display Modal (Shown ONCE only)
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ username: string; tempPass: string; memberName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Automated Email Dispatch Modal
  const [emailDispatchModalOpen, setEmailDispatchModalOpen] = useState(false);
  const [dispatchedEmail, setDispatchedEmail] = useState<{ to: string; subject: string; body: string; memberName: string } | null>(null);

  // Reset Password Modal State
  const [resetConfirmMember, setResetConfirmMember] = useState<Profile | null>(null);

  // Deletion Confirm Modal States
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<Profile | null>(null);
  const [deleteConfirmReq, setDeleteConfirmReq] = useState<AccessRequest | null>(null);

  const loadMembers = () => {
    const profiles = DataStore.getProfiles().filter((p) => p.role === 'member');
    const summaries = profiles.map((p) => DataStore.getMemberFinancialSummary(p.id));
    setMembers(summaries);
    setAccessRequests(DataStore.getAccessRequests());
  };

  useEffect(() => {
    loadMembers();
    const unsub = subscribe(loadMembers);
    return () => unsub();
  }, []);

  const handleApproveRequest = (req: AccessRequest) => {
    try {
      const res = DataStore.approveAccessRequest(req.id);
      setDispatchedEmail({
        to: res.emailDispatched.to,
        subject: res.emailDispatched.subject,
        body: res.emailDispatched.body,
        memberName: req.full_name,
      });
      setEmailDispatchModalOpen(true);
      success('Access Approved & Email Dispatched', `Account created and approval email sent directly to ${req.email}.`);
    } catch (err: any) {
      error('Approval Failed', err?.message);
    }
  };

  const handleRejectRequest = (req: AccessRequest) => {
    try {
      DataStore.rejectAccessRequest(req.id);
      success('Request Rejected', `Access request for ${req.full_name} was rejected.`);
    } catch (err: any) {
      error('Action Failed', err?.message);
    }
  };

  const handleConfirmDeleteMember = () => {
    if (!deleteConfirmMember) return;
    try {
      DataStore.deleteMember(deleteConfirmMember.id);
      success('Account Deleted', `Permanently removed member account for ${deleteConfirmMember.full_name}.`);
      setDeleteConfirmMember(null);
    } catch (err: any) {
      error('Deletion Failed', err?.message);
    }
  };

  const handleConfirmDeleteRequest = () => {
    if (!deleteConfirmReq) return;
    try {
      DataStore.deleteAccessRequest(deleteConfirmReq.id);
      success('Request Deleted', `Access request for ${deleteConfirmReq.full_name} was removed.`);
      setDeleteConfirmReq(null);
    } catch (err: any) {
      error('Deletion Failed', err?.message);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.member.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.member.username.toLowerCase().includes(search.toLowerCase()) ||
      m.member.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim()) {
      error('Validation Error', 'Full Name and Username are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const budgetNum = parseFloat(newInitialBudget);
      const res = DataStore.createMember({
        full_name: newFullName.trim(),
        username: newUsername.trim(),
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
        initial_budget: isNaN(budgetNum) ? 0 : budgetNum,
      });

      setIsAddModalOpen(false);
      setGeneratedCreds({
        username: res.profile.username,
        tempPass: res.temporaryPassword,
        memberName: res.profile.full_name,
      });
      setCredentialModalOpen(true);
      setCopied(false);

      // Reset fields
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      setNewPhone('');
      setNewInitialBudget('20000');
      success('Account Created', 'Member created and temporary credentials generated.');
    } catch (err: any) {
      error('Failed to Create Member', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    if (!resetConfirmMember) return;
    try {
      const res = DataStore.adminResetPassword(resetConfirmMember.id);
      setGeneratedCreds({
        username: res.username,
        tempPass: res.temporaryPassword,
        memberName: resetConfirmMember.full_name,
      });
      setResetConfirmMember(null);
      setCredentialModalOpen(true);
      setCopied(false);
      success('Password Reset', `Generated new temporary password for ${resetConfirmMember.full_name}.`);
    } catch (err: any) {
      error('Reset Failed', err?.message);
    }
  };

  const handleToggleStatus = (member: Profile) => {
    const actionLabel = member.status === 'disabled' ? 'Reactivate' : 'Disable';
    if (window.confirm(`${actionLabel} account for ${member.full_name}? Financial records will be preserved.`)) {
      try {
        const updated = DataStore.toggleMemberAccountStatus(member.id);
        success('Status Updated', `${updated.full_name} is now ${updated.status}.`);
      } catch (err: any) {
        error('Failed', err?.message);
      }
    }
  };

  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const text = `Username: ${generatedCreds.username}\nTemporary Password: ${generatedCreds.tempPass}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Family Members</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage member credentials, password resets, and account access
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span>Add Member</span>
        </Button>
      </div>

      {/* Pending Access Requests Queue */}
      {accessRequests.filter((r) => r.status === 'pending').length > 0 && (
        <Card className="p-5 border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-50/70 via-white to-white dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-900 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
                {accessRequests.filter((r) => r.status === 'pending').length}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pending Account Access Requests</h3>
                <p className="text-[11px] text-gray-500">
                  Review registrations. Approving automatically creates account &amp; dispatches email notification.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/80 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Requested Username</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Note / Relation</th>
                  <th className="py-2.5 px-3">Submitted</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accessRequests
                  .filter((r) => r.status === 'pending')
                  .map((req) => (
                    <tr key={req.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20">
                      <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{req.full_name}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-primary">{req.username}</td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300 font-medium">{req.email}</td>
                      <td className="py-2.5 px-3 text-gray-500 italic">{req.note || 'Family Member'}</td>
                      <td className="py-2.5 px-3 text-gray-400 text-[11px]">{formatDateTime(req.created_at)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveRequest(req)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Approve &amp; Send Email</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectRequest(req)}
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          >
                            <span>Reject</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmReq(req)}
                            className="text-red-600 border-red-200 hover:bg-red-50 p-1.5"
                            title="Permanently Delete Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Search & Stats Bar */}
      <Card className="p-4 bg-white dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>
              Total: <strong className="text-gray-900 dark:text-white">{members.length}</strong> members
            </span>
            <span>&bull;</span>
            <span>
              Active:{' '}
              <strong className="text-emerald-600">
                {members.filter((m) => m.member.status === 'active').length}
              </strong>
            </span>
            <span>&bull;</span>
            <span>
              Disabled:{' '}
              <strong className="text-red-500">
                {members.filter((m) => m.member.status === 'disabled').length}
              </strong>
            </span>
          </div>
        </div>
      </Card>

      {/* Desktop Table View (Section 4) */}
      <div className="hidden md:block">
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Username / Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Account Created</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((item) => (
                <tr key={item.member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.member.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                        alt={item.member.full_name}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {item.member.full_name}
                        </span>
                        {item.member.must_change_password && (
                          <span className="text-[10px] text-amber-600 font-medium">Temp password active</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-semibold text-primary block">{item.member.username}</span>
                    <span className="text-[11px] text-gray-400">{item.member.email}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        item.member.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                      }`}
                    >
                      {item.member.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium capitalize text-gray-600 dark:text-gray-300">
                    {item.member.role}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {formatDate(item.member.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {item.member.last_login_at ? formatDateTime(item.member.last_login_at) : 'Never'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/members/${item.member.id}`}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                        title="View financial ledger"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setResetConfirmMember(item.member)}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-primary rounded-lg hover:bg-indigo-100 transition-colors"
                        title="Reset Password"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item.member)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          item.member.status === 'active'
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40'
                        }`}
                      >
                        {item.member.status === 'active' ? 'Disable' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmMember(item.member)}
                        className="p-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete Member Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredMembers.map((item) => (
          <Card key={item.member.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <img
                  src={item.member.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  alt={item.member.full_name}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    {item.member.full_name}
                  </h3>
                  <span className="font-mono text-xs text-primary font-semibold">@{item.member.username}</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  item.member.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {item.member.status}
              </span>
            </div>

            <div className="py-2 border-y border-border text-xs space-y-1 mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span>{formatDate(item.member.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Login:</span>
                <span>{item.member.last_login_at ? formatDateTime(item.member.last_login_at) : 'Never'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/admin/members/${item.member.id}`}
                className="flex-1 py-1.5 text-center text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg"
              >
                View
              </Link>
              <button
                onClick={() => setResetConfirmMember(item.member)}
                className="flex-1 py-1.5 text-center text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-primary rounded-lg"
              >
                Reset Password
              </button>
              <button
                onClick={() => handleToggleStatus(item.member)}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg ${
                  item.member.status === 'active'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {item.member.status === 'active' ? 'Disable' : 'Reactivate'}
              </button>
              <button
                onClick={() => setDeleteConfirmMember(item.member)}
                className="py-1.5 px-2.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg"
                title="Delete Member Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Member Account Modal (Section 5) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Member Account"
        description="Create an individual account and generate a private temporary password"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Awais Iqbal"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. awais01"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Email (Optional / If required)
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="awais@family.com"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Phone (Optional)
            </label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+92 300 0000000"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Initial Allocated Allowance (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={newInitialBudget}
              onChange={(e) => setNewInitialBudget(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white font-bold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Confirmation Dialog (Section 7) */}
      {resetConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-card border border-border shadow-xl max-w-sm w-full">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Reset {resetConfirmMember.full_name}&apos;s Password?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              This will invalidate their existing password and generate a new temporary password. They will be required to choose a new password upon login.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setResetConfirmMember(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleResetPassword}>
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Temporary Credentials Display Modal (Shown ONCE only - Section 5 & 7) */}
      {credentialModalOpen && generatedCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-card border border-border shadow-2xl max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Credentials Generated</h2>
            <p className="text-xs text-gray-500 mb-4">
              Temporary credentials for <strong>{generatedCreds.memberName}</strong>:
            </p>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-border space-y-2 mb-4 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-sans">Username:</span>
                <span className="font-bold text-gray-900 dark:text-white select-all">{generatedCreds.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-sans">Temporary Password:</span>
                <span className="font-bold text-primary select-all">{generatedCreds.tempPass}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCredentials}
              className="w-full mb-4 gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
            </Button>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mb-6">
              <strong>Security Notice:</strong> Share this temporary password privately with the member. It will NOT be shown again. The member will be required to set their own password immediately upon login.
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                setCredentialModalOpen(false);
                setGeneratedCreds(null);
              }}
              className="w-full"
            >
              Done / Close
            </Button>
          </div>
        </div>
      )}

      {/* Automated Email Dispatch Confirmation Modal */}
      {emailDispatchModalOpen && dispatchedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-card border border-border shadow-2xl max-w-lg w-full relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-primary flex items-center justify-center">
                <Send className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Email Dispatched Directly</h2>
                <p className="text-xs text-gray-500">
                  Account approval notification delivered to <strong>{dispatchedEmail.to}</strong>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-border space-y-3 mb-4 text-xs">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <span className="font-semibold text-gray-500 w-16">To:</span>
                <span className="font-bold text-gray-900 dark:text-white">{dispatchedEmail.to}</span>
              </div>
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <span className="font-semibold text-gray-500 w-16">Subject:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{dispatchedEmail.subject}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block mb-1">Email Body:</span>
                <pre className="whitespace-pre-wrap font-sans text-xs bg-white dark:bg-gray-900 p-3 rounded-lg border border-border text-gray-800 dark:text-gray-200 leading-relaxed">
                  {dispatchedEmail.body}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(dispatchedEmail.body);
                  success('Email Content Copied', 'Email body copied to clipboard.');
                }}
                className="gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Email Text</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEmailDispatchModalOpen(false);
                  setDispatchedEmail(null);
                }}
              >
                Close &amp; Finish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {deleteConfirmMember && (
        <Modal
          isOpen={!!deleteConfirmMember}
          onClose={() => setDeleteConfirmMember(null)}
          title="Delete Member Account"
          description="Permanently remove this member profile and all associated data"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900 dark:text-red-200 space-y-1">
                <p className="font-bold">Warning: This action cannot be undone!</p>
                <p>
                  You are about to permanently delete <strong>{deleteConfirmMember.full_name}</strong> (@{deleteConfirmMember.username}).
                </p>
                <p className="text-[11px] opacity-90">
                  All associated financial records, monthly budgets, expense logs, and credentials for this member will be permanently scrubbed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmMember(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDeleteMember}
                className="bg-red-600 hover:bg-red-700 text-white gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete Account</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Access Request Confirmation Modal */}
      {deleteConfirmReq && (
        <Modal
          isOpen={!!deleteConfirmReq}
          onClose={() => setDeleteConfirmReq(null)}
          title="Delete Access Request"
          description="Remove pending sign-in request"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Are you sure?</p>
                <p>
                  This will remove the access request submitted by <strong>{deleteConfirmReq.full_name}</strong> ({deleteConfirmReq.email}).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmReq(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDeleteRequest}
                className="bg-red-600 hover:bg-red-700 text-white gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Request</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
