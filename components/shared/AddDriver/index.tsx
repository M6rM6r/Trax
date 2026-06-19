"use client";
import { Button } from "@/components/ui/button";
import { EVehicleType } from "@/lib/types/enums";
import CustomDialog, { Colors } from "../CustomDialog";
import { Add } from "@/public/SVG";
import { useState } from "react";
import AddBasic from "./AddBasic";
import { Driver } from "@/lib/types/responseTypes";
import EditDriverTaxi from "@/components/taxi/EditDriverTaxi";
import EditDriverLight from "@/components/lightTransportation/EditDriverLight";
import EditDriverWensh from "@/components/wensh/EditDriverWensh";
import EditDriverWithoutCar from "@/components/driverWithoutCar/EditDriverWithoutCar";
import EditDriverFontas from "@/components/fontas/EditDriverFontas";
import EditDriverOutages from "@/components/outages/EditDriverOutages";
import EditDriverFuel from "@/components/fuel/EditDriverFuel";
import EditDriverTowing from "@/components/towing/EditDriverTowing";

const Index = ({ vehicleType }: { vehicleType: EVehicleType }) => {
  const [showBasicData, setShowBasicData] = useState(true);
  const [profileData, setProfileData] = useState<Driver>({} as Driver);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setShowBasicData(true);
    setProfileData({} as Driver);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset profileData when opening the dialog for a new driver
      setProfileData({} as Driver);
      setShowBasicData(true);
    } else {
      // Call close handler when dialog is closed
      handleCloseDialog();
    }
    setIsDialogOpen(open);
  };

  return (
    <CustomDialog
      title="اضافة سائق جديد"
      color={Colors.primary}
      open={isDialogOpen}
      onOpenChange={handleOpenChange}
      trigger={
        <Button variant="primary" size="lg">
          اضافة سائق جديد <Add className="w-6 text-white" />
        </Button>
      }
      content={
        showBasicData ? (
          <AddBasic
            vehicleType={vehicleType}
            setShowBasicData={setShowBasicData}
            setProfileData={setProfileData}
          />
        ) : vehicleType === EVehicleType.taxi ? (
          <EditDriverTaxi
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : vehicleType === EVehicleType.light_transportation ? (
          <EditDriverLight
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : vehicleType === EVehicleType.wensh ? (
          <EditDriverWensh
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : vehicleType === EVehicleType.driver_without_car ? (
          <EditDriverWithoutCar
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicle_type={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : vehicleType === EVehicleType.fontas ? (
          <EditDriverFontas
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : vehicleType === EVehicleType.fast_support ? (
          <EditDriverOutages
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : vehicleType === EVehicleType.fuel ? (
          <EditDriverFuel
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : vehicleType === EVehicleType.towing ? (
          <EditDriverTowing
            key={profileData.id || 'new-driver'}
            profileData={profileData}
            vehicleType={vehicleType}
            onClose={handleCloseDialog}
            isNewDriver={!profileData.id}
          />
        ) : null
      }
    />
  );
};

export default Index;
