"use client";

import { Hash, MessageSquare, Plus } from "lucide-react";

export default function WorkspacePage() {
  return (
    <div className="flex flex-col h-full gap-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Workspace</h1>
        <p className="text-muted-foreground mt-1">Communicate and collaborate with your team.</p>
      </div>

      <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex min-h-[600px]">
        {/* Channels Sidebar */}
        <div className="w-64 border-r border-border bg-secondary/10 p-4 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</h3>
              <button className="text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {['general', 'announcements', 'marketing', 'design', 'engineering'].map((channel) => (
                <button key={channel} className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-left">
                  <Hash className="w-4 h-4" />
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Messages</h3>
              <button className="text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {['Sarah J.', 'Mike T.', 'Emma W.'].map((user) => (
                <button key={user} className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-left">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  {user}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-border flex items-center px-6">
            <h2 className="font-semibold flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              general
            </h2>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">Admin User</span>
                  <span className="text-xs text-muted-foreground">10:42 AM</span>
                </div>
                <p className="text-sm mt-1">Welcome to the new SelfDiscovery Workspace! 🚀 We'll be using this for all internal communication.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary shrink-0" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">Sarah J.</span>
                  <span className="text-xs text-muted-foreground">10:45 AM</span>
                </div>
                <p className="text-sm mt-1">Looks incredibly clean! Love the minimalist aesthetic.</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Message #general..." 
                className="w-full h-12 bg-secondary/30 border border-border rounded-lg pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
