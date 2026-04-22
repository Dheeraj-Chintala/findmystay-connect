import { useMemo, useState } from "react";
import { Building2, MapPin, LocateFixed, IndianRupee, Users, FileText, Loader2, X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryPhotoUpload, { validateCategoryImages } from "@/components/owner/CategoryPhotoUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const FACILITIES = [
  "wifi", "ac", "food", "laundry", "parking", "gym",
  "pool", "power_backup", "cctv", "geyser", "washing_machine",
  "housekeeping", "common_kitchen", "study_room",
];

const FACILITY_LABELS: Record<string, string> = {
  wifi: "WiFi", ac: "AC", food: "Food", laundry: "Laundry",
  parking: "Parking", gym: "Gym", pool: "Pool", power_backup: "Power Backup",
  cctv: "CCTV", geyser: "Geyser", washing_machine: "Washing Machine",
  housekeeping: "Housekeeping", common_kitchen: "Common Kitchen", study_room: "Study Room",
};

interface AddHostelFormProps {
  onSuccess: () => void;
}

const ROOM_TYPE_OPTIONS = ["single", "double", "triple", "4-sharing", "6-sharing"] as const;
type RoomType = typeof ROOM_TYPE_OPTIONS[number];
type RoomConfig = Record<RoomType, { enabled: boolean; price: string; total_beds: string; occupied_beds: string }>;

const createInitialRoomConfig = (): RoomConfig => ({
  single: { enabled: true, price: "", total_beds: "1", occupied_beds: "0" },
  double: { enabled: false, price: "", total_beds: "2", occupied_beds: "0" },
  triple: { enabled: false, price: "", total_beds: "3", occupied_beds: "0" },
  "4-sharing": { enabled: false, price: "", total_beds: "4", occupied_beds: "0" },
  "6-sharing": { enabled: false, price: "", total_beds: "6", occupied_beds: "0" },
});

