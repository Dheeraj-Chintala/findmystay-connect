import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, CheckCircle2, Loader2, MapPin, ChevronRight, ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const captureSteps = [
  { id: "exterior", label: "Hostel Exterior", description: "Capture the front view of your property", icon: "🏠" },
  { id: "room", label: "Room Interior", description: "Show the room layout, bed, and furniture", icon: "🛏️" },
  { id: "bathroom", label: "Bathroom", description: "Capture bathroom facilities clearly", icon: "🚿" },
  { id: "dining", label: "Dining Area", description: "Show the dining or common eating area", icon: "🍽️" },
  { id: "facilities", label: "Facilities", description: "Capture WiFi setup, gym, laundry, etc.", icon: "🏋️" },
  { id: "security", label: "Security Features", description: "Show CCTV, gates, security desk", icon: "🔒" },
];

const SelfVerifyCapture = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hostels, setHostels] = useState<{ id: string; hostel_name: string; location: string; city: string }[]>([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<Record<string, { file: File; preview: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate("/login"); return; }
      if (!hasRole("owner") && !hasRole("admin")) { navigate("/"); return; }
      fetchHostels();
    }
  }, [user, authLoading]);

  const fetchHostels = async () => {
    const { data } = await supabase.from("hostels").select("id, hostel_name, location, city").eq("owner_id", user!.id);
    if (data) setHostels(data);
    setLoading(false);
  };

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCaptures((prev) => ({ ...prev, [captureSteps[currentStep].id]: { file, preview } }));
  };

  const handleSubmit = async () => {
    if (Object.keys(captures).length < 3) {
      toast.error("Please capture at least 3 areas");
      return;
    }
    setSubmitting(true);

    try {
      // Create the verification request
      const { data: request, error: reqError } = await supabase
        .from("media_verification_requests")
        .insert({
          hostel_id: selectedHostel,
          owner_id: user!.id,
          verification_type: "self_capture" as any,
          status: "ai_check" as any,
          areas_to_capture: Object.keys(captures),
        })
        .select()
        .single();

      if (reqError) throw reqError;

      // Upload each captured image
      for (const [stepId, capture] of Object.entries(captures)) {
        const filePath = `${selectedHostel}/${request.id}/${stepId}-${Date.now()}.${capture.file.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("verification-media")
          .upload(filePath, capture.file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from("verification-media").getPublicUrl(filePath);

        await supabase.from("verification_media").insert({
          request_id: request.id,
          media_url: urlData.publicUrl,
          media_type: "image",
          capture_step: stepId,
          uploader_id: user!.id,
          metadata: { original_name: capture.file.name, size: capture.file.size },
        });
      }

      setSubmitted(true);
      toast.success("Media submitted for verification!");
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    }
    setSubmitting(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 lg:pt-24 flex items-center justify-center min-h-[70vh]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-heading font-bold text-2xl mb-2">Media Submitted!</h2>
            <p className="text-muted-foreground mb-6">Your photos are being reviewed. You'll receive a verification badge once approved.</p>
            <Button onClick={() => navigate("/owner-dashboard")} variant="hero" className="rounded-xl">Back to Dashboard</Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const step = captureSteps[currentStep];
  const progress = (Object.keys(captures).length / captureSteps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
          {!started ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-2xl">Self Verify Listing Media</h1>
                  <p className="text-muted-foreground text-sm">Guided photo capture for instant verification</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 space-y-5">
                <div className="space-y-2">
                  <Label>Select Property</Label>
                  <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {h.hostel_name} · {h.city}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-secondary/50 rounded-xl p-4">
                  <h3 className="font-heading font-semibold text-sm mb-3">You'll capture photos of:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {captureSteps.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{s.icon}</span> {s.label}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => { if (!selectedHostel) { toast.error("Select a property first"); return; } setStarted(true); }}
                  variant="hero" size="lg" className="w-full rounded-xl"
                >
                  Start Guided Capture
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-heading font-semibold">Step {currentStep + 1} of {captureSteps.length}</span>
                  <span className="text-muted-foreground">{Object.keys(captures).length} captured</span>
                </div>
                <Progress value={progress} className="h-2 rounded-full" />
              </div>

              {/* Capture Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{step.icon}</span>
                      <div>
                        <h2 className="font-heading font-bold text-xl">{step.label}</h2>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                      </div>
                    </div>

                    {captures[step.id] ? (
                      <div className="relative rounded-xl overflow-hidden aspect-video mb-4">
                        <img src={captures[step.id].preview} alt={step.label} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3">
                          <div className="bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Captured
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all mb-4"
                      >
                        <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                        <p className="font-heading font-semibold text-sm">Tap to capture or upload</p>
                        <p className="text-muted-foreground text-xs mt-1">Use your camera for best results</p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileCapture}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
                      <Shield className="w-4 h-4 text-primary shrink-0" />
                      Photos are securely stored and will be reviewed for authenticity
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border-t border-border/50 bg-secondary/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
                      disabled={currentStep === 0}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>

                    {!captures[step.id] && (
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1 rounded-xl">
                        <Camera className="w-3.5 h-3.5" /> Capture
                      </Button>
                    )}

                    {currentStep < captureSteps.length - 1 ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setCurrentStep((p) => Math.min(captureSteps.length - 1, p + 1))}
                        className="gap-1 rounded-xl"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(captures).length < 3}
                        className="gap-1 rounded-xl"
                      >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Submit for Review
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Step thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {captureSteps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(i)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      currentStep === i
                        ? "border-primary bg-primary/5 text-primary"
                        : captures[s.id]
                        ? "border-accent/30 bg-accent/5 text-accent"
                        : "border-border/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span>{s.icon}</span>
                    {s.label}
                    {captures[s.id] && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SelfVerifyCapture;
