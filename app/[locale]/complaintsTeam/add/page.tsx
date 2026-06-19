"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { useRouter } from "next/navigation";
import { useFetchModelName } from "@/hooks/useFetchDDLModel";
import {
  DDLListForCategoryResponse,
  DDLListForUserResponse,
} from "@/lib/types/responseTypes";
import { validationForTeams } from "@/lib/types/validationTypes";

const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = () => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const { data: categories } =
    useFetchModelName<DDLListForCategoryResponse>("ComplaintCategory");
  const { data: users } = useFetchModelName<DDLListForUserResponse>("User");

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
            label: "إنشاء فريق",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        title_ar: string;
        title_en: string;
        is_active: string;
        categories: string[];
        manager: any;
        members: any[];
      }>
        initialValues={{
          title_ar: "",
          title_en: "",
          is_active: "",
          categories: [],
          manager: "",
          members: [],
        }}
        validationSchema={validationForTeams}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata: any = new FormData();
          formdata.append("title_ar", values.title_ar);
          formdata.append("title_en", values.title_en);
          formdata.append("is_active", values.is_active);
          values.categories &&
            values.categories.forEach((item: any) => {
              formdata.append("categories[]", item);
            });
          formdata.append("manager", values.manager);
          values.members &&
            values.members.forEach((item: any) => {
              formdata.append("members[]", item);
            });
          try {
            const response = await fetcherClient<any>("/teams", {
              method: "POST",
              body: formdata,
            });

            showResponseToast(response);
            router.refresh();
          } catch (error: any) {
            showResponseToast(error.info);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {(props) => {
          // Filter members options to exclude the selected manager
          const filteredMembersOptions = users?.data.records
            ? users.data.records
                .filter((user) => user.id !== props.values.manager)
                .map((item) => ({
                  label: item.name,
                  value: item.id,
                }))
            : [];

          // Filter manager options to exclude any selected members
          const filteredManagerOptions = users?.data.records
            ? users.data.records
                .filter((user) => !props.values.members.includes(user.id))
                .map((item) => ({
                  label: item.name,
                  value: item.id,
                }))
            : [];
          return (
            <Form className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
              <div className="flex items-center justify-between flex-wrap gap-5">
                <h2 className="text-20 text-textMain font-[700]">إنشاء فريق</h2>
                <Button
                  variant={"primary"}
                  type="submit"
                  disabled={props.isSubmitting}
                >
                  انشىء الفريق
                </Button>
              </div>
              <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                <p className="text-16 text-textMain font-[600]">
                  تفاصيل الفريق
                </p>
                <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <CustomInput
                    type="text"
                    name="title_ar"
                    placeholder="الاسم بالعربية"
                    label="الاسم بالعربية"
                  />
                  <CustomInput
                    type="text"
                    name="title_en"
                    placeholder="الاسم بالإنجليزية"
                    label="الاسم بالإنجليزية"
                  />
                  <CustomSelect
                    name="is_active"
                    title="الحالة"
                    placeholder="- اختر ـ"
                    options={[
                      { label: "مفعل", value: "1" },
                      { label: "غير مفعل", value: "0" },
                    ]}
                    formikProps={props}
                    label="label"
                    value="value"
                    className="md:col-span-2 lg:col-span-1"
                  />
                  <CustomSelect
                    name="categories"
                    title="ربط بتصنيف شكوى"
                    placeholder="- اختر ـ"
                    options={
                      categories
                        ? categories?.data.records.map((item) => ({
                            label: item.title_ar,
                            value: item.id,
                          }))
                        : []
                    }
                    formikProps={props}
                    label="label"
                    value="value"
                    className="md:col-span-2"
                    isMultiple
                  />
                  <CustomSelect
                    name="manager"
                    title="اختر مدير الفريق"
                    placeholder="- اختر ـ"
                    options={filteredManagerOptions}
                    formikProps={props}
                    label="label"
                    value="value"
                    className="md:col-span-2 lg:col-span-1"
                  />
                  <CustomSelect
                    name="members"
                    title="أعضاء الفريق"
                    placeholder="- اختر ـ"
                    options={filteredMembersOptions}
                    formikProps={props}
                    label="label"
                    value="value"
                    className="md:col-span-3"
                    isMultiple
                  />
                </div>
              </div>
              {/* <DataTable
        columns={columns}
        data={users?.data?.records}
        heading='أعضاء الفريق'
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link  
              href={`/${params.locale}/complaintsTeam/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              إنشاء فريق
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      /> */}
            </Form>
          );
        }}
      </Formik>
    </MainLayout>
  );
};

export default Page;
