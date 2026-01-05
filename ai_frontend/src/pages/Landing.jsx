// src/pages/Landing.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Upload,
  FileText,
  X,
  Briefcase,
  DollarSign,
  Home,
  Users,
  MoreHorizontal,
  ShieldAlert,
} from "lucide-react";
import api from "@/services/api";
import { useApp } from "@/context/AppContext";

export default function Landing() {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { createNewCase, jurisdiction } = useApp();

  const categories = [
    {
      id: "money",
      label: "Money / Debt",
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />,
      template:
        "I gave a loan of ₹_____ to _____ on [Date] and they are refusing to pay it back.",
    },
    {
      id: "property",
      label: "Property Dispute",
      icon: <Home className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />,
      template:
        "My neighbor is encroaching on my property boundary at [Address]. The issue started when...",
    },
    {
      id: "theft",
      label: "Theft / Cybercrime",
      icon: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />,
      template:
        "My [Item/Money] was stolen/scammed on [Date] at [Location]. The approximate value is ₹_____.",
    },
    {
      id: "family",
      label: "Family / Matrimonial",
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />,
      template: "I am facing a domestic dispute regarding...",
    },
    {
      id: "work",
      label: "Work / Labor",
      icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />,
      template:
        "My employer has not paid my salary for the last _____ months.",
    },
    {
      id: "others",
      label: "Other Legal Issues",
      icon: (
        <MoreHorizontal className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
      ),
      template: "I need legal help regarding...",
    },
  ];

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.id);
    if (!description.trim()) {
      setDescription(cat.template);
      return;
    }
    const isGeneric = categories.some((c) => c.template === description);
    if (isGeneric) setDescription(cat.template);
  };

  const handleAnalyze = async () => {
    if (!description.trim()) {
      alert("Please describe the situation first.");
      return;
    }

    setIsLoading(true);

    try {
      let finalDescription = description;
      if (jurisdiction?.state) {
        finalDescription = `[JURISDICTION CONTEXT: ${
          jurisdiction.district || "Unknown District"
        }, ${jurisdiction.state}, India]\n\nSITUATION: ${description}`;
      }

      const formData = new FormData();
      formData.append("situation", finalDescription);
      if (file) formData.append("file", file);

      const response = await api.post("/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const categoryObj = categories.find(
        (c) => c.id === selectedCategory
      );
      const catLabel = categoryObj ? categoryObj.label : "Legal Case";
      const shortDesc =
        description.substring(0, 25) +
        (description.length > 25 ? "..." : "");
      const caseTitle = `${catLabel}: ${shortDesc}`;

      const newCase = await createNewCase(
        caseTitle,
        selectedCategory || "General"
      );

      if (newCase?.id) {
        navigate(`/case/${newCase.id}`, {
          state: {
            analysis: response.data,
            originalText: description,
          },
        });
      } else {
        alert("Analysis complete, but could not save case.");
      }
    } catch (error) {
      alert("Analysis failed. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
        {/* INTRO */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            What brings you here today?
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            Choose a category or describe your situation directly.
          </p>
        </div>

        {/* CATEGORIES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              onClick={() => handleCategorySelect(cat)}
              className={`cursor-pointer transition-all border-2
                ${
                  selectedCategory === cat.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-transparent hover:border-slate-200"
                }`}
            >
              <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  {cat.icon}
                </div>
                <span className="font-semibold text-xs sm:text-sm text-slate-700">
                  {cat.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* INPUT CARD */}
        <Card className="shadow-lg border-blue-100">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex flex-wrap items-center gap-2">
              Describe the Situation
              {selectedCategory && (
                <span className="text-xs text-slate-400 px-2 py-1 bg-slate-100 rounded-full">
                  Category: {selectedCategory}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              Include dates, names, and amounts. Upload evidence if available.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Textarea
              placeholder="Type details here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[160px] sm:min-h-[180px] text-sm sm:text-base p-4 bg-slate-50 border-slate-200 focus:border-blue-500"
            />

            {/* FILE UPLOAD */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/30">
              {!file ? (
                <label className="flex flex-col items-center cursor-pointer text-center">
                  <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Upload Evidence
                  </p>
                  <p className="text-xs text-slate-400">
                    PDF, JPG, PNG (Max 5MB)
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.png,.jpeg"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[180px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex justify-end">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-8 py-6 text-base sm:text-lg"
                onClick={handleAnalyze}
                disabled={isLoading || (!description && !file)}
              >
                {isLoading ? "Analyzing Case..." : "Analyze Case & Draft"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DISCLAIMER */}
        <div className="text-center opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
            <strong>Disclaimer:</strong> Gen-Vidhik Sahayak is an AI-powered
            informational tool and does not provide binding legal advice.
            Please consult a qualified Advocate in India.
          </p>
        </div>
      </div>
    </div>
  );
}
