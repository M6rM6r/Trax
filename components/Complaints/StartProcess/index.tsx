"use client";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";

const Index = ({
  complaint_id,
  text,
  variant,
}: {
  complaint_id: number;
  text: string;
  variant: any;
}) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const handleProcess = async () => {
    const formdata = new FormData();
    formdata.append("status", "in_progress");
    formdata.append("_method", "put");
    try {
      const response = await fetcherClient<any>(`/complaints/${complaint_id}`, {
        method: "POST",
        body: formdata,
      });
     
      showResponseToast(response);
      router.refresh();
    } catch (error: any) {
      
      showResponseToast(error.info);
    }
  };
  return (
    <Button
      variant={variant}
      size="lg"
      className=" grow"
      onClick={handleProcess}
    >
      {text}
    </Button>
  );
};

export default Index;
