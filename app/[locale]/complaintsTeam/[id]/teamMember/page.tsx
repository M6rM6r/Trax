import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { TeamResponse } from "@/lib/types/responseTypes";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const data = await fetcher<TeamResponse>(`/teams/${params.id}`);
  // 
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "الصلاحيات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "إدارة فرق الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "أعضاء الفريق",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <DataTable
          columns={columns}
          data={[
            ...(data.data.team?.manager ? [data.data.team.manager] : []),
            ...(data.data.team?.members ?? []),
          ]}
          heading={`أعضاء الفريق (${data.data.team.members.length} اعضاء)`}
        />
      </div>
    </MainLayout>
  );
};

export default Page;
