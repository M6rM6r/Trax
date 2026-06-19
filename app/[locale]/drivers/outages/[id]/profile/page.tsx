import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import { DriverProfileResponse } from "@/lib/types/responseTypes";
import DriverProfileComponent from "@/components/Drivers/DriverProfileComponent";

const Page = async ({ params }: { params: { id: string } }) => {
  const resposne = await fetcher<DriverProfileResponse>(
    `/drivers/${params.id}`,
    { cache: 'no-store' }
  );

  const profile = resposne.data;

  return (
    <MainLayout showSidebar={false}>
      <DriverProfileComponent driver={profile.driver} />
    </MainLayout>
  );
};

export default Page;
