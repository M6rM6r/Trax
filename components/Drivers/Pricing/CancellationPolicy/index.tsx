"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { Form, Formik } from "formik";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import * as Yup from "yup";

const validationSchema = Yup.object({
  waiting_cost: Yup.number().required("مطلوب").min(0, "يجب أن يكون 0 أو أكثر"),
  cancellation_cost: Yup.number().required("مطلوب").min(0, "يجب أن يكون 0 أو أكثر"),
});

interface CancellationPolicyProps {
  waiting_cost: string | number;
  cancellation_cost: string | number;
  type: string;
}

const Index = ({
  waiting_cost,
  cancellation_cost,
  type,
}: CancellationPolicyProps) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showResponseToast } = useResponseToast();

  return (
    <div className="p-5 border border-gray200 rounded-6">
      <h3 className="text-20 text-textMain font-[700] mb-5">
        سياسة الإلغاء
      </h3>
      <Formik
        initialValues={{
          waiting_cost: waiting_cost,
          cancellation_cost: cancellation_cost,
        }}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata = new FormData();

          // Add service type
          formdata.append("type", type);

          // Add subtype if exists
          if (searchParams.get("subtype")) {
            formdata.append("subtype", searchParams.get("subtype")!);
          }

          // Add zone_id if exists (this is the source zone)
          if (searchParams.get("zone_id")) {
            formdata.append("zone_id", searchParams.get("zone_id")!);
            // Add zone_ids[] array with the current zone to apply settings to it
            formdata.append("zone_ids[]", searchParams.get("zone_id")!);
          }

          // Add tab parameter
          formdata.append(
            "tab",
            searchParams.get("tab") ? searchParams.get("tab")! : "region"
          );

          // Add cancellation policy values
          formdata.append("waiting_cost", values.waiting_cost.toString());
          formdata.append("cancellation_cost", values.cancellation_cost.toString());

          try {
            const response: any = await fetcherClient("/updateServiceSettings", {
              method: "POST",
              body: formdata,
            });

            showResponseToast(response);

            if (response.status === "success") {
              // Refresh the page to fetch updated data
              router.refresh();
            }
          } catch (error: any) {
            showResponseToast(error.info);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {(props) => (
          <Form>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              <CustomInput
                type="number"
                name="waiting_cost"
                label="تكلفة الانتظار (ريال)"
                placeholder="0"
                step="0.1"
              />
              <CustomInput
                type="number"
                name="cancellation_cost"
                label="تكلفة الإلغاء (ريال)"
                placeholder="0"
                step="0.1"
              />
              <Button
                type="submit"
                variant="primary"
                className="col-span-full max-w-[160px]"
                disabled={props.isSubmitting}
              >
                {props.isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Index;
