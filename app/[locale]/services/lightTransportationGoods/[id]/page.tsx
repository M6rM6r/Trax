import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Edit2, Flash, Star } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { ShowLightTransportationCargo } from "@/lib/types/responseTypes";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import Image from "next/image";
import EditLightTransportGoods from "@/components/lightTransportation/EditLightTransportGoods";
const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<ShowLightTransportationCargo>(
    `/lightTransportationCargo/${params.id}`,
    { cache: 'no-store' } // Disable caching for fresh data
  );
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الخدمات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "النقل الخفيف",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "أضف نوع لخدمة النقل الخفيف",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل النوع</h2>
          <div className=" flex items-center gap-4">
            <EditLightTransportGoods
              lightTransportgoodsData={data.data.light_transportation_cargo}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4  gap-5 border border-gray200 rounded-6 p-5">
          {data.data.light_transportation_cargo.icon && (
            <Image
              src={data.data.light_transportation_cargo.icon || ""}
              alt="avatar"
              width={40}
              height={40}
              className=" rounded-full w-10 h-10"
            />
          )}

          <TitleAndSubTitle
            title="الاسم بالعربية"
            subTitle={data.data.light_transportation_cargo.name_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.light_transportation_cargo.name_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={
                data.data.light_transportation_cargo.is_active === 1
                  ? "مفعل"
                  : "غير مفعل"
              }
              green={
                data.data.light_transportation_cargo.is_active === 1
                  ? true
                  : false
              }
            />
          </div>
          <TitleAndSubTitle
            title="نوع الخدمة"
            subTitle={data.data.light_transportation_cargo.cargo_type}
          />
          {data.data.light_transportation_cargo.details[0].basin_size && (
            <TitleAndSubTitle
              title="حجم الحوض"
              subTitle={
                data.data.light_transportation_cargo.details[0].basin_size
              }
            />
          )}
          {data.data.light_transportation_cargo.details[0].half_basin_price && (
            <TitleAndSubTitle
              title="سعر نصف الحوض"
              subTitle={
                data.data.light_transportation_cargo.details[0].half_basin_price
              }
            />
          )}
          {data.data.light_transportation_cargo.details[0].full_basin_price && (
            <TitleAndSubTitle
              title="سعر الحوض الكامل"
              subTitle={
                data.data.light_transportation_cargo.details[0].full_basin_price
              }
            />
          )}
          {data.data.light_transportation_cargo.details[0].unit && (
            <TitleAndSubTitle
              title="الوحدة"
              subTitle={data.data.light_transportation_cargo.details[0].unit}
            />
          )}
          {data.data.light_transportation_cargo.details[0].free_limit &&
            data.data.light_transportation_cargo.cargo_type_key ===
              "weight" && (
              <TitleAndSubTitle
                title="الوزن المجاني"
                subTitle={
                  data.data.light_transportation_cargo.details[0].free_limit
                }
              />
            )}
          {data.data.light_transportation_cargo.details[0].price_per_unit &&
            data.data.light_transportation_cargo.cargo_type_key ===
              "weight" && (
              <TitleAndSubTitle
                title="السعر/ الوزن لأكثر من الوزن المجاني"
                subTitle={
                  data.data.light_transportation_cargo.details[0].price_per_unit
                }
              />
            )}
          {data.data.light_transportation_cargo.details[0].price_per_unit &&
            data.data.light_transportation_cargo.cargo_type_key === "count" && (
              <TitleAndSubTitle
                title="السعر/ الوحدة لأكثر من الوزن المجاني"
                subTitle={
                  data.data.light_transportation_cargo.details[0].price_per_unit
                }
              />
            )}
          {data.data.light_transportation_cargo.details[0].free_limit &&
            data.data.light_transportation_cargo.cargo_type_key === "count" && (
              <TitleAndSubTitle
                title="العدد المجاني"
                subTitle={
                  data.data.light_transportation_cargo.details[0].free_limit
                }
              />
            )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
