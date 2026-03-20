import { useState } from "react";
import { Building2, MapPin, IndianRupee, Users, FileText, Loader2, X, Plus } from "lucide-react";
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

const AddHostelForm = ({ onSuccess }: AddHostelFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryImages, setCategoryImages] = useState<Record<string, File[]>>({});
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    hostel_name: "",
    description: "",
    location: "",
    city: "",
    property_type: "hostel",
    gender: "co-ed",
    price_min: "",
    price_max: "",
    latitude: "",
    longitude: "",
  });
  const [facilities, setFacilities] = useState<string[]>([]);
  const [rooms, setRooms] = useState([{ sharing_type: "single", price_per_month: "", total_beds: "1", available_beds: "1" }]);

  const addRoom = () => setRooms([...rooms, { sharing_type: "double", price_per_month: "", total_beds: "2", available_beds: "2" }]);
  const removeRoom = (i: number) => setRooms(rooms.filter((_, idx) => idx !== i));
  const updateRoom = (i: number, field: string, value: string) => {
    const updated = [...rooms];
    (updated[i] as any)[field] = value;
    setRooms(updated);
  };

  const toggleFacility = (f: string) => {
    setFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate photos
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
        })
        .select("id")
        .single();

      if (hostelErr) throw hostelErr;

      // 2. Add facilities
      const facilityData: Record<string, boolean> = {};
      FACILITIES.forEach(f => { facilityData[f] = facilities.includes(f); });
      await supabase.from("facilities").insert({ hostel_id: hostel.id, ...facilityData });

      // 3. Add rooms
      for (const room of rooms) {
        if (room.price_per_month) {
          await supabase.from("rooms").insert({
            hostel_id: hostel.id,
            sharing_type: room.sharing_type,
            price_per_month: parseInt(room.price_per_month),
            total_beds: parseInt(room.total_beds) || 1,
            available_beds: parseInt(room.available_beds) || 1,
          });
        }
      }

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
      setForm({ hostel_name: "", description: "", location: "", city: "", property_type: "hostel", gender: "co-ed", price_min: "", price_max: "", latitude: "", longitude: "" });
      setFacilities([]);
      setRooms([{ sharing_type: "single", price_per_month: "", total_beds: "1", available_beds: "1" }]);
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
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="co-ed">Co-ed</SelectItem>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude (optional)</Label>
                <Input type="number" step="any" placeholder="12.9716" className="rounded-xl" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude (optional)</Label>
                <Input type="number" step="any" placeholder="77.5946" className="rounded-xl" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
              </div>
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

          {/* Rooms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Rooms</h3>
              <Button type="button" variant="outline" size="sm" className="gap-1 rounded-xl" onClick={addRoom}>
                <Plus className="w-3 h-3" /> Add Room
              </Button>
            </div>
            {rooms.map((room, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-end p-3 bg-secondary/30 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-[10px]">Type</Label>
                  <Select value={room.sharing_type} onValueChange={v => updateRoom(i, "sharing_type", v)}>
                    <SelectTrigger className="rounded-lg h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                      <SelectItem value="quad">Quad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Price/mo</Label>
                  <Input type="number" placeholder="₹" className="rounded-lg h-9 text-xs" value={room.price_per_month} onChange={e => updateRoom(i, "price_per_month", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Beds</Label>
                  <Input type="number" className="rounded-lg h-9 text-xs" value={room.total_beds} onChange={e => updateRoom(i, "total_beds", e.target.value)} />
                </div>
                <div className="flex gap-1">
                  <div className="space-y-1 flex-1">
                    <Label className="text-[10px]">Available</Label>
                    <Input type="number" className="rounded-lg h-9 text-xs" value={room.available_beds} onChange={e => updateRoom(i, "available_beds", e.target.value)} />
                  </div>
                  {rooms.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 mt-auto text-destructive" onClick={() => removeRoom(i)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
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
