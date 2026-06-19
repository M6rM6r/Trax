/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import { useEffect, useState } from "react";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { useRouter } from "next/navigation";
import { groupByGroupToArray } from "@/lib/helperFunctions";
import { Checkbox } from "@/components/ui/checkbox";

const Page = ({ params }: { params: { id: string } }) => {
  const [data, setData] = useState<any>({});
  const [groupedPermissions, setGroupedPermissions] = useState<any>([]);
  const [permissions, setPermissions] = useState<any>([]);
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
    const getUser = async () => {
      try {
        const response = await fetcherClient<any>(`/users/${params.id}`);
        
        setData(response.data.user);
        setGroupedPermissions(
          groupByGroupToArray(response.data.user.permissions)
        );
      } catch (error) {
        
      }
    };
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
    getUser();
    getRoles();
    getPermissions();
  }, [params.id]);
  const rolePermissions = data?.permissions?.map(
    (permission: any) => permission.id
  );

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
            label: "تعديل صلاحية المشرف",
          },
        ]}
      />
      <GoBack />
      {roles.length > 0 && data.name && permissions ? (
        <Formik<{
          name: string;
          email: string;
          password: string;
          confirmPassword: string;
          role: string;
          permissions: number[];
        }>
          initialValues={{
            name: data.name,
            email: data.email,
            password: "",
            confirmPassword: "",
            role: "",
            permissions: rolePermissions || [],
          }}
          // validationSchema={validationForUsers}
          onSubmit={async (values, { setSubmitting }) => {
            // 
            const formdata: any = new FormData();
            formdata.append("_method", "put");
            formdata.append("name", values.name);
            formdata.append("email", values.email);
            values.password && formdata.append("password", values.password);
            formdata.append("role", values.role);
            values.permissions.length > 0 &&
              values.permissions.forEach((permission: number) => {
                formdata.append("permissions[]", permission);
              });
            try {
              const response = await fetcherClient<any>(`/users/${params.id}`, {
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
                <h2 className="text-20 text-textMain font-[700]">
                  تعديل المشرف
                </h2>
                <Button variant={"primary"} disabled={props.isSubmitting}>
                  حفظ التعديلات
                </Button>
              </div>
              <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                <p className="text-16 text-textMain font-[600]">
                  بيانات المشرف
                </p>
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
                  {/* <CustomSelect
                    name={"role"}
                    title={"دور"}
                    placeholder="- اختر ـ"
                    options={roles || []}
                    formikProps={props}
                    label="title_ar"
                    value="id"
                    className="md:col-span-2"
                  /> */}
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
                        (permission: { id: number; title_ar: string }) => (
                          <div
                            key={permission.id}
                            className="flex items-center gap-3"
                          >
                            <Checkbox
                              value={permission.id}
                              checked={props.values.permissions.includes(
                                permission.id
                              )}
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
              </div>
            </Form>
          )}
        </Formik>
      ) : (
        <span className="pin"></span>
      )}
    </MainLayout>
  );
};

export default Page;
