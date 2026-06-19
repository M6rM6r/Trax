"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { Form, Formik } from "formik";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Index = ({
  category_id,
  complaint_id,
  customerable_type,
  customerable_id,
}: {
  category_id: number;
  complaint_id: number;
  customerable_type: string;
  customerable_id: number;
}) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const [actions, setActions] = useState([]);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await fetcherClient<any>(
          `/complaintCategory/${category_id}`
        );
        setActions(res?.data?.complaint_category?.displinaryActions);
      } catch (err) {}
    };
    fetchActions();
  }, [category_id]);
  return (
    <Formik
      initialValues={{
        disciplinary_action_id: "",
        amount: "",
        note: "",
        duration: "",
        reason: "",
      }}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        const formdata: any = new FormData();
        formdata.append("complaint_id", complaint_id);
        formdata.append("customerable_type", customerable_type);
        formdata.append("customerable_id", customerable_id);
        formdata.append(
          "disciplinary_action_id",
          values?.disciplinary_action_id
        );
        actions?.forEach((item: any) => {
          if (item?.id == values?.disciplinary_action_id) {
            formdata.append("procedure_type", item?.name_ar);
          }
        });
        formdata.append("note", values?.note);
        slug === "add-compensation-to-wallet" &&
          formdata.append("amount", values?.amount);
        try {
          const response: any = await fetcherClient<any>(`/complaintActions`, {
            method: "POST",
            body: formdata,
          });
          showResponseToast(response);
          setTimeout(() => {
            router.refresh();
          }, 500);
        } catch (error: any) {
          showResponseToast(error.info);
        } finally {
          setSubmitting(false);
          resetForm();
        }
      }}
    >
      {(props) => (
        <Form className=" grid grid-cols-1  gap-4">
          <CustomSelect
            name="disciplinary_action_id"
            title="الإجراء"
            options={actions?.map((item: any) => ({
              label: item?.name_ar,
              value: item?.id,
            }))}
            required={true}
            formikProps={props}
            label="label"
            value="value"
            placeholder="اختر الإجراء"
            callBack={async (selectedType) => {
              if (selectedType) {
                actions?.forEach((item: any) => {
                  if (item?.id == selectedType) {
                    setSlug(item?.slug);
                  }
                });
              }
            }}
          />
          {slug === "add-compensation-to-wallet" && (
            <CustomInput
              name="amount"
              type="number"
              placeholder="المبلغ المضاف"
              label="المبلغ المضاف"
              className="prevent-arrows"
              inputMode="numeric"
              preventLeadingZero
            />
          )}
          {slug === "suspend-withdrawals" && (
            <CustomInput
              name="amount"
              type="number"
              placeholder="  مدة التعليق ( يوم )"
              label="مدة التعليق"
              className="prevent-arrows"
              preventLeadingZero
            />
          )}
          {slug === "deduct-money-from-wallet" && (
            <CustomInput
              name="amount"
              type="number"
              placeholder="المبلغ المراد خصمه"
              label="المبلغ المراد خصمه"
              required={true}
              className="prevent-arrows"
              step="0.1"
              preventLeadingZero
            />
          )}
          {slug === "suspend-account" && (
            <CustomInput
              name="amount"
              type="number"
              placeholder="مدة التعليق"
              label="مدة التعليق"
              className="prevent-arrows"
              preventLeadingZero
            />
          )}
          {slug === "ban-account" && (
            <CustomSelect
              name="amount"
              placeholder="نوع الحظر"
              label="نوع الحظر"
              options={[]}
              formikProps={props}
              value="value"
              initialValue={""}
              className="prevent-arrows"
            />
          )}
          {slug === "add-warning" && (
            <CustomInput
              name="reason"
              type="text"
              placeholder="نص التحذير"
              label="نص التحذير"
              as="textarea"
            />
          )}
          {slug === "mark-for-legal-action" && (
            <CustomInput
              name="reason"
              type="text"
              placeholder="السبب القانوني "
              optional={false}
              required={true}
              label="السبب القانوني "
              as="textarea"
            />
          )}
          <CustomInput
            name={"note"}
            type={"text"}
            placeholder={"وجهة النظر فى الإجراء"}
            optional={false}
            required={true}
            label={"وجهة النظر فى الإجراء"}
            as="textarea"
          />
          <Button
            type="submit"
            variant={"primaryLight"}
            disabled={props.isSubmitting}
            className="w-fit px-10 ms-auto"
          >
            أضف الإجراء
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default Index;
