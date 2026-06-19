import { Logo, Notification, Online, Search } from "@/public/SVG";
import user from "@/public/images/user.png";
import Image from "next/image";

const Index = () => {
  return (
    <header className=" flex items-center justify-between gap-10 p-5 border-b border-b-gray-200 relative">
      <Logo />
      <div className=" flex items-center gap-3">
        <Image src={user} alt="user" />
        <div>
          <p className="text-20 text-black font-[600]">محمد الشريف</p>
          <p className="text-16 text-gray500">مشرف رئيسي</p>
        </div>
      </div>
      <div className=" flex items-center gap-2">
        <Online />
        <span className="text-24 text-primaryColor font-[600]">السائقين</span>
      </div>
      <div className="grow bg-gray-50 border border-gray300 rounded-12 h-[59px] flex items-center px-3">
        <Search />
        <input
          type="text"
          className="w-full h-full px-3 outline-none "
          placeholder="بحث"
        />
      </div>
      <div className=" relative">
        <span className="w-[12px] h-[12px] bg-error rounded-full border border-white absolute top-0 right-0"></span>
        <Notification />
      </div>
    </header>
  );
};

export default Index;
