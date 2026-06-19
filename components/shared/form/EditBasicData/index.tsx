/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import { Button } from "@/components/ui/button";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import CustomFileImage, {
  EImageType,
} from "@/components/shared/form/CustomFileImage";
import CustomInput from "@/components/shared/form/CustomInput";
import CustomPhoneNumber from "@/components/shared/form/CustomPhoneNumber";
import dynamic from "next/dynamic";
import { Driver } from "@/lib/types/responseTypes";
import { useRouter } from "next/navigation";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
interface FormValues {
  image: File | null | string;
  name: string;
  gender: string;
  mobile: string;
  email: string;
  country_code: string;
  phone: string;
  action: number;
}
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
  setShowBasicData,
  profileData,
  onClose,
}: {
  setShowBasicData: React.Dispatch<React.SetStateAction<boolean>>;
  profileData: Driver;
  onClose?: () => void;
}) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  return (
    <Formik<FormValues>
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
        profileData.name != values.name && formdata.append("name", values.name);
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
            `/drivers/${profileData.id}`,
            {
              method: "POST",
              body: formdata,
            }
          );
          showResponseToast(response);
          values.action === 2 && setShowBasicData(false);
          router.refresh();
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
              placeholder="4oD2n@example.com"
              optional
            />
          </div>
          <div className=" flex justify-between gap-5">
            <Button
              type="submit"
              variant={"primary"}
              className="me-auto"
              disabled={props.isSubmitting}
              onClick={() => props.setFieldValue("action", 1)}
            >
              حفظ
            </Button>
            <Button
              type="submit"
              variant={"primary"}
              disabled={props.isSubmitting}
              onClick={() => props.setFieldValue("action", 2)}
            >
              حفظ واستكمال الييانات
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Index;
