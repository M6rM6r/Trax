import { Switch } from "@/components/ui/switch";

interface PaymentMethod {
  id: number;
  title: string;
  title_key: string;
  value: boolean;
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  values: any;
  setFieldValue: (field: string, value: any) => void;
}

const PaymentMethods = ({
  paymentMethods,
  values,
  setFieldValue,
}: PaymentMethodsProps) => {
  return (
    <div className="p-5 border border-gray200 rounded-6">
      <h3 className="text-20 text-textMain font-[700] mb-5">
        وسائل الدفع
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
        {paymentMethods.map((method) => (
          <div key={method.id} className="flex items-center gap-5">
            <Switch
              checked={values[method.title_key]}
              onCheckedChange={(value) => {
                setFieldValue(method.title_key, value);
              }}
            />
            <div className="flex items-center gap-2">
              <p className="text-16 text-textMain font-[600]">
                {method.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
