"use client";

import { Check, X } from "lucide-react";
import { MIN_PASSWORD_LENGTH, scorePassword } from "@/lib/password";

const BAR_COLORS = [
  "bg-white/10",
  "bg-red-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];

const TEXT_COLORS = [
  "text-white/40",
  "text-red-300",
  "text-amber-300",
  "text-lime-300",
  "text-emerald-300",
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, checks } = scorePassword(password);

  const requirements = [
    { met: checks.length, text: `${MIN_PASSWORD_LENGTH}+ characters` },
    { met: checks.number, text: "A number" },
    { met: checks.lowerUpper, text: "Upper & lowercase" },
    { met: checks.symbol, text: "A symbol" },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                score >= step ? BAR_COLORS[score] : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${TEXT_COLORS[score]}`}>{label}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {requirements.map((req) => (
          <div
            key={req.text}
            className={`flex items-center gap-1.5 text-[11px] ${
              req.met ? "text-emerald-300" : "text-white/40"
            }`}
          >
            {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {req.text}
          </div>
        ))}
      </div>
    </div>
  );
}
