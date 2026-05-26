"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, CheckCircle2, Circle } from "lucide-react";
import { AddProjectModal } from "@/components/modules/projects/AddProjectModal";

export default function ProjectsClientPage({ initialProjects }: { initialProjects: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full gap-8 max-w-6xl mx-auto">
      {isModalOpen && <AddProjectModal onClose={() => setIsModalOpen(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects & Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage workflows, priorities, and deadlines.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 flex-1">
        {initialProjects && initialProjects.length > 0 ? (
          initialProjects.map((project: any) => (
            <div key={project.id} className="p-6 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors flex flex-col group h-48">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  project.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {project.status.toUpperCase()}
                </span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-bold text-lg mb-2 truncate">{project.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{project.description}</p>
              
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                <span className="font-medium text-primary cursor-pointer hover:underline">View Tasks</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
            No active projects. Click "New Project" to start organizing.
          </div>
        )}
      </div>
    </div>
  );
}
