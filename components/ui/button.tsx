import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none ",
  {
    variants: {
      variant: {
        primary: "bg-primaryColor text-white shadow hover:bg-primaryColor/90",
        success: "bg-[#10B981] text-white shadow hover:bg-[#10B981]/90",
        primaryLight: "bg-primaryColorLight text-primaryColor shadow hover:bg-primaryColorLight/90",
        warning: "bg-accentWarning text-white shadow hover:bg-accentWarning/90",
        warningLight:
          "bg-accentWarningLight text-accentWarning shadow hover:bg-accentWarningLight/90",
        warningOutline: "bg-white text-accentWarning  border border-accentWarning",
        error: "bg-error text-white shadow hover:bg-error/90",
        dangerLight:
          "bg-accentDangerLight text-white shadow hover:bg-accentDangerLight/90 text-accentDanger",
        errorOutline: "bg-white text-error border border-error  ",
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
