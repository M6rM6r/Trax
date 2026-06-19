"use client";
import { Button } from "@/components/ui/button";
import CustomDialog, { Colors } from "../CustomDialog";
import { Formik, FieldArray } from "formik";
import dynamic from "next/dynamic";
import CustomInput from "../form/CustomInput";
import { TrashFill } from "@/public/SVG";
import { DialogClose } from "@/components/ui/dialog";
import {
  FuelsToolsRecord,
  FuelsToolsResponse,
} from "@/lib/types/responseTypes";
import { useEffect, useState } from "react";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Index = ({ id, serviceName }: { id: string; serviceName?: string }) => {
  const [data, setData] = useState<FuelsToolsRecord[]>();
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetcherClient<FuelsToolsResponse>(
          `/services/${serviceName}/tools`
        );
        setData(response.data.records);
      } catch (error: any) {
        showResponseToast(error.info);
      }
    };
    fetchTools();
  }, []);

  return (
    <CustomDialog
      trigger={<Button variant={"dangerLight"}>رفض الطلب</Button>}
      content={
        <Formik
          initialValues={{
            tools: [
              {
                tool: "",
                reason: "",
              },
            ],
          }}
          onSubmit={async (values, { setSubmitting }) => {
            const formdata = new FormData();
            formdata.append("status", "rejected");
            values.tools.forEach((item, index) => {
              formdata.append(`tools[${index}][id]`, item.tool);
              formdata.append(`tools[${index}][rejection_reason]`, item.reason);
            });
            try {
              const response = await fetcherClient<any>(
                `/services/${serviceName}/orders/${id}`,
                {
                  body: formdata,
                  method: "POST",
                }
              );
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
            <div className="space-y-4">
              <FieldArray
                name="tools"
                render={({ push, remove }) => {
                  // Get all currently selected tool IDs except empty ones
                  const selectedToolIds = props.values.tools
                    .map((tool) => tool.tool)
                    .filter((id) => id !== "");

                  return (
                    <div>
                      {props.values.tools.map((item, index) => {
                        // Filter options for this specific select field
                        const filteredOptions = data
                          ? data
                              .filter((tool: any) => {
                                // If this is the current field's selected value, include it
                                if (tool.id === item.tool) return true;
                                // Otherwise, only include if it's not selected in any other field
                                return !selectedToolIds.includes(tool.id);
                              })
                              .map((tool) => ({
                                value: tool.id,
                                label: tool.title_ar,
                              }))
                          : [];

                        return (
                          <div key={index} className="flex flex-col gap-4 mb-4">
                            <div className="relative">
                              <CustomSelect
                                name={`tools.${index}.tool`}
                                title="اختر الأداة"
                                placeholder="اختر الأداة"
                                formikProps={props}
                                options={filteredOptions}
                                label="label"
                                value="value"
                              />
                              {index > 0 && props.values.tools.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="absolute top-0 end-0"
                                >
                                  <TrashFill className="w-5" />
                                </button>
                              )}
                            </div>
                            <CustomInput
                              name={`tools.${index}.reason`}
                              type={"text"}
                              placeholder={"سبب الرفض"}
                              label={"سبب الرفض"}
                              as="textarea"
                              className="min-h-[100px]"
                            />
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          // Only allow adding new field if there are available tools
                          const availableTools = data?.filter(
                            (tool: any) => !selectedToolIds.includes(tool.id)
                          );
                          if (availableTools && availableTools.length > 0) {
                            push({ tool: "", reason: "" });
                          } else {
                            // Show message or prevent adding
                            alert("لا توجد أدوات متاحة لإضافتها");
                          }
                        }}
                        className="text-18 text-primaryColor font-[600]"
                      >
                        اضافة أداة اخري
                      </button>
                    </div>
                  );
                }}
              />
              <div className=" w-full flex items-center justify-between gap-5">
                <Button
                  type="submit"
                  variant={"error"}
                  className="px-8"
                  onClick={() => props.submitForm()}
                  disabled={props.isSubmitting}
                >
                  تأكيد الرفض
                </Button>
                <DialogClose asChild>
                  <Button variant={"dangerLight"} className="px-8">
                    عودة
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </Formik>
      }
      color={Colors.error}
      title={"رفض الطلب"}
    />
  );
};

export default Index;
