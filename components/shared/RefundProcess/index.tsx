import { Form, Formik } from "formik";
import CustomDialog, { Colors } from "../CustomDialog";
import CustomInput from "../form/CustomInput";
import CustomFile from "../form/CustomFile";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";

const Index = () => {
  return (
    <CustomDialog
      title="عملية استرجاع المبلغ"
      color={Colors.primary}
      trigger={
        <button className="text-16 text-primaryColor font-[600]">
          استرجاع{" "}
        </button>
      }
      content={
        <Formik
          initialValues={{ refund: "", file: "", note: "" }}
          onSubmit={(values) => {
            
          }}
        >
          {(props) => (
            <Form className=" flex flex-col gap-5">
              <p className="text-18 text-textSubText font-[600]">
                الرصيد الأصلى :
                <span className="text-primaryColor font-[700]"> 1000 ر.س </span>
              </p>
              <CustomInput
                type="number"
                name="refund"
                label="مبلغ الإسترجاع"
                placeholder="200 ر.س"
              />
              <CustomFile name="file" label="ارفع ملف" formikProps={props} />
              <CustomInput
                type="text"
                name="note"
                label="اضف ملاحظة"
                placeholder="الملاحظة"
                as="textarea"
                className="min-h-[100px] p-2"
              />
              <div className=" flex justify-between gap-5">
                <Button
                  type="submit"
                  variant={"primary"}
                  className="me-auto px-10"
                >
                  تأكيد استرجاع المبلغ
                </Button>
                <DialogClose asChild>
                  <Button
                    type="submit"
                    variant={"primaryLight"}
                    className="px-10"
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </Form>
          )}
        </Formik>
      }
    />
  );
};

export default Index;
