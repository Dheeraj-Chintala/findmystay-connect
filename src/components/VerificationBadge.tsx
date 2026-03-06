import { ShieldCheck, Camera, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeType = "owner_verified" | "platform_verified" | "premium_verified" | null | undefined;

interface VerificationBadgeProps {
  type: BadgeType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  captureDate?: string;
  className?: string;
}

const badgeConfig: Record<string, { icon: typeof ShieldCheck; label: string; description: string; className: string }> = {
  owner_verified: {
    icon: Camera,
    label: "Owner Verified",
    description: "Photos verified by owner",
    className: "bg-accent/10 text-accent border-accent/30",
  },
  platform_verified: {
    icon: ShieldCheck,
    label: "Verified by StayNest Team",
    description: "Professionally captured & verified",
    className: "bg-verified/10 text-verified border-verified/30",
  },
  premium_verified: {
    icon: BadgeCheck,
    label: "Premium Verified",
    description: "Fully verified listing",
    className: "bg-primary/10 text-primary border-primary/30",
  },
};

const VerificationBadge = ({ type, size = "md", showLabel = true, captureDate, className }: VerificationBadgeProps) => {
  if (!type || !badgeConfig[type]) return null;

  const config = badgeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const iconSizes = { sm: "w-3 h-3", md: "w-3.5 h-3.5", lg: "w-4 h-4" };

  return (
    <div className={cn("inline-flex flex-col items-start", className)}>
      <Badge className={cn("border font-semibold", config.className, sizeClasses[size])}>
        <Icon className={iconSizes[size]} />
        {showLabel && <span>✔ {config.label}</span>}
      </Badge>
      {captureDate && size !== "sm" && (
        <span className="text-[10px] text-muted-foreground mt-0.5 ml-1">
          Captured on: {new Date(captureDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      )}
    </div>
  );
};

export default VerificationBadge;
