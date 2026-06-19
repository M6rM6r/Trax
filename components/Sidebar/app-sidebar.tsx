"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { useMainNavItems } from "./nav-main-items";
import { usePathname } from "next/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const mainNavItems = useMainNavItems({ pathname });
  const sidebar = useSidebar();
  return (
    <Sidebar
      side="right"
      variant="inset"
      {...props}
      className=" bg-colorTextDark"
      collapsible="icon"
    >
      <SidebarHeader
        className={` bg-colorTextDark text-white flex ${
          sidebar.state === "collapsed" ? "flex-col" : "flex-row-reverse"
        }  gap-5 items-center justify-between`}
      >
        <SidebarTrigger className="hover:bg-transparent text-white hover:text-white" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className=" hover:bg-transparent focus:bg-transparent "
            >
              {/* <div className="  flex items-center gap-3 justify-center">
                {isCoursesPage ||
                  (isStorDetailsePage && (
                    <ArrowRight
                      className="!w-[20px] !h-[20px] cursor-pointer"
                      onClick={handleBack}
                    />
                  ))}
                <Logo
                  className={`!w-[33px] !h-[33px] ${
                    sidebar.state === "collapsed" ? "block" : "hidden"
                  }`}
                />
                <LogoWithName
                  width={144}
                  className={`!w-[144px] !h-[33px] ${
                    sidebar.state === "collapsed" ? "hidden" : "block"
                  }`}
                />
              </div> */}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className=" bg-colorTextDark text-white pt-5 hideScrollbar">
        <NavMain items={mainNavItems?.navMain} />
      </SidebarContent>
      {/* <SidebarFooter
        className={` bg-colorTextDark text-white ${
          sidebar.state === "collapsed" && "hidden"
        }`}
      >
        <button className="h-[44px] bg-[#3F3F74] rounded-[12px] flex items-center justify-center gap-5 text-14 text-white font-[500]">
          اضافة جديد <AddCircle className="w-[20px]" />
        </button>
        <Platform />
        <UserInfo />
        <ThemeTabs />
      </SidebarFooter> */}
    </Sidebar>
  );
}
