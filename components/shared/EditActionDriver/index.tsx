import { fetcherClient } from "@/lib/fetcherClient";
import { Edit2 } from "@/public/SVG";
import { usePathname } from "next/navigation";
import { useState } from "react";
import EditDriver from "../EditDriver";
import { EVehicleType } from "@/lib/types/enums";
import EditCustomer from "@/components/Customers/EditCustomer";

const Index = ({ id }: { id: number }) => {
  const [profileData, setProfileData] = useState<any>();
  const [showDialog, setShowDialog] = useState(false);
  const pathname = usePathname();
  const fetchData = async () => {
    try {
      const data = await fetcherClient<any>(
        `/${pathname.includes("/drivers") ? "drivers" : "customers"}/${id}`,
        {
          cache: "no-cache",
          next: { revalidate: 0 },
        }
      );
      setProfileData(
        pathname.includes("/drivers") ? data.data.driver : data.data.customer
      );
      setShowDialog(true);
    } catch (err) {
      console.error(err);
      setProfileData({}); // Reset to empty object on error
    } finally {
    }
  };

  // Handle button click
  const handleEditClick = () => {
    fetchData();
  };
  return (
    <div className=" ">
      <button
        onClick={handleEditClick}
        className="w-full flex items-center gap-4 justify-start text-12 text-textMain hover:bg-primaryColorLight p-3 cursor-pointer "
      >
        <Edit2 className="w-5 text-black" />
        تعديل البيانات
      </button>
      {pathname.includes("/drivers") ? (
        <div className=" h-0 opacity-0 over z-[-1]">
          <EditDriver
            profileData={profileData}
            vehicleType={
              pathname.includes("taxi")
                ? EVehicleType.taxi
                : pathname.includes("lightTransportation")
                ? EVehicleType.light_transportation
                : pathname.includes("wensh")
                ? EVehicleType.wensh
                : pathname.includes("fontas")
                ? EVehicleType.fontas
                : pathname.includes("driversWithoutCar")
                ? EVehicleType.driver_without_car
                : pathname.includes("fast_support")
                ? EVehicleType.fast_support
                : pathname.includes("fuel")
                ? EVehicleType.fuel
                : pathname.includes("towing")
                ? EVehicleType.towing
                : EVehicleType.taxi
            }
            showAutomatic={showDialog}
          />
        </div>
      ) : pathname.includes("/customers") ? (
        <div className=" h-0 opacity-0 over z-[-1]">
          <EditCustomer profileData={profileData} showAutomatic={showDialog} />
        </div>
      ) : null}
    </div>
  );
};

export default Index;
