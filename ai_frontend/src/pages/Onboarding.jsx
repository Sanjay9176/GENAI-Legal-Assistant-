// src/pages/Onboarding.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Simple Database of Locations
const INDIA_LOCATIONS = {
  "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad"],
  "Maharashtra": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"]
};

export default function Onboarding() {
  const { updateJurisdiction } = useApp();
  const navigate = useNavigate();

  // Local state for the dropdowns
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // --- LOGIC: Dynamic State Change ---
  const handleStateChange = (newState) => {
    setSelectedState(newState);
    setSelectedDistrict(""); // RESET District whenever State changes
  };

  const handleContinue = () => {
    if (!selectedState || !selectedDistrict) return;
    
    // 1. Save to Global Context
    updateJurisdiction(selectedState, selectedDistrict);
    
    // 2. Move to the Dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-700">Jurisdiction Setup</CardTitle>
          <CardDescription>
            Legal procedures vary by location. Please select where the incident occurred.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* State Selector */}
          <div className="space-y-2">
            <Label>Select State</Label>
            <Select onValueChange={handleStateChange} value={selectedState}>
              <SelectTrigger>
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

          {/* District Selector (Dynamic) */}
          <div className="space-y-2">
            <Label>Select District</Label>
            <Select 
              onValueChange={setSelectedDistrict} 
              value={selectedDistrict}
              disabled={!selectedState} // Disable until state is picked
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedState ? "Select District..." : "Choose State first"} />
              </SelectTrigger>
              <SelectContent>
                {/* Only map the districts that belong to the selectedState */}
                {selectedState && INDIA_LOCATIONS[selectedState].map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

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