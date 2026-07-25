"use client";

import { Check } from "lucide-react";
import {
  ALL_MODULES,
  MODULE_DESCRIPTIONS,
  MODULE_LABELS,
  MODULE_ROLES,
  type ModuleId,
  type RbacRoleId,
} from "@/lib/rbac/types";

export interface ModuleGrantDraft {
  moduleId: ModuleId;
  roleId: RbacRoleId;
}

export function ModuleAccessEditor({
  grants,
  onChange,
  disabled,
  singleRole,
}: {
  grants: ModuleGrantDraft[];
  onChange: (grants: ModuleGrantDraft[]) => void;
  disabled?: boolean;
  /** Invitations carry one role for every granted module. */
  singleRole?: RbacRoleId;
}) {
  const toggle = (moduleId: ModuleId) => {
    const exists = grants.some((g) => g.moduleId === moduleId);
    if (exists) {
      onChange(grants.filter((g) => g.moduleId !== moduleId));
    } else {
      onChange([...grants, { moduleId, roleId: singleRole ?? "team_member" }]);
    }
  };

  const setRole = (moduleId: ModuleId, roleId: RbacRoleId) => {
    onChange(grants.map((g) => (g.moduleId === moduleId ? { ...g, roleId } : g)));
  };

  return (
    <div className="space-y-2.5">
      {ALL_MODULES.map((moduleId) => {
        const grant = grants.find((g) => g.moduleId === moduleId);
        const enabled = Boolean(grant);

        return (
          <div
            key={moduleId}
            className={`rounded-2xl border p-3.5 transition ${
              enabled ? "border-[#0071e3]/30 bg-[#0071e3]/[0.04]" : "border-black/[0.08] bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={enabled}
                aria-label={MODULE_LABELS[moduleId]}
                disabled={disabled}
                onClick={() => toggle(moduleId)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  enabled
                    ? "border-[#0071e3] bg-[#0071e3] text-white"
                    : "border-black/20 bg-white hover:border-black/40"
                } disabled:opacity-50`}
              >
                {enabled && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#1d1d1f]">{MODULE_LABELS[moduleId]}</p>
                <p className="mt-0.5 text-[12px] text-[#86868b]">
                  {MODULE_DESCRIPTIONS[moduleId]}
                </p>

                {enabled && !singleRole && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {MODULE_ROLES.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        disabled={disabled}
                        title={role.description}
                        onClick={() => setRole(moduleId, role.id)}
                        className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition ${
                          grant?.roleId === role.id
                            ? "bg-[#1d1d1f] text-white"
                            : "bg-white text-[#424245] ring-1 ring-inset ring-black/[0.08] hover:bg-black/[0.03]"
                        } disabled:opacity-50`}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
