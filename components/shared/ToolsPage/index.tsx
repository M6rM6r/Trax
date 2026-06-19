"use client";
import { Button } from "@/components/ui/button";
import CustomDialog, { Colors } from "../CustomDialog";
import { Formik, Form } from "formik";
import dynamic from "next/dynamic";
import CustomInput from "../form/CustomInput";
import { DeleteAction, Trash } from "@/public/SVG";
import { DialogClose } from "@/components/ui/dialog";
import { useState } from "react";
import CustomFileImage, { EImageType } from "../form/CustomFileImage";
import DeleteDialog from "@/components/Authorization/DeleteDialog";

const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Index = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      image: "",
      name_ar: "",
      name_en: "",
      description_en: "",
      description_ar: "",
    },
  ]);

  // Function to handle adding a new tool
  const handleAddItem = () => {
    setItems((prevItems) => [
      ...prevItems,
      {
        id: prevItems.length + 1,
        image: "",
        name_ar: "",
        name_en: "",
        description_en: "",
        description_ar: "",
      },
    ]);
  };

  return (
    <div className="border border-gray200 rounded-6 p-5">
      <div className="flex items-center justify-between gap-5">
        <p className="text-20 text-textMain font-[700]">
          الأدوات المطلوبة لخدمة الإطارات{" "}
          <span className="text-textSubTextDarker">({items.length} أداة)</span>
        </p>
        <Button type="button" variant={"primary"} onClick={handleAddItem}>
          أضف أداة
        </Button>
      </div>
      {items.map((item) => (
        <div key={item.id} className="border border-gray200 rounded-6 p-5 mt-5">
          <Formik
            initialValues={item}
            onSubmit={(values) => {
            }}
          >
            {(props) => (
              <Form>
                <div className="flex items-center justify-between gap-5">
                  <CustomFileImage
                    name="image"
                    formikProps={props}
                    imageType={EImageType.image}
                  />
                  <div className="flex items-center gap-3">
                    <Button type="submit" variant={"primaryLight"}>
                      حفظ
                    </Button>
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
                      url=""
                      title="هل أنت متأكد من حذف الأداة؟"
                      description="سيتم إزالة هذه الأداة من الأدوات الخاصة بالخدمة ، ولن تتمكن من استخدامها في الطلبات الجديدة."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <CustomInput
                    type="text"
                    name="name_ar"
                    label="الاسم بالعربية"
                    placeholder="الاسم بالعربية"
                  />
                  <CustomInput
                    type="text"
                    name="name_en"
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
  );
};

export default Index;
