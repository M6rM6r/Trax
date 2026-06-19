"use client";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";

const Index = ({ orderId }: { orderId: string }) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  return (
    <Button
      variant={"success"}
      onClick={async () => {
        const formdata = new FormData();
        formdata.append("status", "active");
        try {
          const response = await fetcherClient<any>(
            `/services/fuel/orders/${orderId}`,
            {
              body: formdata,
              method: "POST",
            }
          );
         
          showResponseToast(response);
          router.refresh();
        } catch (error: any) {
          
          showResponseToast(error.info);
        }
      }}
    >
      قبول الطلب
    </Button>
  );
};

export default Index;
