"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border border-iconColor shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primaryColor disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primaryColor data-[state=checked]:border-primaryColor text-iconColor data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    <span className={cn("flex items-center justify-center text-current")}>
      <Check className="h-3 w-3" />
    </span>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
