"use client";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";

const Index = ({ complaint_id }: { complaint_id: number }) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const apply = async () => {
    try {
      const response: any = await fetcherClient<any>(
        `/apply/disciplinaryAction/${complaint_id}`,
        {
          method: "POST",
        }
      );
      showResponseToast(response);
      router.push(`/ar/complaintsManagement/complaints/${complaint_id}`);
    } catch (error: any) {
      
      showResponseToast(error.info);
      router.push(`/ar/complaintsManagement/complaints/${complaint_id}`);
    }
  };
  return (
    <Button variant={"primary"} className=" px-8" onClick={apply}>
      إرسال للمراجعة
    </Button>
  );
};

export default Index;
