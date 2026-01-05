// src/pages/Onboarding.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Simple Database of Locations
const INDIA_LOCATIONS = {
  Karnataka: ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad"],
  Maharashtra: ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur"],
  Delhi: ["New Delhi", "North Delhi", "South Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
};

export default function Onboarding() {
  const { updateJurisdiction } = useApp();
  const navigate = useNavigate();

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const handleStateChange = (newState) => {
    setSelectedState(newState);
    setSelectedDistrict("");
  };

  const handleContinue = () => {
    if (!selectedState || !selectedDistrict) return;
    updateJurisdiction(selectedState, selectedDistrict);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-6">
      <Card className="w-full max-w-lg shadow-lg">
        {/* HEADER */}
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl text-blue-700">
            Jurisdiction Setup
          </CardTitle>
          <CardDescription className="text-sm">
            Legal procedures vary by location. Please select where the incident
            occurred.
          </CardDescription>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="space-y-5">
          {/* STATE */}
          <div className="space-y-2">
            <Label className="text-sm">Select State</Label>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select State..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(INDIA_LOCATIONS).map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DISTRICT */}
          <div className="space-y-2">
            <Label className="text-sm">Select District</Label>
            <Select
              value={selectedDistrict}
              onValueChange={setSelectedDistrict}
              disabled={!selectedState}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    selectedState ? "Select District..." : "Choose State first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectedState &&
                  INDIA_LOCATIONS[selectedState].map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* FOOTER */}
        <CardFooter>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleContinue}
            disabled={!selectedState || !selectedDistrict}
          >
            Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
