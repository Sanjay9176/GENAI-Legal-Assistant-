import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, HelpCircle, AlertCircle } from "lucide-react";

export function FactSheet({ facts }) {
  // Check if facts object exists and has keys
  const hasFacts = facts && Object.keys(facts).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-slate-700">Key Facts extracted</h3>
      </div>

      {!hasFacts ? (
        // --- EMPTY STATE UI ---
        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <div className="p-3 bg-white rounded-full shadow-sm mb-3">
            <HelpCircle className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-sm font-semibold text-slate-600">No Facts Extracted Yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            The AI hasn't found specific details yet. Try generating a draft or chatting to add more info.
          </p>
        </div>
      ) : (
        // --- FACTS LIST ---
        <div className="grid gap-4">
          {Object.entries(facts).map(([key, value]) => (
            <Card key={key} className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {key.replace(/_/g, " ")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <p className="text-sm font-medium text-slate-800">
                  {value && value !== "Not mentioned" ? (
                    value
                  ) : (
                    <span className="text-slate-400 italic flex items-center gap-1">
                      <AlertCircle size={12} /> Not found in text
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