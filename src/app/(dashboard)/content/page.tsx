"use client";

import { Upload, Image as ImageIcon, Video, FileText, MoreVertical } from "lucide-react";

export default function ContentPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content & Media</h1>
          <p className="text-muted-foreground mt-1">Manage creative assets and social campaigns.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Asset
        </button>
      </div>

      <div className="flex gap-4 border-b border-border pb-4">
        {['All Media', 'Images', 'Videos', 'Documents', 'Campaigns'].map((tab, i) => (
          <button key={tab} className={`px-4 py-2 text-sm font-medium rounded-full ${i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { name: "Brand_Guidelines.pdf", type: "doc", size: "2.4 MB", date: "Oct 24" },
          { name: "Q4_Campaign_Hero.jpg", type: "img", size: "4.1 MB", date: "Oct 22" },
          { name: "Product_Showcase_V1.mp4", type: "vid", size: "45.2 MB", date: "Oct 20" },
          { name: "Logo_Pack_Black.zip", type: "doc", size: "12.8 MB", date: "Oct 15" },
          { name: "Social_Post_01.png", type: "img", size: "1.2 MB", date: "Oct 12" },
          { name: "Social_Post_02.png", type: "img", size: "1.1 MB", date: "Oct 12" },
        ].map((file, i) => (
          <div key={i} className="group relative border border-border rounded-xl bg-card overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
            <div className="aspect-square bg-secondary/30 flex items-center justify-center border-b border-border relative">
              {file.type === 'img' ? <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" /> :
               file.type === 'vid' ? <Video className="w-8 h-8 text-muted-foreground opacity-50" /> :
               <FileText className="w-8 h-8 text-muted-foreground opacity-50" />}
              
              <button className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3">
              <div className="font-medium text-sm truncate" title={file.name}>{file.name}</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>{file.size}</span>
                <span>{file.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
