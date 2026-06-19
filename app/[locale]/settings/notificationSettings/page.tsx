import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Shapes, Add } from "@/public/SVG";
import { columns } from "../../../../components/Settings/NotificationSettings/columns";
import FilterDialog from "@/components/Settings/NotificationSettings/FilterDialog";
import { NotificationResponse } from "@/lib/types/responseTypes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";

const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string };
}) => {
  const response = await fetcher<NotificationResponse>(
    `/notification-templates`
  );

  const data = response.data.records;

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Shapes className="w-5 text-iconColor" />,
            label: "الإعدادات ",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إعدادات الإشعارات",
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={data}
        heading="إعدادات الإشعارات"
        currentPage={1}
        totalPages={1}
        filterDialog={<FilterDialog />}
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/apps/notifications/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              إنشاء إشعار
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      />

      {/* {editingNotification && (
        <EditNotificationDialog
          notification={editingNotification}
          onClose={() => setEditingNotification(null)}
          onSave={handleUpdateNotification}
          trigger={null} // no trigger when controlled manually
        />
      )} */}
    </MainLayout>
  );
};

export default Page;