const AddHostelForm = ({ onSuccess }: AddHostelFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [categoryImages, setCategoryImages] = useState<Record<string, File[]>>({});
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    hostel_name: "",
    description: "",
    location: "",
    city: "",
    property_type: "hostel",
    gender: "others",
    price_min: "",
    price_max: "",
    latitude: "",
    longitude: "",
    contact_phone: "",
    contact_email: "",
  });
  const [facilities, setFacilities] = useState<string[]>([]);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>(createInitialRoomConfig());
  const selectedRoomTypes = useMemo(
    () => ROOM_TYPE_OPTIONS.filter((roomType) => roomConfig[roomType].enabled),
    [roomConfig]
  );

  const toggleFacility = (f: string) => {
    setFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        toast.success("Location captured successfully");
        setFetchingLocation(false);
      },
      () => {
        toast.error("Unable to get location. Please allow location access.");
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate photos
    if (selectedRoomTypes.length === 0) {
      toast.error("Select at least one room type.");
      return;
    }

    for (const roomType of selectedRoomTypes) {
      const row = roomConfig[roomType];
      const totalBeds = parseInt(row.total_beds, 10);
      const occupiedBeds = parseInt(row.occupied_beds, 10);
      const price = parseInt(row.price, 10);
      if (!price || price <= 0) {
        toast.error(`Enter a valid monthly price for ${roomType}.`);
        return;
      }
      if (!totalBeds || totalBeds <= 0) {
        toast.error(`Enter a valid total beds count for ${roomType}.`);
        return;
      }
      if (occupiedBeds < 0 || occupiedBeds > totalBeds) {
        toast.error(`Occupied beds must be between 0 and total beds for ${roomType}.`);
        return;
      }
    }

    const imgErrors = validateCategoryImages(categoryImages);
    setPhotoErrors(imgErrors);
    if (Object.keys(imgErrors).length > 0) {
      toast.error("Please upload all required property photos");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create hostel
      const { data: hostel, error: hostelErr } = await supabase
        .from("hostels")
        .insert({
          owner_id: user.id,
          hostel_name: form.hostel_name,
          description: form.description || null,
          location: form.location,
          city: form.city,
          property_type: form.property_type,
          gender: form.gender,
          price_min: parseInt(form.price_min) || 0,
          price_max: parseInt(form.price_max) || 0,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          contact_phone: form.contact_phone.trim() || null,
          contact_email: form.contact_email.trim() || null,
        })
        .select("id")
        .single();

      if (hostelErr) throw hostelErr;

      // 2. Add facilities
      const facilityData: Record<string, boolean> = {};
      FACILITIES.forEach(f => { facilityData[f] = facilities.includes(f); });
      await supabase.from("facilities").insert({ hostel_id: hostel.id, ...facilityData });

      // 3. Add room types
      const roomTypeRows = selectedRoomTypes.map((roomType) => {
        const row = roomConfig[roomType];
        const totalBeds = parseInt(row.total_beds, 10);
        const occupiedBeds = parseInt(row.occupied_beds, 10);
        return {
          property_id: hostel.id,
          type: roomType,
          price: parseInt(row.price, 10),
          total_beds: totalBeds,
          occupied_beds: occupiedBeds,
          available_beds: totalBeds - occupiedBeds,
        };
      });
      const { error: roomTypesErr } = await supabase.from("room_types").insert(roomTypeRows);
      if (roomTypesErr) throw roomTypesErr;

      // 4. Upload images by category
      let imgIndex = 0;
      for (const [category, files] of Object.entries(categoryImages)) {
        for (const file of files) {
          const filePath = `${hostel.id}/${Date.now()}-${imgIndex}.${file.name.split('.').pop()}`;
          const { error: uploadErr } = await supabase.storage
            .from("hostel-images")
            .upload(filePath, file);

          if (!uploadErr) {
            const { data: publicUrl } = supabase.storage
              .from("hostel-images")
              .getPublicUrl(filePath);

            await supabase.from("hostel_images").insert({
              hostel_id: hostel.id,
              image_url: publicUrl.publicUrl,
              display_order: imgIndex,
              image_category: category,
            });
          }
          imgIndex++;
        }
      }

      toast.success("Your property has been submitted for admin approval. You'll be notified once reviewed.");
      setOpen(false);
      onSuccess();

      // Reset form
      setForm({
        hostel_name: "",
        description: "",
        location: "",
        city: "",
        property_type: "hostel",
        gender: "others",
        price_min: "",
        price_max: "",
        latitude: "",
        longitude: "",
        contact_phone: "",
        contact_email: "",
      });
      setFacilities([]);
      setRoomConfig(createInitialRoomConfig());
      setCategoryImages({});
      setPhotoErrors({});
    } catch (err: any) {
      toast.error(err.message || "Failed to add property");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Add New Property</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Property Name *</Label>
                <Input placeholder="e.g., Sunrise Co-Living" className="rounded-xl" required value={form.hostel_name} onChange={e => setForm({ ...form, hostel_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City *</Label>
                <Input placeholder="e.g., Bangalore" className="rounded-xl" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location / Address *</Label>
              <Input placeholder="e.g., Koramangala, 5th Block" className="rounded-xl" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Describe your property..." className="rounded-xl min-h-[80px] resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Public contact phone</Label>
                <Input
                  type="tel"
                  placeholder="Shown to guests on your listing"
                  className="rounded-xl"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Public contact email</Label>
                <Input
                  type="email"
                  placeholder="Shown to guests on your listing"
                  className="rounded-xl"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={form.property_type} onValueChange={v => setForm({ ...form, property_type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="pg">PG</SelectItem>
                    <SelectItem value="co-living">Co-Living</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Men</SelectItem>
                    <SelectItem value="female">Women</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Min Price ₹</Label>
                <Input type="number" placeholder="5000" className="rounded-xl" value={form.price_min} onChange={e => setForm({ ...form, price_min: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Price ₹</Label>
                <Input type="number" placeholder="15000" className="rounded-xl" value={form.price_max} onChange={e => setForm({ ...form, price_max: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={handleGetLocation}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                {fetchingLocation ? "Fetching..." : "Use Current Location"}
              </Button>
              {form.latitude && form.longitude && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-accent" />
                  {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                </span>
              )}
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-3">
            <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Facilities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FACILITIES.map(f => (
                <label key={f} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors text-sm">
                  <Checkbox checked={facilities.includes(f)} onCheckedChange={() => toggleFacility(f)} />
                  {FACILITY_LABELS[f]}
                </label>
              ))}
            </div>
          </div>

          {/* Room Configuration */}
          <div className="space-y-3">
            <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Room Configuration</h3>
            {ROOM_TYPE_OPTIONS.map((roomType) => {
              const row = roomConfig[roomType];
              return (
                <div key={roomType} className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      checked={row.enabled}
                      onCheckedChange={(checked) =>
                        setRoomConfig((prev) => ({ ...prev, [roomType]: { ...prev[roomType], enabled: !!checked } }))
                      }
                    />
                    <Label className="text-sm capitalize">{roomType}</Label>
                  </div>
                  {row.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Price/mo</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder="₹"
                          className="rounded-lg h-9 text-xs"
                          value={row.price}
                          onChange={(e) =>
                            setRoomConfig((prev) => ({ ...prev, [roomType]: { ...prev[roomType], price: e.target.value } }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Total Beds</Label>
                        <Input
                          type="number"
                          min={1}
                          className="rounded-lg h-9 text-xs"
                          value={row.total_beds}
                          onChange={(e) =>
                            setRoomConfig((prev) => ({ ...prev, [roomType]: { ...prev[roomType], total_beds: e.target.value } }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Occupied Beds</Label>
                        <Input
                          type="number"
                          min={0}
                          className="rounded-lg h-9 text-xs"
                          value={row.occupied_beds}
                          onChange={(e) =>
                            setRoomConfig((prev) => ({ ...prev, [roomType]: { ...prev[roomType], occupied_beds: e.target.value } }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Photos */}
          <CategoryPhotoUpload
            categoryImages={categoryImages}
            onChange={imgs => { setCategoryImages(imgs); setPhotoErrors({}); }}
            errors={photoErrors}
          />

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : "Add Property"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHostelForm;
