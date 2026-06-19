import MainLayout from "@/components/shared/MainLayout";

const Page = async () => {
  return (
    <MainLayout>
      <div className=" flex items-center justify-center  min-h-[calc(100vh-200px)]">
        <p className="text-32 text-textMain font-[600]">جاري التنفيذ</p>
      </div>
    </MainLayout>
  );
};

export default Page;
