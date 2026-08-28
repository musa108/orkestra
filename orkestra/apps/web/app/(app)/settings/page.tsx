'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api, ApiError } from '@/lib/api';
import {
  User,
  Building2,
  Users,
  Cpu,
  ShieldCheck,
  Save,
  Check,
  Plus,
  Lock,
} from 'lucide-react';
import clsx from 'clsx';

type Tab = 'profile' | 'organization' | 'team' | 'ai' | 'security';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [aiProvider, setAiProvider] = useState('adk');

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState('TEAM_MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    api.me().then((u: any) => {
      setUser(u);
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setEmail(u.email || '');

      if (u.organizationId) {
        api.organization(u.organizationId).then((org: any) => {
          setOrganization(org);
          setOrgName(org.name || '');
        }).catch(() => void 0);
      }
    }).catch(() => void 0);

    api.users().then((res: any) => {
      setTeamMembers(Array.isArray(res) ? res : res?.data ?? []);
    }).catch(() => void 0);
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateUser(user.id, {
        firstName,
        lastName,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrganization(e: React.FormEvent) {
    e.preventDefault();
    if (!organization?.id) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateOrganization(organization.id, { name: orgName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save organization.');
    } finally {
      setSaving(false);
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await api.createUser({
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        role: inviteRole,
        password: 'ChangeMe123!',
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      // Refresh list
      const res: any = await api.users();
      setTeamMembers(Array.isArray(res) ? res : res?.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add team member.');
    } finally {
      setInviteLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'organization', label: 'Organization & Workspace', icon: Building2 },
    { id: 'team', label: 'Team & RBAC', icon: Users },
    { id: 'ai', label: 'AI Engine Integration', icon: Cpu },
    { id: 'security', label: 'Security & Sessions', icon: ShieldCheck },
  ];

  return (
    <>
      <Header
        title="Settings"
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header Summary */}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-foreground">Studio & System Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal profile, organization settings, role-based access, and AI engine providers.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-sm text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer shrink-0',
                activeTab === id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="card-enterprise p-6 space-y-5 max-w-xl">
            <div>
              <h2 className="text-xs font-bold text-foreground">Personal Identity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your name and producer credentials.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-enterprise"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-enterprise"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="input-enterprise bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-accent text-xs px-4 py-2"
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                <span>{saving ? 'Saving changes…' : saved ? 'Saved successfully' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Organization Settings */}
        {activeTab === 'organization' && (
          <form onSubmit={handleSaveOrganization} className="card-enterprise p-6 space-y-5 max-w-xl">
            <div>
              <h2 className="text-xs font-bold text-foreground">Organization Workspace</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Studio workspace details and configuration.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="input-enterprise"
                />
              </div>

              {organization?.id && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Organization ID</label>
                  <input
                    type="text"
                    disabled
                    value={organization.id}
                    className="input-enterprise bg-muted text-muted-foreground cursor-not-allowed font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-accent text-xs px-4 py-2"
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                <span>{saving ? 'Saving changes…' : saved ? 'Saved successfully' : 'Save Organization'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Team RBAC */}
        {activeTab === 'team' && (
          <div className="card-enterprise divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-foreground">Team Members & Permissions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Active members registered in your organization workspace.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                <Plus size={13} /> Add Member
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5 px-4">Member Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Assigned Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-muted-foreground">
                        No team members loaded.
                      </td>
                    </tr>
                  ) : (
                    teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-foreground">
                          {m.firstName} {m.lastName}
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground">{m.email}</td>
                        <td className="py-2.5 px-4 font-mono">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-semibold">
                            {m.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: AI Providers */}
        {activeTab === 'ai' && (
          <div className="card-enterprise p-6 space-y-4 max-w-2xl">
            <div>
              <h2 className="text-xs font-bold text-foreground">AI Engine & Model Configuration</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select the underlying reasoning engine and orchestration framework for all 7 agents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'adk', title: 'Google ADK Engine', desc: 'Google Agent Builder + MCP tools', badge: 'Default' },
                { id: 'gemini', title: 'Gemini 1.5 Pro', desc: 'Direct Google GenAI SDK calls', badge: 'Fast' },
                { id: 'mock', title: 'Offline Test Engine', desc: 'Deterministic mock runner', badge: 'Fallback' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setAiProvider(p.id)}
                  className={clsx(
                    'p-3.5 rounded-sm border cursor-pointer transition-all space-y-1.5',
                    aiProvider === p.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-subtle'
                      : 'bg-card border-border hover:border-slate-300 dark:hover:border-slate-700',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold">{p.title}</h3>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted/40 text-current">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Security & Active Sessions */}
        {activeTab === 'security' && (
          <div className="card-enterprise p-6 space-y-4 max-w-xl">
            <div>
              <h2 className="text-xs font-bold text-foreground">Security & Active Sessions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitor authenticated browser sessions and JWT security enforcement.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-muted/40 border border-border flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock size={13} className="text-emerald-600 dark:text-emerald-400" /> Current Authenticated Session
                </p>
                <p className="text-[11px] text-muted-foreground">User: {user?.email || 'Logged in user'}</p>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-md shadow-elevated p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Add Team Member</h3>
            <form onSubmit={handleInviteMember} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">First Name</label>
                  <input
                    required
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="input-enterprise"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Last Name</label>
                  <input
                    required
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="input-enterprise"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input-enterprise"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="input-enterprise"
                >
                  <option value="EXECUTIVE_PRODUCER">Executive Producer</option>
                  <option value="PRODUCTION_MANAGER">Production Manager</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="btn-accent text-xs"
                >
                  {inviteLoading ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
