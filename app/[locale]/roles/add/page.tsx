"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import { Checkbox } from "@/components/ui/checkbox";
import { validationForRoles } from "@/lib/types/validationTypes";
import { useEffect, useState } from "react";
import { fetcherClient } from "@/lib/fetcherClient";
import { groupByGroupToArray } from "@/lib/helperFunctions";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";

const Page = () => {
  const [permissions, setPermissions] = useState<any>([]);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  useEffect(() => {
    const getPermissions = async () => {
      try {
        const response = await fetcherClient<any>(
          "/modelDDLList?model_name=Permission"
        );
        const groupedPermissions = groupByGroupToArray(response.data?.records);
        setPermissions(groupedPermissions);
      } catch (error) {
      }
    };
    getPermissions();
  }, []);

  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "صلاحيات المشرفين",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الأدوار",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "انشاء الدور",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        title_ar: string;
        title_en: string;
        permissions: number[];
      }>
        initialValues={{
          title_ar: "",
          title_en: "",
          permissions: [],
        }}
        validationSchema={validationForRoles}
        onSubmit={async (values, { setSubmitting }) => {
          // 
          const formdata: any = new FormData();
          formdata.append("title_ar", values.title_ar);
          formdata.append("title_en", values.title_en);
          values.permissions.length > 0 &&
            values.permissions.forEach((permission: number) => {
              formdata.append("permissions[]", permission);
            });
          try {
            const response = await fetcherClient<any>("/roles", {
              method: "POST",
              body: formdata,
            });
           
            showResponseToast(response);
            router.refresh();
          } catch (error: any) {
            showResponseToast(error.info);
          }
          setSubmitting(false);
        }}
      >
        {(props) => (
          <Form className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <h2 className="text-20 text-textMain font-[700]">إنشاء دور</h2>
              <Button
                variant={"primary"}
                type="submit"
                disabled={props.isSubmitting}
              >
                انشىء الدور
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">اسم الدور</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type={"text"}
                  name={"title_ar"}
                  placeholder={"اكتب الاسم بالعربية"}
                  label={"الاسم بالعربية"}
                />
                <CustomInput
                  type={"text"}
                  name={"title_en"}
                  placeholder={"اكتب الاسم بالانجليزية"}
                  label={"الاسم بالانجليزية"}
                />
              </div>
            </div>
            <h2 className="text-20 text-textMain font-[700]">الصلاحيات</h2>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
              {permissions?.map((item: any, index: number) => (
                <div
                  key={index}
                  className=" flex flex-col gap-5 rounded-6 p-5 border border-gray200"
                >
                  <p className="text-16 text-textMain font-[600]">
                    {item.group_ar}
                  </p>
                  {item?.items?.map(
                    (permission: {
                      id: number;
                      title_ar: string;
                      title_en: string;
                    }) => (
                      <div
                        key={permission.id}
                        className="flex items-center gap-3"
                      >
                        <Checkbox
                          value={permission.id}
                          onCheckedChange={() => {
                            props.values.permissions.includes(permission.id)
                              ? props.setFieldValue(
                                  "permissions",
                                  props.values.permissions.filter(
                                    (item: any) => item !== permission.id
                                  )
                                )
                              : props.setFieldValue("permissions", [
                                  ...props.values.permissions,
                                  permission.id,
                                ]);
                          }}
                        />
                        <label className="text-14 text-textMain font-[600]">
                          {permission.title_ar}
                        </label>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </Form>
        )}
      </Formik>
    </MainLayout>
  );
};

export default Page;
