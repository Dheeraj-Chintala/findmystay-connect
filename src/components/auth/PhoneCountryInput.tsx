import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PHONE_COUNTRIES } from "@/lib/phoneCountries";

export type PhoneCountryInputProps = {
  id?: string;
  dialCode: string;
  onDialCodeChange: (dialCode: string) => void;
  nationalNumber: string;
  onNationalChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** StayNest auth pages use warm borders; Owner Login uses default theme. */
  variant?: "staynest" | "default";
  nationalPlaceholder?: string;
};

export function PhoneCountryInput({
  id,
  dialCode,
  onDialCodeChange,
  nationalNumber,
  onNationalChange,
  disabled,
  className,
  variant = "staynest",
  nationalPlaceholder = "9876543210",
}: PhoneCountryInputProps) {
  const isStaynest = variant === "staynest";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Phone
        className={cn("h-4 w-4 shrink-0", isStaynest ? "text-[#9B9B9B]" : "text-muted-foreground")}
        aria-hidden
      />
      <Select value={dialCode} onValueChange={onDialCodeChange} disabled={disabled}>
        <SelectTrigger
          id={id ? `${id}-dial` : undefined}
          className={cn(
            "h-11 w-[118px] shrink-0 rounded-xl px-2 text-left text-sm",
            isStaynest ? "border-[#E8E0D8]" : "",
          )}
        >
          <SelectValue placeholder="Code" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {PHONE_COUNTRIES.map((c) => (
            <SelectItem key={c.dialCode} value={c.dialCode}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id ? `${id}-national` : undefined}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={nationalPlaceholder}
        className={cn(
          "h-11 min-w-0 flex-1 rounded-xl pl-3",
          isStaynest ? "border-[#E8E0D8]" : "",
        )}
        value={nationalNumber}
        disabled={disabled}
        onChange={(e) => onNationalChange(e.target.value.replace(/[^\d]/g, ""))}
      />
    </div>
  );
}
