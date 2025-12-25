// src/components/dashboard/TriageDialog.jsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Scale, ShieldAlert, Users } from "lucide-react"; // Icons for clarity

export function TriageDialog({ isOpen, onClose, userDescription, onConfirm }) {
  
  // In Phase 4, these options will come dynamically from the Python Backend.
  // For now, we hardcode them to simulate the "AI Triage" experience.
  const options = [
    {
      id: "civil",
      title: "Civil Dispute",
      desc: "Property boundaries, contracts, or money recovery.",
      icon: <Scale className="h-6 w-6 text-blue-500" />,
      code: "CPC 1908"
    },
    {
      id: "criminal",
      title: "Criminal Offense",
      desc: "Threats of violence, theft, or physical harm.",
      icon: <ShieldAlert className="h-6 w-6 text-red-500" />,
      code: "BNS 2023"
    },
    {
      id: "tort",
      title: "Nuisance / Civic Issue",
      desc: "Noise complaints, garbage dumping, or municipal issues.",
      icon: <Users className="h-6 w-6 text-green-500" />,
      code: "Tort Law"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Clarify Your Situation</DialogTitle>
          <DialogDescription>
            To apply the correct laws, please categorize your issue based on the description:
            <br/>
            <span className="italic text-slate-600">"{userDescription?.substring(0, 50)}..."</span>
          </DialogDescription>
        </DialogHeader>

        {/* The 3 Options Grid */}
        <div className="grid gap-4 py-4">
          {options.map((option) => (
            <Card 
              key={option.id}
              className="p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4"
              onClick={() => onConfirm(option.id)}
            >
              <div className="p-2 bg-white rounded-full shadow-sm border">
                {option.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">{option.title}</h4>
                <p className="text-sm text-slate-500">{option.desc}</p>
              </div>
              <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                {option.code}
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}