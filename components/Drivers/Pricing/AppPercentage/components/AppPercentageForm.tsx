import { Form, Formik } from "formik";
import { ReactNode } from "react";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { validationForAppPercentage } from "@/lib/types/validationTypes";

interface AppPercentageFormProps {
  initialValue: string | number;
  enableReinitialize: boolean;
  onSubmit: (
    values: any,
    setSubmitting: (isSubmitting: boolean) => void,
    setFieldValue: (field: string, value: any) => void
  ) => void;
  children?: ReactNode;
  formLayout?: "default" | "fontas";
}

/**
 * Reusable AppPercentage form component with Formik
 *
 * @param initialValue - Initial percentage value
 * @param enableReinitialize - Whether to reinitialize form when initialValue changes
 * @param onSubmit - Form submission handler
 * @param children - Optional children (e.g., checkboxes for fontas)
 * @param formLayout - Layout type: "default" for simple column, "fontas" for form + children side-by-side
 */
export const AppPercentageForm = ({
  initialValue,
  enableReinitialize,
  onSubmit,
  children,
  formLayout = "default",
}: AppPercentageFormProps) => {
  return (
    <Formik
      initialValues={{ percentage: initialValue || "" }}
      enableReinitialize={enableReinitialize}
      validationSchema={validationForAppPercentage}
      onSubmit={async (values, { setSubmitting, setFieldValue }) => {
        onSubmit(values, setSubmitting, setFieldValue);
      }}
    >
      {(props) => (
        <Form className="flex flex-col gap-5">
          {formLayout === "fontas" ? (
            <div className="flex items-start gap-16" dir="rtl">
              {/* Form section - Left side */}
              <div className="flex flex-col gap-5 w-full max-w-[308px]">
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
                  variant="primary"
                  disabled={props.isSubmitting}
                  className="max-w-[164px]"
                >
                  حفظ
                </Button>
              </div>

              {/* Children section - Right side (checkboxes for fontas) */}
              {children}
            </div>
          ) : (
            /* Default layout - Simple column */
            <div className="flex flex-col gap-5 max-w-[308px]">
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
                variant="primary"
                disabled={props.isSubmitting}
                className="max-w-[164px]"
              >
                حفظ
              </Button>
              {children}
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
};
