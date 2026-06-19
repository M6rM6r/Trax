"use client";
import { Button } from "@/components/ui/button";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Add } from "@/public/SVG";
import { Form, Formik } from "formik";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import MapComponent from "@/components/shared/MapComponent";
import CustomInput from "@/components/shared/form/CustomInput";

const Index = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showResponseToast } = useResponseToast();

  return (
    <CustomDialog
      title="اضافه مسطح"
      color={Colors.primary}
      trigger={
        <Button variant="primary" size="lg">
          اضافه مسطح
          <Add className="w-6 text-white" />
        </Button>
      }
      content={
        <Formik
          initialValues={{
            name_ar: "",
            name_en: "",
            coordinates: "",
            neighborhood: searchParams.get("zone_id"),
          }}
          onSubmit={async (values, { setSubmitting }) => {
            const formdata: any = new FormData();
            formdata.append("name_ar", values.name_ar);
            formdata.append("name_en", values.name_en);
            formdata.append("coordinates", values.coordinates);
            formdata.append("neighborhood", values.neighborhood);

            try {
              const response: any = await fetcherClient("/surfaceWithPoints", {
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
            <Form className=" flex flex-col gap-5">
              <CustomInput
                type="text"
                name="name_ar"
                label="اسم المسطح بالعربية"
                placeholder="اسم المسطح بالعربية"
              />
              <CustomInput
                type="text"
                name="name_en"
                label="اسم المسطح بالانجليزية"
                placeholder="اسم المسطح بالانجليزية"
              />
              <MapComponent name="coordinates" formikProps={props} />
              <Button
                type="submit"
                variant="primary"
                className="w-fit px-8 mt-12"
                disabled={props.isSubmitting}
              >
                حفظ
              </Button>
            </Form>
          )}
        </Formik>
      }
    />
  );
};

export default Index;
