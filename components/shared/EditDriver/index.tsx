"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Edit2 } from "@/public/SVG";
import { useEffect, useRef, useState } from "react";
import { Driver } from "@/lib/types/responseTypes";
import EditBasicData from "@/components/shared/form/EditBasicData";
import { EVehicleType } from "@/lib/types/enums";
import EditDriverTaxiForm from "@/components/taxi/EditDriverTaxi";
import EditDriverLight from "@/components/lightTransportation/EditDriverLight";
import EditDriverWensh from "@/components/wensh/EditDriverWensh";
import EditDriverWithoutCar from "@/components/driverWithoutCar/EditDriverWithoutCar";
import EditDriverFontas from "@/components/fontas/EditDriverFontas";
import EditDriverFuel from "@/components/fuel/EditDriverFuel";
import EditDriverTowing from "@/components/towing/EditDriverTowing";
import EditDriverOutages from "@/components/outages/EditDriverOutages";

const Index = ({
  profileData,
  vehicleType,
  showBasic = true,
  showAutomatic = false,
}: {
  profileData: Driver;
  vehicleType: EVehicleType;
  showBasic?: boolean;
  showAutomatic?: boolean;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false); // ✅ control open state
  const [showBasicData, setShowBasicData] = useState(showBasic);

  useEffect(() => {
    showAutomatic && buttonRef.current?.click();
  }, [showAutomatic]);

  const handleClose = () => setOpen(false);

  return (
    <CustomDialog
      title="تعديل بيانات السائق"
      color={Colors.primary}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          ref={buttonRef}
          className="w-full flex items-center gap-3 justify-start text-sm text-gray-700 hover:bg-gray-50 p-3 rounded-md transition-colors"
        >
          <Edit2 className="w-4 h-4 text-gray-600" />
          تعديل البيانات
        </button>
      }
      content={
        showBasicData ? (
          <EditBasicData
            setShowBasicData={setShowBasicData}
            profileData={profileData}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.taxi ? (
          <EditDriverTaxiForm
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.light_transportation ? (
          <EditDriverLight
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.wensh ? (
          <EditDriverWensh
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.driver_without_car ? (
          <EditDriverWithoutCar
            profileData={profileData}
            vehicle_type={vehicleType}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.fontas ? (
          <EditDriverFontas
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.fast_support ? (
          <EditDriverOutages
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.fuel ? (
          <EditDriverFuel
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleClose}
          />
        ) : vehicleType === EVehicleType.towing ? (
          <EditDriverTowing
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleClose}
          />
        ) : null
      }
    />
  );
};

export default Index;
