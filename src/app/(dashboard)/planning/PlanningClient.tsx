"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WorkspaceView = "plans" | "documents" | "team";
type PlanPeriod = "Year" | "Month" | "Week" | "Day";
type MemberAccess = "member" | "admin";
type PlanStatus = "posted" | "seen" | "working" | "done";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  access: MemberAccess;
  inviteStatus: "pending" | "joined";
  canAccessWear: boolean;
  canAccessLibrary: boolean;
}

interface WorkspacePlan {
  id: string;
  period: PlanPeriod;
  title: string;
  message: string;
  ownerId: string;
  date: string;
  notifyEmail: boolean;
  notifySms: boolean;
  status: PlanStatus;
  createdAt: string;
}

interface WorkspaceDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  ownerId: string;
}

interface PlanningClientProps {
  initialView?: WorkspaceView;
}

const TEAM_KEY = "sd-simple-team";
const PLAN_KEY = "sd-simple-plans";
const DOC_KEY = "sd-simple-documents";

const periods: PlanPeriod[] = ["Year", "Month", "Week", "Day"];

const statusLabels: Record<PlanStatus, string> = {
  posted: "Posted",
  seen: "Seen",
  working: "Working",
  done: "Done",
};

const starterTeam: TeamMember[] = [
  {
    id: "admin",
    name: "Workspace Admin",
    email: "admin@selfdiscovery.com",
    phone: "",
    role: "Admin",
    access: "admin",
    inviteStatus: "joined",
    canAccessWear: true,
    canAccessLibrary: true,
  },
  {
    id: "team",
    name: "Team Member",
    email: "team@selfdiscovery.com",
    phone: "",
    role: "General team",
    access: "member",
    inviteStatus: "pending",
    canAccessWear: false,
    canAccessLibrary: false,
  },
];

const starterPlans: WorkspacePlan[] = [
  {
    id: "year-plan",
    period: "Year",
    title: "2026 company direction",
    message: "Keep the team aligned on the main goals, focus areas, and responsibilities for the year.",
    ownerId: "admin",
    date: "2026-12-31",
    notifyEmail: true,
    notifySms: false,
    status: "posted",
    createdAt: "2026-05-26",
  },
  {
    id: "week-plan",
    period: "Week",
    title: "This week priorities",
    message: "Review the weekly agenda, confirm what you have seen, and update progress on assigned work.",
    ownerId: "admin",
    date: "2026-05-29",
    notifyEmail: true,
    notifySms: true,
    status: "working",
    createdAt: "2026-05-26",
  },
];

