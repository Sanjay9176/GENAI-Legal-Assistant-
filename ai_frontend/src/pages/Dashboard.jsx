// src/pages/Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Clock,
  FileText,
  MapPin,
  LogOut,
  Trash2,
  PlayCircle,
  Loader2,
  CheckCircle2,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { ChatPanel } from "../components/workspace/ChatPanel.jsx";

const INDIA_LOCATIONS = {
  Karnataka: ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad"],
  Maharashtra: ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur"],
  Delhi: ["New Delhi", "North Delhi", "South Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    jurisdiction,
    updateJurisdiction,
    userCases,
    deleteCase,
    loadingCases,
  } = useApp();

  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [tempState, setTempState] = useState(jurisdiction.state || "");
  const [tempDistrict, setTempDistrict] = useState(
    jurisdiction.district || ""
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const saveNewLocation = () => {
    if (tempState && tempDistrict) {
      updateJurisdiction(tempState, tempDistrict);
      setIsEditingLoc(false);
    }
  };

  const handleStateChange = (val) => {
    setTempState(val);
    setTempDistrict("");
  };

  const totalCases = userCases.length;
  const closedCases = userCases.filter(
    (c) => c.status === "Closed" || c.status === "Won"
  ).length;
  const pendingCases = userCases.filter(
    (c) => c.status !== "Closed" && c.status !== "Won"
  ).length;

  const handleResumeCase = (caseItem) => {
    navigate(`/case/${caseItem.id}?step=${caseItem.step || 1}`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 pt-20 sm:pt-24 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Welcome, {user?.user_name || "Advocate"}
            </h1>

            {/* LOCATION */}
            <div className="flex items-center gap-2 text-slate-500 mt-2 min-h-[40px] flex-wrap">
              <MapPin className="w-4 h-4 shrink-0" />

              {!isEditingLoc ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-medium text-sm sm:text-base">
                    {jurisdiction.state
                      ? `${jurisdiction.district}, ${jurisdiction.state}`
                      : "No Jurisdiction Selected"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-blue-600"
                    onClick={() => {
                      setTempState(jurisdiction.state);
                      setTempDistrict(jurisdiction.district);
                      setIsEditingLoc(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-95">
                  <Select value={tempState} onValueChange={handleStateChange}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(INDIA_LOCATIONS).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={tempDistrict}
                    onValueChange={setTempDistrict}
                    disabled={!tempState}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent>
                      {tempState &&
                        INDIA_LOCATIONS[tempState].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    className="h-8 w-8 bg-green-600 hover:bg-green-700"
                    onClick={saveNewLocation}
                    disabled={!tempState || !tempDistrict}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => setIsEditingLoc(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
            <Button
              onClick={() => navigate("/new-case")}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Create New Case
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Cases" value={totalCases} color="blue" />
          <StatCard label="Won / Closed" value={closedCases} color="green" />
          <StatCard label="Active / Pending" value={pendingCases} color="orange" />
        </div>

        {/* RECENT ACTIVITY */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
          </h2>

          {loadingCases ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          ) : userCases.length === 0 ? (
            <div className="text-center p-8 text-slate-400 bg-white rounded-lg border border-dashed">
              No cases found. Create one to start!
            </div>
          ) : (
            <div className="grid gap-4">
              {userCases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className="hover:shadow-md transition-shadow border-slate-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center p-4 gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      {caseItem.status === "Closed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-500" />
                      )}
                    </div>

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleResumeCase(caseItem)}
                    >
                      <h3 className="font-semibold text-slate-900">
                        {caseItem.title}
                      </h3>
                      <div className="text-sm text-slate-500 flex flex-wrap gap-2">
                        <span>{caseItem.type}</span>
                        <span>•</span>
                        <span>{caseItem.date}</span>
                        {caseItem.status !== "Closed" && (
                          <span className="text-blue-600 font-medium">
                            (Step {caseItem.step})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {caseItem.status !== "Closed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600"
                          onClick={() => handleResumeCase(caseItem)}
                        >
                          <PlayCircle className="w-4 h-4 mr-1" /> Resume
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCase(caseItem.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ChatPanel analysisSummary="" />
    </div>
  );
}

const StatCard = ({ label, value, color }) => (
  <Card className={`bg-${color}-50 border-${color}-100`}>
    <CardContent className="p-6">
      <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
      <div className={`text-sm text-${color}-600`}>{label}</div>
    </CardContent>
  </Card>
);
