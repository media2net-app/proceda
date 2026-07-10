import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type GlassButtonBaseProps = {
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
};

type GlassButtonAsLink = GlassButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof GlassButtonBaseProps> & {
    href: string;
    onClick?: never;
  };

type GlassButtonAsButton = GlassButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof GlassButtonBaseProps> & {
    href?: undefined;
    onClick?: () => void;
  };

type GlassButtonProps = GlassButtonAsLink | GlassButtonAsButton;

function glassClasses(variant: "primary" | "secondary", size: "sm" | "md", className?: string) {
  return cn(
    "glass-btn",
    variant === "primary" ? "glass-btn-primary" : "glass-btn-secondary",
    size === "sm" ? "glass-btn-sm" : "glass-btn-md",
    className,
  );
}

export function GlassButton(props: GlassButtonProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;

  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest as GlassButtonAsLink;
    return (
      <a href={href} className={glassClasses(variant, size, className)} {...anchorProps}>
        <span className="glass-btn-inner">{children}</span>
      </a>
    );
  }

  const { onClick, ...buttonProps } = rest as GlassButtonAsButton;
  return (
    <button
      type="button"
      onClick={onClick}
      className={glassClasses(variant, size, className)}
      {...buttonProps}
    >
      <span className="glass-btn-inner">{children}</span>
    </button>
  );
}
