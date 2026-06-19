"use client";
import { ArrowLeft } from "@/public/SVG";
import { useRouter } from "next/navigation";

const Index = () => {
  const router = useRouter();
  const handleClick = () => router.back();
  return (
    <button
      type="button"
      onClick={handleClick}
      className=" flex items-center gap-2 w-fit"
    >
      <ArrowLeft className="w-5 text-textSubText rotate-180" />
      <p className="text-16 text-textSubText">رجوع للصفحة السابقة</p>
    </button>
  );
};

export default Index;
