import { useCallback, useRef, useState } from "react";
import { Upload, X, AlertCircle, CheckCircle2, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PhotoCategory {
  key: string;
  label: string;
  required: boolean;
  minCount: number;
  helperText: string;
}

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  { key: "room", label: "Room", required: true, minCount: 2, helperText: "Upload clear images showing bed, space, and lighting" },
  { key: "bathroom", label: "Bathroom", required: true, minCount: 1, helperText: "Show cleanliness, fixtures, and water facilities" },
  { key: "exterior", label: "Building Exterior", required: true, minCount: 1, helperText: "Capture the front facade and surrounding area" },
  { key: "entrance", label: "Entrance / Reception", required: true, minCount: 1, helperText: "Show the main entrance and reception area" },
  { key: "mess", label: "Mess / Dining Area", required: false, minCount: 0, helperText: "Dining hall, seating, and food service area" },
  { key: "kitchen", label: "Kitchen", required: false, minCount: 0, helperText: "Kitchen setup and cooking facilities" },
  { key: "amenities", label: "Amenities", required: false, minCount: 0, helperText: "WiFi setup, gym, parking, and other facilities" },
  { key: "common_areas", label: "Common Areas", required: false, minCount: 0, helperText: "Study room, lounge, hall, and shared spaces" },
];

const MAX_TOTAL = 10;

interface CategoryPhotoUploadProps {
  categoryImages: Record<string, File[]>;
  onChange: (images: Record<string, File[]>) => void;
  errors: Record<string, string>;
}

const CategoryPhotoUpload = ({ categoryImages, onChange, errors }: CategoryPhotoUploadProps) => {
  const totalCount = Object.values(categoryImages).reduce((sum, files) => sum + files.length, 0);

  const handleFiles = useCallback((categoryKey: string, files: FileList | File[]) => {
    const incoming = Array.from(files).filter(f => f.type.startsWith("image/"));
    const currentTotal = Object.values(categoryImages).reduce((s, f) => s + f.length, 0);
    const allowed = Math.max(0, MAX_TOTAL - currentTotal);
    const toAdd = incoming.slice(0, allowed);
    if (toAdd.length === 0) return;

    onChange({
      ...categoryImages,
      [categoryKey]: [...(categoryImages[categoryKey] || []), ...toAdd],
    });
  }, [categoryImages, onChange]);

  const removeFile = useCallback((categoryKey: string, index: number) => {
    onChange({
      ...categoryImages,
      [categoryKey]: (categoryImages[categoryKey] || []).filter((_, i) => i !== index),
    });
  }, [categoryImages, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" /> Property Photos
        </h3>
        <span className={cn("text-xs font-medium", totalCount >= MAX_TOTAL ? "text-destructive" : "text-muted-foreground")}>
          {totalCount}/{MAX_TOTAL} uploaded
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PHOTO_CATEGORIES.map(cat => {
          const files = categoryImages[cat.key] || [];
          const error = errors[cat.key];
          const met = !cat.required || files.length >= cat.minCount;

          return (
            <CategoryDropZone
              key={cat.key}
              category={cat}
              files={files}
              error={error}
              met={met}
              disabled={totalCount >= MAX_TOTAL && files.length === 0}
              onFiles={fs => handleFiles(cat.key, fs)}
              onRemove={i => removeFile(cat.key, i)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface CategoryDropZoneProps {
  category: PhotoCategory;
  files: File[];
  error?: string;
  met: boolean;
  disabled: boolean;
  onFiles: (files: FileList | File[]) => void;
  onRemove: (index: number) => void;
}

const CategoryDropZone = ({ category, files, error, met, disabled, onFiles, onRemove }: CategoryDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) onFiles(e.dataTransfer.files);
  }, [disabled, onFiles]);

  return (
    <div className={cn(
      "rounded-xl border p-3 space-y-2 transition-colors",
      error ? "border-destructive/50 bg-destructive/5" : "border-border bg-card",
      dragOver && !disabled && "border-primary/50 bg-primary/5"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold">{category.label}</span>
          {category.required ? (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">Required</Badge>
          ) : (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Optional</Badge>
          )}
          {met && files.length > 0 && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
        {category.required && (
          <span className="text-[10px] text-muted-foreground">Min {category.minCount}</span>
        )}
      </div>

      {/* Helper */}
      <p className="text-[10px] text-muted-foreground leading-tight">{category.helperText}</p>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((file, i) => (
            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-border group">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 cursor-pointer transition-colors text-[11px]",
          disabled
            ? "opacity-40 cursor-not-allowed border-muted text-muted-foreground"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary/70"
        )}
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Drop or click to add</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && onFiles(e.target.files)}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
};

export function validateCategoryImages(categoryImages: Record<string, File[]>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const cat of PHOTO_CATEGORIES) {
    if (!cat.required) continue;
    const count = (categoryImages[cat.key] || []).length;
    if (count < cat.minCount) {
      errors[cat.key] = cat.minCount > 1
        ? `Please upload at least ${cat.minCount} ${cat.label} images`
        : `${cat.label} image is required`;
    }
  }
  return errors;
}

export default CategoryPhotoUpload;