const starterDocs: WorkspaceDocument[] = [
  {
    id: "agenda",
    name: "Weekly agenda.pdf",
    size: 240000,
    type: "application/pdf",
    uploadedAt: "2026-05-26",
    ownerId: "admin",
  },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readSaved<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function fileSize(size: number) {
  if (size < 1000) return `${size} B`;
  if (size < 1000 * 1000) return `${Math.round(size / 1000)} KB`;
  return `${(size / 1000 / 1000).toFixed(1)} MB`;
}

export function PlanningClient({ initialView = "plans" }: PlanningClientProps) {
  const [view, setView] = useState<WorkspaceView>(initialView);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [plans, setPlans] = useState<WorkspacePlan[]>([]);
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [periodFilter, setPeriodFilter] = useState<"All" | PlanPeriod>("All");
  const [planForm, setPlanForm] = useState({
    period: "Week" as PlanPeriod,
    title: "",
    message: "",
    ownerId: "",
    date: today(),
    notifyEmail: true,
    notifySms: false,
  });
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    access: "member" as MemberAccess,
  });

  useEffect(() => {
    const savedTeam = readSaved<TeamMember[]>(TEAM_KEY, starterTeam);
    setTeam(savedTeam);
    setPlans(readSaved<WorkspacePlan[]>(PLAN_KEY, starterPlans));
    setDocuments(readSaved<WorkspaceDocument[]>(DOC_KEY, starterDocs));
    setPlanForm((current) => ({ ...current, ownerId: savedTeam[0]?.id ?? "" }));
  }, []);

  useEffect(() => {
    if (team.length > 0) window.localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    if (plans.length > 0) window.localStorage.setItem(PLAN_KEY, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    window.localStorage.setItem(DOC_KEY, JSON.stringify(documents));
  }, [documents]);

  const teamById = useMemo(() => new Map(team.map((member) => [member.id, member])), [team]);
  const visiblePlans = useMemo(
    () =>
      plans
        .filter((plan) => periodFilter === "All" || plan.period === periodFilter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [periodFilter, plans]
  );

  const addPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planForm.title.trim() || !planForm.message.trim()) return;

    setPlans((current) => [
      {
        id: id("plan"),
        period: planForm.period,
        title: planForm.title.trim(),
        message: planForm.message.trim(),
        ownerId: planForm.ownerId || team[0]?.id || "",
        date: planForm.date,
        notifyEmail: planForm.notifyEmail,
        notifySms: planForm.notifySms,
        status: "posted",
        createdAt: today(),
      },
      ...current,
    ]);

    setPlanForm((current) => ({
      ...current,
      period: "Week",
      title: "",
      message: "",
      date: today(),
    }));
  };

  const addMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberForm.name.trim() || !memberForm.email.trim()) return;

    setTeam((current) => [
      ...current,
      {
        id: id("member"),
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        phone: memberForm.phone.trim(),
        role: memberForm.role.trim() || "Team member",
        access: memberForm.access,
        inviteStatus: "pending",
        canAccessWear: memberForm.access === "admin",
        canAccessLibrary: memberForm.access === "admin",
      },
    ]);

    setMemberForm({ name: "", email: "", phone: "", role: "", access: "member" });
  };

  const addDocuments = (files: FileList | null) => {
    if (!files) return;

    setDocuments((current) => [
      ...Array.from(files).map((file) => ({
        id: id("doc"),
        name: file.name,
        size: file.size,
        type: file.type || "Document",
        uploadedAt: today(),
        ownerId: team[0]?.id || "",
      })),
      ...current,
    ]);
  };

  const updateMember = (memberId: string, patch: Partial<TeamMember>) => {
    setTeam((current) => current.map((member) => (member.id === memberId ? { ...member, ...patch } : member)));
  };

  const updatePlan = (planId: string, patch: Partial<WorkspacePlan>) => {
    setPlans((current) => current.map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan)));
  };

  const deletePlan = (planId: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId));
  };

  const deleteDocument = (docId: string) => {
    setDocuments((current) => current.filter((document) => document.id !== docId));
  };

  const stats = [
    { label: "Posted plans", value: plans.length, icon: ClipboardList },
    { label: "Documents", value: documents.length, icon: FolderOpen },
    { label: "Team members", value: team.length, icon: UsersRound },
    { label: "Admins", value: team.filter((member) => member.access === "admin").length, icon: ShieldCheck },
  ];

  return (
    <div className="animate-fade-in space-y-7">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-label mb-2">Team Workspace</p>
          <h1 className="text-[32px] font-semibold leading-[1.1] tracking-tight text-[#1d1d1f] sm:text-[36px]">
            {view === "plans" ? "Plans" : view === "documents" ? "Documents" : "Team Members"}
          </h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[#86868b]">
            A simple place for yearly, monthly, weekly, and daily plans, shared documents, and invited team members.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <WorkspaceTab active={view === "plans"} onClick={() => setView("plans")} icon={ClipboardList}>Plans</WorkspaceTab>
          <WorkspaceTab active={view === "documents"} onClick={() => setView("documents")} icon={FolderOpen}>Documents</WorkspaceTab>
          <WorkspaceTab active={view === "team"} onClick={() => setView("team")} icon={UsersRound}>Team</WorkspaceTab>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-[#86868b]">{stat.label}</p>
                <p className="mt-2 text-[30px] font-semibold tracking-tight text-[#1d1d1f]">{stat.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0071e3]/10">
                <stat.icon className="h-5 w-5 text-[#0071e3]" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {view === "plans" && (
        <PlansView
          team={team}
          teamById={teamById}
          form={planForm}
          setForm={setPlanForm}
          addPlan={addPlan}
          plans={visiblePlans}
          periodFilter={periodFilter}
          setPeriodFilter={setPeriodFilter}
          updatePlan={updatePlan}
          deletePlan={deletePlan}
        />
      )}

      {view === "documents" && (
        <DocumentsView documents={documents} teamById={teamById} addDocuments={addDocuments} deleteDocument={deleteDocument} />
      )}

      {view === "team" && (
        <TeamView
          team={team}
          form={memberForm}
          setForm={setMemberForm}
          addMember={addMember}
          updateMember={updateMember}
        />
      )}
    </div>
  );
}

function WorkspaceTab({
  children,
  active,
  onClick,
  icon: Icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[14px] font-semibold transition",
        active ? "bg-[#1d1d1f] text-white" : "bg-white text-[#424245] ring-1 ring-black/[0.08] hover:bg-black/[0.03]"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function PlansView({
  team,
  teamById,
  form,
  setForm,
  addPlan,
  plans,
  periodFilter,
  setPeriodFilter,
  updatePlan,
  deletePlan,
}: {
  team: TeamMember[];
  teamById: Map<string, TeamMember>;
  form: {
    period: PlanPeriod;
    title: string;
    message: string;
    ownerId: string;
    date: string;
    notifyEmail: boolean;
    notifySms: boolean;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    period: PlanPeriod;
    title: string;
    message: string;
    ownerId: string;
    date: string;
    notifyEmail: boolean;
    notifySms: boolean;
  }>>;
  addPlan: (event: FormEvent<HTMLFormElement>) => void;
  plans: WorkspacePlan[];
  periodFilter: "All" | PlanPeriod;
  setPeriodFilter: (period: "All" | PlanPeriod) => void;
  updatePlan: (planId: string, patch: Partial<WorkspacePlan>) => void;
  deletePlan: (planId: string) => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={addPlan} className="surface-panel h-fit space-y-4 p-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">Create plan</h2>
          <p className="mt-1 text-[13px] text-[#86868b]">Admins can post updates for the year, month, week, or day.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[13px] font-medium text-[#424245]">Period</span>
            <select
              value={form.period}
              onChange={(event) => setForm((current) => ({ ...current, period: event.target.value as PlanPeriod }))}
              className="h-10 w-full rounded-[10px] border border-black/[0.08] bg-[#f5f5f7] px-3 text-[14px] outline-none focus:border-[#0071e3]/50 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
            >
              {periods.map((period) => <option key={period}>{period}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[13px] font-medium text-[#424245]">Posted by</span>
            <select
              value={form.ownerId}
              onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))}
              className="h-10 w-full rounded-[10px] border border-black/[0.08] bg-[#f5f5f7] px-3 text-[14px] outline-none focus:border-[#0071e3]/50 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
            >
              {team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>
        </div>
        <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Plan title" />
        <textarea
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder="Write the plan, agenda, instruction, or update"
          className="min-h-[140px] w-full resize-y rounded-[10px] border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-[14px] outline-none placeholder:text-[#86868b] focus:border-[#0071e3]/50 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
        />
        <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-[10px] bg-[#f5f5f7] px-3 py-2 text-[13px] font-medium text-[#424245]">
            <input type="checkbox" checked={form.notifyEmail} onChange={(event) => setForm((current) => ({ ...current, notifyEmail: event.target.checked }))} />
            Email team
          </label>
          <label className="flex items-center gap-2 rounded-[10px] bg-[#f5f5f7] px-3 py-2 text-[13px] font-medium text-[#424245]">
            <input type="checkbox" checked={form.notifySms} onChange={(event) => setForm((current) => ({ ...current, notifySms: event.target.checked }))} />
            SMS team
          </label>
        </div>
        <Button type="submit" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Post plan
        </Button>
        <p className="rounded-[10px] bg-[#e8f2ff] p-3 text-[12px] leading-5 text-[#245a93]">
          Email and SMS are prepared as settings here. The production version will connect these to an email/SMS provider.
        </p>
      </form>

      <div className="space-y-4">
        <div className="surface-panel p-4">
          <div className="flex flex-wrap gap-2">
            {(["All", ...periods] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setPeriodFilter(period)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-semibold transition",
                  periodFilter === period ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.06]"
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        {plans.map((plan) => (
          <article key={plan.id} className="surface-panel overflow-hidden">
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-[#f5f5f7] text-[#424245]">{plan.period} plan</Badge>
                    <Badge variant="secondary" className="bg-[#eaf8ee] text-[#1f8f46]">{statusLabels[plan.status]}</Badge>
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#1d1d1f]">{plan.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-[14px] leading-6 text-[#424245]">{plan.message}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => deletePlan(plan.id)} className="text-[#86868b] hover:text-[#ff3b30]">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 border-t border-black/[0.04] pt-4 md:grid-cols-3">
                <SmallInfo icon={CalendarDays} label="Plan date" value={formatDate(plan.date)} />
                <SmallInfo icon={UsersRound} label="Posted by" value={teamById.get(plan.ownerId)?.name ?? "Workspace"} />
                <div>
                  <p className="text-[12px] font-medium text-[#86868b]">Team action</p>
                  <select
                    value={plan.status}
                    onChange={(event) => updatePlan(plan.id, { status: event.target.value as PlanStatus })}
                    className="mt-1 h-10 w-full rounded-[10px] border border-black/[0.08] bg-[#f5f5f7] px-3 text-[14px] outline-none focus:border-[#0071e3]/50 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.notifyEmail && <Badge variant="secondary" className="bg-[#e8f2ff] text-[#0071e3]"><Mail className="mr-1 h-3 w-3" /> Email notice</Badge>}
                {plan.notifySms && <Badge variant="secondary" className="bg-[#fff4e5] text-[#b76100]"><Phone className="mr-1 h-3 w-3" /> SMS notice</Badge>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DocumentsView({
  documents,
  teamById,
  addDocuments,
  deleteDocument,
}: {
  documents: WorkspaceDocument[];
  teamById: Map<string, TeamMember>;
  addDocuments: (files: FileList | null) => void;
  deleteDocument: (docId: string) => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <div className="surface-panel h-fit p-5">
        <h2 className="text-[18px] font-semibold text-[#1d1d1f]">Upload document</h2>
        <p className="mt-1 text-[13px] leading-5 text-[#86868b]">Keep agendas, PDFs, reports, and instructions here instead of losing them in WhatsApp chats.</p>
        <label className="mt-5 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-black/[0.16] bg-[#f5f5f7] p-6 text-center transition hover:bg-black/[0.04]">
          <Upload className="mb-3 h-8 w-8 text-[#86868b]" strokeWidth={1.5} />
          <span className="text-[14px] font-semibold text-[#1d1d1f]">Choose files</span>
          <span className="mt-1 text-[12px] text-[#86868b]">PDF, docs, images, or spreadsheets</span>
          <input type="file" multiple className="sr-only" onChange={(event) => addDocuments(event.target.files)} />
        </label>
      </div>
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-black/[0.04] p-5">
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">Shared documents</h2>
          <p className="mt-1 text-[13px] text-[#86868b]">{documents.length} files available to team members.</p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff]">
                  <FileText className="h-5 w-5 text-[#0071e3]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#1d1d1f]">{document.name}</p>
                  <p className="text-[12px] text-[#86868b]">
                    {fileSize(document.size)} · Uploaded {formatDate(document.uploadedAt)} by {teamById.get(document.ownerId)?.name ?? "Workspace"}
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => deleteDocument(document.id)} className="text-[#86868b] hover:text-[#ff3b30]">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamView({
  team,
  form,
  setForm,
  addMember,
  updateMember,
}: {
  team: TeamMember[];
  form: { name: string; email: string; phone: string; role: string; access: MemberAccess };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; role: string; access: MemberAccess }>>;
  addMember: (event: FormEvent<HTMLFormElement>) => void;
  updateMember: (memberId: string, patch: Partial<TeamMember>) => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={addMember} className="surface-panel h-fit space-y-4 p-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">Invite team member</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#86868b]">Only invited team members should be able to sign in and access the workspace.</p>
        </div>
        <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" />
        <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" />
        <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone for SMS" />
        <Input value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} placeholder="Role" />
        <select
          value={form.access}
          onChange={(event) => setForm((current) => ({ ...current, access: event.target.value as MemberAccess }))}
          className="h-10 w-full rounded-[10px] border border-black/[0.08] bg-[#f5f5f7] px-3 text-[14px] outline-none focus:border-[#0071e3]/50 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
        >
          <option value="member">Team workspace only</option>
          <option value="admin">Admin access</option>
        </select>
        <Button type="submit" className="w-full gap-2">
          <UserPlus className="h-4 w-4" />
          Send invite
        </Button>
      </form>

      <div className="surface-panel overflow-hidden">
        <div className="border-b border-black/[0.04] p-5">
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">Team access</h2>
          <p className="mt-1 text-[13px] text-[#86868b]">Workspace is for all team members. Wear and Library can be limited to admins or assigned people.</p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {team.map((member) => (
            <div key={member.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_220px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-semibold text-[#1d1d1f]">{member.name}</h3>
                  <Badge variant="secondary" className={cn(member.inviteStatus === "joined" ? "bg-[#eaf8ee] text-[#1f8f46]" : "bg-[#fff4e5] text-[#b76100]")}>
                    {member.inviteStatus === "joined" ? "Joined" : "Invite pending"}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#f5f5f7] text-[#424245]">{member.access === "admin" ? "Admin" : "Team member"}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-[#86868b]">{member.role}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#86868b]">
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{member.email}</span>
                  {member.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{member.phone}</span>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center justify-between gap-3 rounded-[10px] bg-[#f5f5f7] px-3 py-2 text-[13px] font-medium text-[#424245]">
                  Wear
                  <input type="checkbox" checked={member.canAccessWear} onChange={(event) => updateMember(member.id, { canAccessWear: event.target.checked })} />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-[10px] bg-[#f5f5f7] px-3 py-2 text-[13px] font-medium text-[#424245]">
                  Library
                  <input type="checkbox" checked={member.canAccessLibrary} onChange={(event) => updateMember(member.id, { canAccessLibrary: event.target.checked })} />
                </label>
                <Button type="button" variant="outline" size="sm" onClick={() => updateMember(member.id, { inviteStatus: "joined" })} className="w-full gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark joined
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SmallInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#86868b]" />
      <div>
        <p className="text-[12px] font-medium text-[#86868b]">{label}</p>
        <p className="text-[14px] font-semibold text-[#1d1d1f]">{value}</p>
      </div>
    </div>
  );
}
