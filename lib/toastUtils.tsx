/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useToast } from "@/hooks/use-toast";

// Define the expected response object structure (for both success and error)
export interface ResponseObject {
  success: boolean;
  message: string;
  data?: {
    errors?: Record<string, string[]>; // For error cases
    [key: string]: unknown; // Allow additional data for success cases
  };
}

/**
 * Custom hook to show toasts based on a response object
 * Shows a success toast for success responses or the first field-specific error/main message for errors
 */
export const useResponseToast = () => {
  const { toast } = useToast();

  const showResponseToast = (responseObj: ResponseObject) => {
    // Extract the main message

    const mainMessage =
      responseObj.message || (responseObj.success ? "تمت العملية بنجاح" : "حدث خطأ غير متوقع");

    if (responseObj.success) {
      // Success case
      toast({
        variant: "default", // Use 'default' or a custom success variant
        description: mainMessage,
      });
    } else {
      // Error case
      const fieldErrors = responseObj.data?.errors;
      let toastMessage = mainMessage;

      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        // Get the first field and its first error message
        const [firstField, errorMessages] = Object.entries(fieldErrors)[0];
        toastMessage = errorMessages[0];
      }

      toast({
        variant: "destructive", // Use 'destructive' for error styling
        description: toastMessage,
      });
    }
  };

  return { showResponseToast };
};
