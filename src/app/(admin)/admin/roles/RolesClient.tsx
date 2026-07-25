"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Lock, Plus, Trash2 } from "lucide-react";
import {
  createRole,
  deleteRole,
  setRolePermission,
  type RoleMatrix,
} from "@/lib/actions/roles";
import { MODULE_LABELS, type ModuleId } from "@/lib/rbac/types";
import {
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  Modal,
} from "@/components/admin/primitives";

function groupLabel(moduleId: string | null) {
  if (!moduleId) return "Platform administration";
  return MODULE_LABELS[moduleId as ModuleId] ?? moduleId;
}

export function RolesClient({ matrix }: { matrix: RoleMatrix }) {
  const [assignments, setAssignments] = useState<Record<string, string[]>>(matrix.assignments);
  const [roles, setRoles] = useState(matrix.roles);
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", copyFrom: "" });
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const groups = new Map<string | null, typeof matrix.permissions>();
    for (const permission of matrix.permissions) {
      const list = groups.get(permission.module_id) || [];
      list.push(permission);
      groups.set(permission.module_id, list);
    }
    // Modules first, platform-wide permissions last
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a.localeCompare(b);
    });
  }, [matrix.permissions]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const granted = new Set(assignments[selectedRoleId] || []);
  const isSuperAdmin = selectedRoleId === "super_admin";

  const toggle = (permissionId: string) => {
    if (isSuperAdmin) return;
    const next = !granted.has(permissionId);

    setAssignments((prev) => {
      const current = new Set(prev[selectedRoleId] || []);
      if (next) current.add(permissionId);
      else current.delete(permissionId);
      return { ...prev, [selectedRoleId]: Array.from(current) };
    });

    setError(null);
    startTransition(async () => {
      try {
        await setRolePermission(selectedRoleId, permissionId, next);
      } catch (err) {
        // Roll the optimistic change back when the server rejects it
        setAssignments((prev) => {
          const current = new Set(prev[selectedRoleId] || []);
          if (next) current.delete(permissionId);
          else current.add(permissionId);
          return { ...prev, [selectedRoleId]: Array.from(current) };
        });
        setError(err instanceof Error ? err.message : "Could not update the permission.");
      }
    });
  };

  const submitNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await createRole({
          id: newRole.name,
          name: newRole.name,
          description: newRole.description,
          copyFromRoleId: newRole.copyFrom || undefined,
        });

        setRoles((prev) => [
          ...prev,
          {
            id: result.id,
            name: newRole.name,
            description: newRole.description || null,
            is_system: false,
            member_count: 0,
          },
        ]);
        setAssignments((prev) => ({
          ...prev,
          [result.id]: newRole.copyFrom ? [...(prev[newRole.copyFrom] || [])] : [],
        }));
        setSelectedRoleId(result.id);
        setCreateOpen(false);
        setNewRole({ name: "", description: "", copyFrom: "" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the role.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-black/[0.06] bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
              Roles
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg p-1 text-[#0071e3] transition hover:bg-[#0071e3]/10"
              aria-label="Create role"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <ul className="space-y-0.5">
            {roles.map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                    selectedRoleId === role.id
                      ? "bg-[#1d1d1f] text-white"
                      : "text-[#424245] hover:bg-black/[0.04]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{role.name}</span>
                    <span
                      className={`block truncate text-[12px] ${
                        selectedRoleId === role.id ? "text-white/60" : "text-[#86868b]"
                      }`}
                    >
                      {(assignments[role.id] || []).length} permissions
                    </span>
                  </span>
                  {role.is_system && (
                    <Lock
                      className={`h-3.5 w-3.5 shrink-0 ${
                        selectedRoleId === role.id ? "text-white/50" : "text-[#86868b]"
                      }`}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-3xl border border-black/[0.06] bg-white shadow-sm">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] px-6 py-5">
            <div>
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
                {selectedRole?.name ?? "Select a role"}
              </h2>
              <p className="mt-0.5 text-[13px] text-[#86868b]">
                {isSuperAdmin
                  ? "Super Admin always holds every permission and cannot be edited."
                  : selectedRole?.description || "Choose what this role can do in each module."}
              </p>
            </div>

            {selectedRole && !selectedRole.is_system && (
              <button
                type="button"
                disabled={pending}
                className={buttonDanger}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deleteRole(selectedRole.id);
                      setRoles((prev) => prev.filter((r) => r.id !== selectedRole.id));
                      setSelectedRoleId(roles[0]?.id ?? "");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not delete the role.");
                    }
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
                Delete role
              </button>
            )}
          </header>

          <div className="divide-y divide-black/[0.04]">
            {grouped.map(([moduleId, permissions]) => (
              <div key={moduleId ?? "platform"} className="px-6 py-5">
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#86868b]">
                  {groupLabel(moduleId)}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissions.map((permission) => {
                    const isOn = isSuperAdmin || granted.has(permission.id);
                    return (
                      <button
                        key={permission.id}
                        type="button"
                        disabled={isSuperAdmin || pending}
                        onClick={() => toggle(permission.id)}
                        className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                          isOn
                            ? "border-[#0071e3]/30 bg-[#0071e3]/[0.04]"
                            : "border-black/[0.08] bg-white hover:bg-black/[0.02]"
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                            isOn
                              ? "border-[#0071e3] bg-[#0071e3] text-white"
                              : "border-black/20 bg-white"
                          }`}
                        >
                          {isOn && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium text-[#1d1d1f]">
                            {permission.description || permission.id}
                          </span>
                          <span className="block font-mono text-[11px] text-[#86868b]">
                            {permission.id}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a role"
        subtitle="Start from scratch or copy an existing role's permissions."
      >
        <form onSubmit={submitNewRole} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="roleName" className="text-[13px] font-medium text-[#1d1d1f]">
              Name
            </label>
            <input
              id="roleName"
              required
              value={newRole.name}
              onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Content Editor"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="roleDescription" className="text-[13px] font-medium text-[#1d1d1f]">
              Description
            </label>
            <input
              id="roleDescription"
              value={newRole.description}
              onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Can write and publish, but not delete"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="copyFrom" className="text-[13px] font-medium text-[#1d1d1f]">
              Copy permissions from
            </label>
            <select
              id="copyFrom"
              value={newRole.copyFrom}
              onChange={(e) => setNewRole((prev) => ({ ...prev, copyFrom: e.target.value }))}
              className={inputClass}
            >
              <option value="">Nothing — start empty</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setCreateOpen(false)} className={buttonSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonPrimary}>
              Create role
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
