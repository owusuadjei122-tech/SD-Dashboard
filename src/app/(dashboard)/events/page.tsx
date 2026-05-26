"use client";

import { CalendarPlus, MapPin, Users, Ticket } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events & Community</h1>
          <p className="text-muted-foreground mt-1">Manage events, registrations, and community engagement.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <CalendarPlus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "SelfDiscovery Summit 2026", date: "Nov 12-14, 2026", location: "Los Angeles, CA", attendees: "1,240/1,500", status: "Upcoming", image: "bg-gradient-to-br from-zinc-800 to-black" },
          { title: "Creative Masterclass", date: "Dec 05, 2026", location: "Online (Zoom)", attendees: "450/500", status: "Upcoming", image: "bg-zinc-900" },
          { title: "Leadership Workshop Q3", date: "Sep 20, 2026", location: "New York, NY", attendees: "200/200", status: "Completed", image: "bg-zinc-800" },
        ].map((event, i) => (
          <div key={i} className="flex flex-col border border-border rounded-xl bg-card overflow-hidden hover:border-primary/50 transition-colors group">
            <div className={`h-40 ${event.image} flex items-center justify-center p-6 relative`}>
              <div className="absolute top-4 right-4 px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs font-medium text-white border border-white/20">
                {event.status}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-lg mb-4">{event.title}</h3>
              
              <div className="flex flex-col gap-3 mt-auto text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <CalendarPlus className="w-4 h-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees} Registered</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <button className="text-sm font-medium hover:underline">View Details</button>
                <button className="flex items-center gap-2 text-sm font-medium bg-secondary px-3 py-1.5 rounded-md hover:bg-secondary/80">
                  <Ticket className="w-4 h-4" />
                  Manage Tickets
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
