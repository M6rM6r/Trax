"use client";
import { Button } from "@/components/ui/button";
import { Formik, Form, isString } from "formik";
import { Trash } from "@/public/SVG";
import { useEffect, useState } from "react";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import CustomFileImage, {
  EImageType,
} from "@/components/shared/form/CustomFileImage";
import CustomInput from "@/components/shared/form/CustomInput";
import { FuelsToolsResponse } from "@/lib/types/responseTypes";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { validationForFuelTool } from "@/lib/types/validationTypes";
import { normalizeFile } from "@/lib/utils";

type Props = {
  serviceName: string;
};

// Generate unique ID using timestamp and random number
const generateUniqueId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

const Index: React.FC<Props> = ({ serviceName }) => {
  const [items, setItems] = useState<
    {
      id: number;
      title_ar: string;
      title_en: string;
      description_ar: string;
      description_en: string;
      image: string;
      created_at: string;
      update?: boolean;
    }[]
  >([]);
  const { showResponseToast } = useResponseToast();
  const [loading, setLoading] = useState(true);

  // Function to handle adding a new tool
  const handleAddItem = () => {
    setItems((prevItems) => [
      {
        id: generateUniqueId(), // Use unique ID instead of array length
        title_ar: "",
        title_en: "",
        description_en: "",
        description_ar: "",
        image: "",
        created_at: new Date().toISOString(),
        update: true,
      },
      ...prevItems,
    ]);
  };

  const fetchTools = async () => {
    try {
      const response = await fetcherClient<FuelsToolsResponse>(
        `/services/${serviceName}/tools`
      );
      setItems(response.data.records);
    } catch (error: any) {
      showResponseToast(error.info);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [serviceName]);

  // Remove item from local state (for new items that haven't been saved to server)
  const removeLocalItem = (id: number) => {
    setItems((prev) => prev.filter((prevItem) => prevItem.id !== id));
  };

  return (
    <>
      {!loading ? (
        <div className="border border-gray200 rounded-6 p-5">
          <div className="flex items-center justify-between gap-5">
            <p className="text-20 text-textMain font-[700]">
              الأدوات المطلوبة لخدمة الإطارات{" "}
              <span className="text-textSubTextDarker">
                ({items.length} أداة)
              </span>
            </p>
            <Button type="button" variant={"primary"} onClick={handleAddItem}>
              أضف أداة
            </Button>
          </div>
          {items.map((item) => (
            <div
              key={item.id} // Use the unique ID as key
              className="border border-gray200 rounded-6 p-5 mt-5"
            >
              <Formik
                initialValues={item}
                validationSchema={validationForFuelTool}
                onSubmit={async (values, { setSubmitting }) => {
                  const formdata = new FormData();
                  // FIX: only append if it is a File
                  if ((values.image as any) instanceof File) {
                    formdata.append("image", values.image);
                  } else {
                    const normalizedImage = await normalizeFile(
                      values.image,
                      "tool_image.jpg"
                    );
                    formdata.append("image", normalizedImage as File);
                  }

                  formdata.append("title_ar", values.title_ar);
                  formdata.append("title_en", values.title_en);
                  formdata.append("description_ar", values.description_ar);
                  formdata.append("description_en", values.description_en);
                  // image && formdata.append("image", image);

                  if (!values.update) {
                    try {
                      const response = await fetcherClient<any>(
                        `/services/${serviceName}/tools/${values.id}`,
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
                      fetchTools();
                    }
                  } else {
                    // Create new item - normalized image already appended above
                    try {
                      const response = await fetcherClient<any>(
                        `/services/${serviceName}/tools`,
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
                      fetchTools();
                    }
                  }
                }}
              >
                {(props) => (
                  <Form>
                    <div className="flex items-center justify-between flex-wrap-reverse gap-5">
                      <CustomFileImage
                        name="image"
                        formikProps={props}
                        imageType={EImageType.image}
                        value={props.values.image}
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          variant={"primaryLight"}
                          disabled={props.isSubmitting}
                        >
                          {!item.update ? "تعديل" : "حفظ"}
                        </Button>
                        {item.update ? (
                          <Button
                            type="button"
                            variant={"dangerLight"}
                            className="flex items-center gap-3"
                            onClick={() => removeLocalItem(item.id)}
                          >
                            حذف الأداة
                            <Trash className="w-5 text-accentDanger" />
                          </Button>
                        ) : (
                          <DeleteDialog
                            trigger={
                              <Button
                                type="button"
                                variant={"dangerLight"}
                                className="flex items-center gap-3"
                              >
                                حذف الأداة
                                <Trash className="w-5 text-accentDanger" />
                              </Button>
                            }
                            id={item.id}
                            url={`services/${serviceName}/tools`}
                            title="هل أنت متأكد من حذف الأداة؟"
                            description="سيتم إزالة هذه الأداة من الأدوات الخاصة بالخدمة ، ولن تتمكن من استخدامها في الطلبات الجديدة."
                            callBack={fetchTools}
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <CustomInput
                        type="text"
                        name="title_ar"
                        label="الاسم بالعربية"
                        placeholder="الاسم بالعربية"
                      />
                      <CustomInput
                        type="text"
                        name="title_en"
                        label="الاسم بالانجليزية"
                        placeholder="الاسم بالانجليزية"
                      />
                      <CustomInput
                        type="text"
                        name="description_ar"
                        label="وصف بالعربية"
                        placeholder="وصف بالعربية"
                        as="textarea"
                        className="min-h-[100px]"
                      />
                      <CustomInput
                        type="text"
                        name="description_en"
                        label="وصف بالانجليزية"
                        placeholder="وصف بالانجليزية"
                        as="textarea"
                        className="min-h-[100px]"
                      />
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          ))}
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </>
  );
};

// Set display name to satisfy eslint "react/display-name" when tools
// are wrapped by HOCs or inspected by devtools.
Index.displayName = "Tools";

export default Index;
