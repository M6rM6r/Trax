import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import {
  Edit2,
  EyeB,
  EyeWhite,
  Flash,
  Slash,
  Star,
  User,
  UserRemove,
} from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import { fetcher } from "@/lib/fetcher";
import { DriverProfileResponse } from "@/lib/types/responseTypes";
import WalletTable from "@/components/shared/WalletTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical } from "lucide-react";
import EditDriver from "@/components/shared/EditDriver";
import { EVehicleType } from "@/lib/types/enums";
import { Separator } from "@/components/ui/separator";
import WarningDialog from "@/components/shared/WarningDialog";
import ErrorDialog from "@/components/shared/ErrorDialog";
const Page = async ({ params }: { params: { id: string } }) => {
  const profile = await fetcher<DriverProfileResponse>(`/drivers/${params.id}`);
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "السائقين",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "جميع السائقين",
          },
          {
            icon: <User className="w-5 text-iconColor" />,
            label: profile.data.driver.name,
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">المحفظة</h2>
          <div className="flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/drivers/fontas/${params.id}`}>
                <span> عرض رحلات السائق</span>
                <EyeWhite />
              </Link>
            </Button>
            <Button variant={"primaryLight"} asChild>
              <Link href={`/ar/drivers/fontas/${params.id}/profile`}>
                <span>عرض الملف الشخصي</span>
                <EyeB />
              </Link>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-[36px] w-[36px] p-0 data-[state=open]:bg-muted border border-textBorder rounded-6"
                >
                  <MoreVertical className="!w-5 !h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[160px]"
                side="bottom"
                align="end"
              >
                <div className=" relative">
                  <button className="w-full flex items-center gap-4 justify-start text-12 text-textMain hover:bg-primaryColorLight p-3 cursor-pointer  relative">
                    <Edit2 className="w-5 text-black" />
                    تعديل البيانات
                  </button>
                  <div className=" absolute top-0 left-0 w-full h-full bg-red-500 opacity-0">
                    <EditDriver
                      profileData={profile.data.driver}
                      vehicleType={EVehicleType.fontas}
                    />
                  </div>
                </div>

                <Separator />
                <WarningDialog
                  id={profile.data.driver.id}
                  is_active={profile.data.driver.is_active}
                  trigger={
                    <button className="w-full flex items-center gap-4 justify-start text-12 text-accentWarning hover:bg-accentWarningLight hover:text-accentWarning p-3 relative">
                      <Slash className="w-5 text-accentWarning" />
                      {profile.data.driver.is_active
                        ? "حظر المستخدم"
                        : "رفع حظر المستخدم"}
                    </button>
                  }
                />
                <Separator />
                <ErrorDialog
                  id={profile.data.driver.id}
                  trigger={
                    <button className="w-full flex items-center gap-4 justify-start text-12 text-error hover:bg-error50 hover:text-error p-3">
                      <UserRemove className="w-5 text-error" />
                      حذف المستخدم
                    </button>
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <WalletTable wallet={profile.data.driver.wallet} />
      </div>
    </MainLayout>
  );
};

export default Page;
