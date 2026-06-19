import { fetcherClient } from "@/lib/fetcherClient";
import { Driver } from "@/lib/types/responseTypes";
import { Edit2 } from "@/public/SVG";
import { usePathname } from "next/navigation";
import { useState } from "react";
import EditDriver from "../EditDriver";
import { EVehicleType } from "@/lib/types/enums";
import EditCustomer from "@/components/Customers/EditCustomer";

const Index = ({ id }: { id: number }) => {
  const [profileData, setProfileData] = useState<Driver>({} as Driver);
  const [showDialog, setShowDialog] = useState(false);
  const pathname = usePathname();
  const fetchData = async () => {
    try {
      const data = await fetcherClient<any>(`/drivers/${id}`, {
        cache: "no-cache",
        next: { revalidate: 0 },
      });
      setProfileData(data.data.driver);
      setShowDialog(true);
    } catch (err) {
      setProfileData({} as Driver); // Reset to empty object on error
    } finally {
    }
  };

  // Handle button click
  const handleEditClick = () => {
    fetchData();
  };
  return (
    <div className=" overflow-hidden">
      <button
        onClick={handleEditClick}
        className="w-full flex items-center gap-4 justify-start text-12 text-textMain hover:bg-primaryColorLight p-3 cursor-pointer "
      >
        <Edit2 className="w-5 text-black" />
        تعديل البيانات
      </button>
      {pathname.includes("/drivers") ? (
        <div className=" h-0 opacity-0 over">
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
        <div className=" h-0 opacity-0 over">
          <EditCustomer profileData={profileData} showAutomatic={showDialog} />
        </div>
      ) : null}
    </div>
  );
};

export default Index;

{
  /* <button className="w-full relative" onClick={handleEditClick}>
{isFetching ? (
  <div className="flex items-center gap-4 justify-start text-12 text-textMain hover:bg-primaryColorLight p-3 cursor-pointer ">
    <Edit2 className="w-5 text-black" />
    تعديل البيانات
  </div>
) : profileData && Object.keys(profileData).length > 0 ? (
  <EditDriver
    profileData={profileData}
    vehicleType={
      pathname.includes("taxi")
        ? EVehicleType.taxi
        : pathname.includes("light_transportation")
        ? EVehicleType.light_transportation
        : pathname.includes("wensh")
        ? EVehicleType.wensh
        : pathname.includes("fontas")
        ? EVehicleType.fontas
        : pathname.includes("drivers_without_car")
        ? EVehicleType.driver_without_car
        : EVehicleType.taxi
    }
  />
) : (
  <div className="flex items-center gap-4 justify-start text-12 text-textMain hover:bg-primaryColorLight p-3 cursor-pointer ">
    <Edit2 className="w-5 text-black" />
    تعديل البيانات
  </div>
)}
</button> */
}
