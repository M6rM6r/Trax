"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Flash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { useFetchEnums } from "@/hooks/useAllEnums";
import { Checkbox } from "@/components/ui/checkbox";
import { useFetchModelName } from "@/hooks/useFetchDDLModel";
import { validationForType } from "@/lib/types/validationTypes";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import { convertDateFormat } from "@/lib/helperFunctions";

const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = ({ params }: { params: { id: string } }) => {
  const { showResponseToast } = useResponseToast();
  const { data: dataEnums } = useFetchEnums();
  const { data: teams } = useFetchModelName<any>("Team");
  const { data: actions } = useFetchModelName<any>("DisciplinaryAction");
  const router = useRouter();

  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Complaints className="w-5 text-iconColor" />,
            label: "إدارة الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "إدارة تصنيفات الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "أنواع الشكوى المرتبطة بالتصنيف",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "أضف نوع",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        title_ar: string;
        title_en: string;
        parent_id: string;
        description_ar: string;
        description_en: string;
        attachments_types: string[];
        services: string[];
        app: string[];
        team_id: string;
        time: string;
        disciplinary_actions: string[];
        ride_related: number;
        is_active: string;
      }>
        initialValues={{
          title_ar: "",
          title_en: "",
          parent_id: params.id,
          description_ar: "",
          description_en: "",
          attachments_types: [],
          services: [],
          app: [],
          team_id: "",
          time: "",
          disciplinary_actions: [],
          ride_related: 0,
          is_active: "",
        }}
        validationSchema={validationForType}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata: any = new FormData();
          formdata.append("title_ar", values.title_ar);
          formdata.append("title_en", values.title_en);
          formdata.append("parent_id", values.parent_id);
          formdata.append("description_ar", values.description_ar);
          formdata.append("description_en", values.description_en);
          values.attachments_types.map((item: any) => {
            formdata.append("attachments_types[]", item);
          });
          values.services.map((item: any) => {
            formdata.append("services[]", item);
          });
          values.app.map((item: any) => {
            formdata.append("app[]", item);
          });
          formdata.append("team_id", values.team_id);
          values.disciplinary_actions.map((item: any) => {
            formdata.append("disciplinary_actions[]", item);
          });
          formdata.append("team", values.time);
          formdata.append("ride_related", Number(values.ride_related));
          formdata.append("is_active", values.is_active.toString());
          try {
            const response = await fetcherClient<any>("/complaintCategory", {
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
              <h2 className="text-20 text-textMain font-[700]">أضف نوع</h2>
              <Button
                variant={"primary"}
                type="submit"
                disabled={props.isSubmitting}
              >
                أضف نوع
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل النوع</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <RichTextEditor
                  label="الوصف بالعربية"
                  name="description_ar"
                  formikProps={props}
                />
                <RichTextEditor
                  label="الوصف بالإنجليزية"
                  name="description_en"
                  formikProps={props}
                />
                <CustomSelect
                  name="attachments_types"
                  title="المرفقات"
                  placeholder="- اختر ـ"
                  options={
                    dataEnums.attachmentTypes
                      ? Object.entries(dataEnums?.attachmentTypes?.ar).map(
                          ([key, value]) => ({
                            label: value,
                            value: key,
                          })
                        )
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                  isMultiple
                />
                <CustomSelect
                  name="services"
                  title="نوع الخدمة"
                  placeholder="- اختر ـ"
                  options={
                    dataEnums.ServiceTypes
                      ? Object.entries(dataEnums?.ServiceTypes?.ar).map(
                          ([key, value]) => ({
                            label: value,
                            value: key,
                          })
                        )
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                  isMultiple
                />
                <CustomSelect
                  name="app"
                  title="نوع التطبيق"
                  placeholder="- اختر ـ"
                  options={
                    dataEnums.ComplaintAppTypes
                      ? Object.entries(dataEnums?.ComplaintAppTypes?.ar).map(
                          ([key, value]) => ({
                            label: value,
                            value: key,
                          })
                        )
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                  isMultiple
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
                />
                <CustomSelect
                  name="team_id"
                  title="الفريق المسؤول"
                  placeholder="- اختر ـ"
                  options={
                    teams
                      ? teams?.data.records.map((team: any) => ({
                          label: team.title_ar,
                          value: team.id,
                        }))
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                  className="md:col-span-2"
                />
                <div className="flex items-center gap-3">
                  <Checkbox
                    value={props.values.ride_related}
                    checked={props.values.ride_related == 1}
                    onCheckedChange={() => {
                      props.setFieldValue(
                        "ride_related",
                        !props.values.ride_related
                      );
                    }}
                  />
                  <label className="text-14 text-textMain font-[600]">
                    الشكوى مرتبطة برحلة
                  </label>
                </div>
                <CustomSelect
                  name="time"
                  title="توقيت ظهور الشكوى"
                  placeholder="- اختر ـ"
                  options={[
                    { value: "during_trip", label: "أثناء الرحلة" },
                    { value: "after_trip", label: "بعد إنتهاء الرحلة" },
                    { value: "before_trip", label: "قبل إنتهاء الرحلة" },
                  ]}
                  formikProps={props}
                  label="label"
                  value="value"
                  initialValue=" الرحلة أثناء"
                  className="md:col-span-2"
                />
                <CustomSelect
                  name="disciplinary_actions"
                  title="اختر اجراء"
                  placeholder="- اختر ـ"
                  options={
                    actions
                      ? actions?.data.records.map((action: any) => ({
                          label: action.name_ar,
                          value: action.id,
                        }))
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                  isMultiple
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
