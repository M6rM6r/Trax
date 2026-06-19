"use client";
import AvatarWithRating from "@/components/shared/AvatarWithRating";
import CustomInput from "@/components/shared/form/CustomInput";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { ComplaintResponse } from "@/lib/types/responseTypes";
import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";

const Index = ({ data }: { data: ComplaintResponse }) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  return (
    <Formik
      initialValues={{
        driver_id:
          data.data.complaint?.against?.key === "driver"
            ? data.data.complaint?.against?.id
            : data.data.complaint?.complainant?.id,
        driver_title: "",
        driver_body: "",
        customer_id:
          data.data.complaint?.against?.key === "customer"
            ? data.data.complaint?.against?.id
            : data.data.complaint?.complainant?.id,
        customer_title: "",
        customer_body: "",
      }}
      onSubmit={async (values) => {
        
        
        const formdata: any = new FormData();
        formdata.append("driver[id]", values.driver_id);
        formdata.append("driver[title]", values.driver_title);
        formdata.append("driver[body]", values.driver_body);
        formdata.append("customer[id]", values.customer_id);
        formdata.append("customer[title]", values.customer_title);
        formdata.append("customer[body]", values.customer_body);
        try {
          const response: any = await fetcherClient<any>(
            `/sendNotification/${data.data.complaint?.id}`,
            {
              method: "POST",
              body: formdata,
            }
          );
          showResponseToast(response);
          router.push(
            `/ar/complaintsManagement/complaints/${data.data.complaint?.id}`
          );
        } catch (error: any) {
          
          showResponseToast(error.info);
        }
      }}
    >
      {() => (
        <Form id="notifications">
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-gray200 rounded-6 p-4 flex flex-col gap-5">
              <div className=" flex flex-col gap-4">
                <p className="text-18 text-textMain font-[600]">
                  الطرف مقدم الشكوى
                </p>
                <AvatarWithRating
                  image={data.data.complaint?.complainant?.image}
                  name={data.data.complaint?.complainant?.name}
                  rating={data.data.complaint?.complainant?.rating}
                  gender={`${data.data.complaint?.complainant?.type}`}
                />
                <CustomInput
                  name="driver_title"
                  type="text"
                  label="عنوان الإشعار"
                  placeholder="عنوان الإشعار"
                />
                <CustomInput
                  name="driver_body"
                  type="text"
                  label="نص الإشعار"
                  placeholder="نص الإشعار"
                  as="textarea"
                />
              </div>
            </div>
            <div className="border border-gray200 rounded-6 p-4 flex flex-col gap-5">
              <div className=" flex flex-col gap-4">
                <p className="text-18 text-textMain font-[600]">
                  الطرف المقدم ضده الشكوى
                </p>
                <AvatarWithRating
                  image={data.data.complaint?.against?.image}
                  name={data.data.complaint?.against?.name}
                  rating={data.data.complaint?.against?.rating}
                  gender={`${data.data.complaint?.against?.type}`}
                />
                <CustomInput
                  name="customer_title"
                  type="text"
                  label="عنوان الإشعار"
                  placeholder="عنوان الإشعار"
                />
                <CustomInput
                  name="customer_body"
                  type="text"
                  label="نص الإشعار"
                  placeholder="نص الإشعار"
                  as="textarea"
                />
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Index;
