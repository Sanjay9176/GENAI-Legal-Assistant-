import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, HelpCircle, AlertCircle } from "lucide-react";

export function FactSheet({ facts }) {
  const hasFacts = facts && Object.keys(facts).length > 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <ScrollText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        <h3 className="font-bold text-slate-700 text-sm sm:text-base">
          Key Facts Extracted
        </h3>
      </div>

      {!hasFacts ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center px-6 py-8 sm:p-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <div className="p-3 bg-white rounded-full shadow-sm mb-3">
            <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
          </div>
          <h4 className="text-sm font-semibold text-slate-600">
            No Facts Extracted Yet
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-[260px]">
            The AI hasn't found specific details yet. Try generating a draft or
            chatting to add more info.
          </p>
        </div>
      ) : (
        /* FACTS LIST */
        <div className="grid gap-3 sm:gap-4">
          {Object.entries(facts).map(([key, value]) => (
            <Card
              key={key}
              className="border-l-4 border-l-blue-500 shadow-sm"
            >
              <CardHeader className="px-3 py-2 sm:p-3 sm:pb-1">
                <CardTitle className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {key.replace(/_/g, " ")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 sm:p-3 sm:pt-1">
                <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
                  {value && value !== "Not mentioned" ? (
                    value
                  ) : (
                    <span className="text-slate-400 italic flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Not found in text
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
