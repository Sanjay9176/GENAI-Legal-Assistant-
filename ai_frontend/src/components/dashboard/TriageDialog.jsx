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
import { Scale, ShieldAlert, Users } from "lucide-react";

export function TriageDialog({ isOpen, onClose, userDescription, onConfirm }) {

  const options = [
    {
      id: "civil",
      title: "Civil Dispute",
      desc: "Property boundaries, contracts, or money recovery.",
      icon: <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />,
      code: "CPC 1908",
    },
    {
      id: "criminal",
      title: "Criminal Offense",
      desc: "Threats of violence, theft, or physical harm.",
      icon: <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />,
      code: "BNS 2023",
    },
    {
      id: "tort",
      title: "Nuisance / Civic Issue",
      desc: "Noise complaints, garbage dumping, or municipal issues.",
      icon: <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />,
      code: "Tort Law",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[95vw]
          max-w-[95vw]
          sm:max-w-[520px]
          md:max-w-[600px]
          px-4 sm:px-6
        "
      >
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Clarify Your Situation
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            To apply the correct laws, please categorize your issue:
            <br />
            <span className="italic text-slate-600 break-words">
              “{userDescription?.substring(0, 80)}...”
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Options */}
        <div className="grid gap-3 sm:gap-4 py-4">
          {options.map((option) => (
            <Card
              key={option.id}
              className="
                p-3 sm:p-4
                cursor-pointer
                transition-all
                flex items-start sm:items-center
                gap-3 sm:gap-4
                hover:border-blue-500
                hover:bg-blue-50
                active:scale-[0.98]
              "
              onClick={() => onConfirm(option.id)}
            >
              {/* Icon */}
              <div className="p-2 bg-white rounded-full shadow-sm border shrink-0">
                {option.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                  {option.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 leading-snug">
                  {option.desc}
                </p>
              </div>

              {/* Code */}
              <div
                className="
                  text-[10px] sm:text-xs
                  font-mono
                  bg-slate-100
                  px-2 py-1
                  rounded
                  whitespace-nowrap
                "
              >
                {option.code}
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => onClose(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
