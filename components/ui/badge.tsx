import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        warning:
          "border-transparent bg-accentWarningLight text-14 text-accentWarning h-[30px] rounded-full px-3 after:content-[' '] after:inline-block after:w-[8px] after:h-[8px] after:bg-accentWarning after:rounded-full after:ms-2 after:mt-[2px]",
        error:
          "border-transparent bg-[#FEF3F2] text-14 text-[#F04438] h-[30px] rounded-full px-3 after:content-[' '] after:inline-block after:w-[8px] after:h-[8px] after:bg-[#F04438] after:rounded-full after:ms-2 after:mt-[2px]",
        success:
          "border-transparent bg-[#ECFDF3] text-14 text-[#12B76A] h-[30px] rounded-full px-3 after:content-[' '] after:inline-block after:w-[8px] after:h-[8px] after:bg-[#12B76A] after:rounded-full after:ms-2 after:mt-[2px]",
        refused:
          "border-transparent bg-[#FDEEEE] text-14 text-[#E92727] h-[30px] rounded-full px-3 after:content-[' '] after:inline-block after:w-[8px] after:h-[8px] after:bg-[#E92727] after:rounded-full after:ms-2 after:mt-[2px]",
        new: "border-transparent bg-[#E6F0F7] text-14 text-[#066BAF] h-[30px] rounded-full px-3 after:content-[' '] after:inline-block after:w-[8px] after:h-[8px] after:bg-[#066BAF] after:rounded-full after:ms-2 after:mt-[2px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
