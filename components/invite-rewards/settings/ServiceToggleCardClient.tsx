"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { Formik, Form } from "formik";
import { fetcherClient } from "@/lib/fetcherClient";
import { toast } from "@/hooks/use-toast";

type Props = {
  isActiveFromServer: boolean;
  initialValuesFromServer: any;
};

export default function ServiceToggleCardClient({
  isActiveFromServer,
  initialValuesFromServer,
}: Props) {
  const [isActive, setIsActive] = useState(isActiveFromServer);

  const handleSubmit = async (values: typeof initialValuesFromServer) => {
    const changes: { key: string; value: number | string }[] = [];

    if (isActive !== isActiveFromServer) {
      changes.push({ key: "enabled", value: isActive ? 1 : 0 });
    }

    const mapping: Record<string, string> = {
      inviter_driver_reward: "driver_referrer_reward",
      inviter_rider_reward: "customer_referrer_reward",
      invitee_driver_reward: "driver_referee_reward",
      invitee_rider_reward: "customer_referee_reward",
      inviter_driver_trips: "driver_referrer_required_rides",
      inviter_rider_trips: "customer_referrer_required_rides",
      invitee_driver_trips: "driver_referee_required_rides",
      invitee_rider_trips: "customer_referee_required_rides",
    };

    Object.entries(mapping).forEach(([formKey, apiKey]) => {
      if (values[formKey] !== initialValuesFromServer[formKey]) {
        changes.push({ key: apiKey, value: Number(values[formKey]) });
      }
    });

    if (changes.length === 0) {
      toast({
        description: "لا يوجد أي تغيير لحفظه",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      changes.forEach((item, index) => {
        formData.append(`setting[${index}][key]`, item.key);
        formData.append(`setting[${index}][value]`, String(item.value));
      });

      await fetcherClient(`/referralSettings`, {
        method: "POST",
        body: formData,
      });

      toast({
        description: "تم حفظ التغييرات بنجاح ",
        variant: "default",
      });
    } catch (err) {
      toast({
        description: "حدث خطأ ما ",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {" "}
      <div className="p-7 border border-gray200 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <Switch checked={isActive} onCheckedChange={(v) => setIsActive(v)} />
          <p className="text-[30px] text-textMain font-semibold">
             برنامج ال Referral
          </p>
        </div>
      </div>
      <div className="p-5 border border-gray200 rounded-2xl mt-6">
        <h3 className="text-20 text-textMain font-[700] mb-5">الإعدادات </h3>

        <Formik
          enableReinitialize
          initialValues={initialValuesFromServer}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <CustomInput
                  type="number"
                  name="inviter_driver_reward"
                  label="مكافئة الداعى (سائق)"
                  placeholder="0"
                  step="1"
                />
                <CustomInput
                  type="number"
                  name="inviter_rider_reward"
                  label="مكافئة الداعى (راكب)"
                  placeholder="0"
                  step="1"
                />
                <CustomInput
                  type="number"
                  name="invitee_driver_reward"
                  label="مكآفأة المدعو (سائق)"
                  placeholder="0"
                  step="1"
                />
                <CustomInput
                  type="number"
                  name="invitee_rider_reward"
                  label="مكآفأة المدعو (راكب)"
                  placeholder="0"
                  step="1"
                />
                <CustomInput
                  type="number"
                  name="inviter_driver_trips"
                  label="عدد الرحلات المطلوب الداعى (سائق)"
                  placeholder="0"
                  step="1"
                />
                <CustomInput
                  type="number"
                  name="inviter_rider_trips"
                  label="عدد الرحلات المطلوب الداعى (راكب)"
                  placeholder="0"
                  step="1"
                />
                <CustomInput
                  type="number"
                  name="invitee_driver_trips"
                  label="عدد الرحلات المطلوب المدعو (سائق)"
                  placeholder="0"
                  step="1"
                />
                <CustomInput
                  type="number"
                  name="invitee_rider_trips"
                  label="عدد الرحلات المطلوب المدعو (راكب)"
                  placeholder="0"
                  step="1"
                />
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  className="max-w-[160px]"
                >
                  حفظ
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
}
