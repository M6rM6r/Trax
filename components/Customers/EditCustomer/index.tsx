/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Edit2 } from "@/public/SVG";
import { useEffect, useRef, useState } from "react";
import CustomInput from "@/components/shared/form/CustomInput";
import CustomPhoneNumber from "@/components/shared/form/CustomPhoneNumber";
import CustomFileImage, {
  EImageType,
} from "@/components/shared/form/CustomFileImage";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { fetcherClient } from "@/lib/fetcherClient";
import dynamic from "next/dynamic";
import { BasicFormValues } from "@/lib/types/formTypes";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const validationSchema = Yup.object({
  image: Yup.mixed().nullable(),
  name: Yup.string()
    .required("الاسم مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل"),
  gender: Yup.string().required("الجنس مطلوب"),
  mobile: Yup.string().required("رقم الجوال مطلوب"),
  // email: Yup.string()
  //   .email("البريد الالكتروني غير صحيح")
  //   .required("البريد الالكتروني مطلوب"),
  country_code: Yup.string().required("رقم الجوال مطلوب"),
  phone: Yup.string().required("رقم الجوال مطلوب"),
});
const Index = ({
  profileData,
  showAutomatic = false,
}: {
  profileData: any;
  showAutomatic?: boolean;
}) => {
  const { showResponseToast } = useResponseToast();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (showAutomatic) {
      setOpen(true);
    }
  }, [showAutomatic]);

  return (
    <CustomDialog
      title="تعديل بيانات العميل "
      color={Colors.primary}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant={"primaryLight"} ref={buttonRef}>
          تعديل البيانات <Edit2 className="w-4 text-primaryColor" />
        </Button>
      }
      content={
        profileData && (
          <Formik<BasicFormValues>
            initialValues={{
              image: null,
              name: profileData.name,
              gender: profileData.gender,
              mobile: `+${profileData.country_code}${profileData.mobile}`,
              email: profileData.email,
              country_code: profileData.country_code,
              phone: profileData.mobile,
              action: 1,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              const formdata: any = new FormData();
              values.image && formdata.append("profile_image", values.image);
              profileData.name != values.name &&
                formdata.append("name", values.name);
              profileData.email != values.email &&
                formdata.append("email", values.email);
              formdata.append("gender", values.gender);
              if (
                profileData.country_code != values.country_code ||
                profileData.mobile != values.phone
              ) {
                formdata.append("country_code", values.country_code);
                formdata.append("mobile", values.phone);
              }
              formdata.append("_method", "put");

              try {
                const response: any = await fetcherClient(
                  `/customers/${profileData.id}`,
                  {
                    method: "POST",
                    body: formdata,
                    cache: "no-store",
                  }
                );
                showResponseToast(response);

                // Force router refresh to update the customer list
                router.refresh();

                // Close the dialog after successful update
                setOpen(false);
              } catch (error: any) {
                showResponseToast(error.info);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {(props) => (
              <Form className=" flex flex-col gap-5">
                <CustomFileImage
                  name="image"
                  formikProps={props}
                  imageType={EImageType.image}
                  value={profileData.profile_image}
                />
                <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CustomInput
                    type="text"
                    name="name"
                    label="الاسم بالكامل"
                    placeholder="أدخل الاسم الكامل"
                  />
                  <CustomSelect
                    name="gender"
                    title="الجنس"
                    placeholder="- اختر ـ"
                    formikProps={props}
                    options={[
                      { label: "ذكر", value: "male" },
                      { label: "انثى", value: "female" },
                    ]}
                    label="label"
                    value="value"
                    initialValue={profileData.gender}
                  />
                  <CustomPhoneNumber
                    name="mobile"
                    title="الجوال"
                    formikProps={props}
                  />
                  <CustomInput
                    type="email"
                    name="email"
                    label="البريد الالكتروني"
                    placeholder="أدخل البريد الإلكتروني"
                    optional
                  />
                </div>
                <Button type="submit" variant={"primary"} className="ms-auto">
                  حفظ
                </Button>
              </Form>
            )}
          </Formik>
        )
      }
    />
  );
};

export default Index;
