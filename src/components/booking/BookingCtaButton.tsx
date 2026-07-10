"use client";

import { ArrowRight } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";
import { useBookingModal } from "./BookingModalContext";

type BookingCtaButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  className?: string;
  showArrow?: boolean;
  onClick?: () => void;
};

export function BookingCtaButton({
  children,
  variant = "primary",
  size = "md",
  className,
  showArrow = false,
  onClick,
}: BookingCtaButtonProps) {
  const { openBooking } = useBookingModal();

  return (
    <GlassButton
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={() => {
        onClick?.();
        openBooking();
      }}
    >
      {children}
      {showArrow && <ArrowRight className="h-4 w-4" aria-hidden />}
    </GlassButton>
  );
}
