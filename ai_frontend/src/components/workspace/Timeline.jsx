import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, AlertCircle } from "lucide-react";

// ACCEPTS: 'facts' object from the parent
export function Timeline({ facts }) {
  // Helper: Extract dates/events from the facts object
  const extractEvents = () => {
    const events = [];

    if (!facts) return [];

    Object.entries(facts).forEach(([key, value]) => {
      if (
        key.toLowerCase().includes("date") ||
        (typeof value === "string" && /\d{4}/.test(value))
      ) {
        events.push({
          title: key.replace(/_/g, " ").toUpperCase(),
          date: value,
          description: "Event extracted from case facts.",
        });
      }
    });

    if (events.length === 0) {
      events.push({
        title: "CASE INITIATED",
        date: new Date().toLocaleDateString(),
        description: "Initial consultation started.",
      });
    }

    return events;
  };

  const events = extractEvents();

  return (
    <Card className="border-0 shadow-none h-full bg-slate-50/50">
      {/* HEADER */}
      <CardHeader className="px-3 sm:px-4 pt-4 pb-2">
        <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
          <CalendarDays className="w-4 h-4 text-purple-600" />
          Key Dates & Events
        </CardTitle>
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="px-3 sm:px-4">
        <div className="relative border-l-2 border-purple-200 ml-2 space-y-5 sm:space-y-6 pt-2 pb-2">
          {events.map((event, index) => (
            <div key={index} className="relative pl-6">
              {/* TIMELINE DOT */}
              <div className="absolute -left-[7px] top-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white border-2 border-purple-500" />

              {/* EVENT CONTENT */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded w-fit max-w-full truncate">
                  {event.date}
                </span>
                <h4 className="font-semibold text-slate-800 text-sm sm:text-base mt-1">
                  {event.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* TIP */}
        {events.length === 1 && (
          <div className="mt-4 p-3 bg-white border border-slate-100 text-xs sm:text-sm text-slate-400 rounded flex items-start gap-2">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              Tip: Add specific dates to the Fact Sheet to populate this
              timeline.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
