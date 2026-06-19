"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { validationForUsers } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = () => {
  const [roles, setRoles] = useState<any>([]);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  useEffect(() => {
    const getRoles = async () => {
      try {
        const response = await fetcherClient<any>("/roles");
        setRoles(response.data.records);
      } catch (error) {
      }
    };
    getRoles();
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
            label: "المشرفين",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء مشرف",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
        role: string;
      }>
        initialValues={{
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
        }}
        validationSchema={validationForUsers}
        onSubmit={async (values, { setSubmitting }) => {
          // 
          const formdata: any = new FormData();
          formdata.append("name", values.name);
          formdata.append("email", values.email);
          formdata.append("password", values.password);
          formdata.append("role", values.role);
          try {
            const response = await fetcherClient<any>("/users", {
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
        {(props) => (
          <Form className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <h2 className="text-20 text-textMain font-[700]">إنشاء مشرف</h2>
              <Button variant={"primary"} disabled={props.isSubmitting}>
                حفظ و اضافة
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">بيانات المشرف</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type={"text"}
                  name={"name"}
                  placeholder={"اكتب اسم المستخدم"}
                  label={"الاسم بالكامل"}
                />
                <CustomInput
                  type={"email"}
                  name={"email"}
                  placeholder={"اكتب البريد الالكتروني"}
                  label={"البريد الالكتروني"}
                />
                <CustomInput
                  type={"password"}
                  name={"password"}
                  placeholder={"اكتب كلمة المرور"}
                  label={"كلمة المرور"}
                />
                <CustomInput
                  type={"password"}
                  name={"confirmPassword"}
                  placeholder={"اكتب كلمة المرور"}
                  label={"تاكيد كلمة المرور"}
                />
                <CustomSelect
                  name={"role"}
                  title={"دور"}
                  placeholder="- اختر ـ"
                  options={roles || []}
                  formikProps={props}
                  label="title_ar"
                  value="id"
                  className="md:col-span-2"
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </MainLayout>
  );
};

export default Page;
