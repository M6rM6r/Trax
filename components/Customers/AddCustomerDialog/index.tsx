"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Add } from "@/public/SVG";
import dynamic from "next/dynamic";
import { useState } from "react";

const LazyAddCustomer = dynamic(
  () => import("@/components/Customers/AddCustomer"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />
    ),
  }
);

const AddCustomerDialog = () => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <CustomDialog
      title="اضافة عميل جديد"
      color={Colors.primary}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="primary" size="lg">
          اضافة عميل جديد
          <Add className="w-6 text-white" />
        </Button>
      }
      content={<LazyAddCustomer onSuccess={handleSuccess} />}
    />
  );
};

export default AddCustomerDialog;
