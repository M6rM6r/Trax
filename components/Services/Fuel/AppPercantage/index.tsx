"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { Form, Formik } from "formik";
import { useSearchParams } from "next/navigation";
import { validationForAppPercentage } from "@/lib/types/validationTypes";

const Index = ({
  app_percentage,
  type,
  serviceName,
}: {
  app_percentage: string | number;
  type: string;
  serviceName?: string;
}) => {
  const searchParams = useSearchParams();
  const { showResponseToast } = useResponseToast();
  return (
    <div className="flex flex-col gap-5">
      <Formik
        initialValues={{ percentage: app_percentage || "" }}
        validationSchema={validationForAppPercentage}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata: any = new FormData();
          formdata.append("app_percentage", values.percentage);
          formdata.append("type", serviceName);
          searchParams.get("zone_id") &&
            formdata.append("zone_id", searchParams.get("zone_id"));
          try {
            const response: any = await fetcherClient(
              `/${serviceName}/updateServiceSettings`,
              {
                method: "POST",
                body: formdata,
              }
            );
            showResponseToast(response);
          } catch (error: any) {
            showResponseToast(error.info);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {(props) => (
          <Form className="flex flex-col gap-5 max-w-[308px]">
            <CustomInput
              type="number"
              name="percentage"
              label="نسبة التطبيق"
              placeholder="20%"
              labelStyle="text-20 text-textMain font-[700]"
              inputMode="numeric"
              step="0.1"
            />
            <Button
              type="submit"
              variant={"primary"}
              disabled={props.isSubmitting}
              className="max-w-[164px] "
            >
              حفظ
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Index;
