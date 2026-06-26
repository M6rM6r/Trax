"use client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Flash, Line } from "@/public/SVG";
import Link from "next/link";
import React, { useState } from "react";

interface SubItem {
  title: string;
  url: string;
  active?: boolean;
  items?: SubItem[];
}

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: React.ElementType;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      active?: boolean;
      items?: SubItem[];
    }[];
  }[];
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    items.reduce(
      (acc, item) => {
        acc[item.title] = item.isActive ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    )
  );

  // Track open state for sub-items (nested items)
  // Initialize open state for subItems which contain an active descendant so
  // deep links preserve the expanded state.
  const [openSubSections, setOpenSubSections] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    items.forEach((item) => {
      item.items?.forEach((sub) => {
        const key = `${item.title}__${sub.title}`;
        const hasActiveDescendant = !!sub.active || !!sub.items?.some((s) => s.active);
        map[key] = hasActiveDescendant;
      });
    });
    return map;
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleSubSection = (parentTitle: string, subItemTitle: string) => {
    const key = `${parentTitle}__${subItemTitle}`;
    setOpenSubSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <nav className="w-full grow" aria-label="القائمة الرئيسية" role="navigation">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.title} className="relative">
            <div
              onClick={() => toggleSection(item.title)}
              className={cn(
                "flex items-center justify-between hover:bg-primaryColor dark:hover:bg-blue-600 p-2 rounded-md group",
                (item.isActive || openSections[item.title]) &&
                  "bg-primaryColor text-white dark:bg-blue-600"
              )}
              role="button"
              tabIndex={0}
              aria-expanded={openSections[item.title]}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSection(item.title);
                }
              }}
            >
              <Link
                href={item.url}
                className="flex items-center gap-2 w-full  "
                aria-current={item.isActive ? "page" : undefined}
              >
                <item.icon
                  width={24}
                  className={cn(
                    "text-black dark:text-slate-100 group-hover:text-white z-50",
                    (item.isActive || openSections[item.title]) && "text-white"
                  )}
                />
                <span
                  className={cn(
                    "text-16 text-black dark:text-slate-100 group-hover:text-white",
                    (item.isActive || openSections[item.title]) && "text-white"
                  )}
                >
                  {item.title}
                </span>
              </Link>
              {item.items?.length ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection(item.title);
                  }}
                  className={cn(
                    " text-black dark:text-slate-100 group-hover:text-white group-hover:bg-primaryColor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor rounded",
                    (item.isActive || openSections[item.title]) &&
                      "bg-primaryColor text-white dark:bg-blue-600"
                  )}
                  aria-label={openSections[item.title] ? `طي ${item.title}` : `توسيع ${item.title}`}
                  aria-expanded={openSections[item.title]}
                >
                  <ArrowLeft
                    className={`transition-transform w-6 text-black dark:text-slate-100 group-hover:text-white ${
                      openSections[item.title] ? "-rotate-90" : ""
                    } ${(item.isActive || openSections[item.title]) && "text-white"}`}
                  />
                </button>
              ) : null}
            </div>

            {item.items?.length && openSections[item.title] ? (
              <ul className="mr-4 mt-2 space-y-1 ">
                {item.items.map((subItem) => {
                  const subItemKey = `${item.title}__${subItem.title}`;
                  const isSubItemOpen = openSubSections[subItemKey] ?? false;
                  const hasSubItems = subItem.items && subItem.items.length > 0;
                  const subItemHasActiveChild =
                    !!subItem.active || !!subItem.items?.some((s) => s.active);
                  const isOpenActive = hasSubItems && isSubItemOpen; // prefer open state for styling

                  return (
                    <li key={subItem.title} className={`relative group `}>
                      <Line className="w-10 h-[60px] absolute -top-6 -start-7" />
                      <div
                        className={cn(
                          "flex items-center justify-between gap-2 text-14 px-2 py-1 rounded-md ms-3 group cursor-pointer",
                          isOpenActive
                            ? "bg-primaryColor text-white dark:bg-blue-600"
                            : subItemHasActiveChild
                              ? "bg-primaryColorLight text-primaryColor dark:bg-blue-900/30 dark:text-blue-400"
                              : "text-black dark:text-slate-100 hover:bg-primaryColor dark:hover:bg-blue-600 hover:text-white"
                        )}
                        role="group"
                      >
                        <Link
                          href={subItem.url}
                          className="flex items-center gap-2 flex-1"
                          aria-current={subItem.active ? "page" : undefined}
                        >
                          <Flash
                            className={cn(
                              "w-5 h-5",
                              isOpenActive && "text-white",
                              !isOpenActive &&
                                subItemHasActiveChild &&
                                "text-primaryColor dark:text-blue-400"
                            )}
                          />
                          {subItem.title}
                        </Link>

                        {hasSubItems && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSubSection(item.title, subItem.title);
                            }}
                            className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor rounded"
                            aria-label={
                              isSubItemOpen ? `طي ${subItem.title}` : `توسيع ${subItem.title}`
                            }
                            aria-expanded={isSubItemOpen}
                          >
                            <ArrowLeft
                              className={cn(
                                "transition-transform w-5",
                                isOpenActive
                                  ? "text-white"
                                  : subItemHasActiveChild
                                    ? "text-primaryColor dark:text-blue-400"
                                    : "text-black dark:text-slate-100 group-hover:text-white",
                                isSubItemOpen && "-rotate-90"
                              )}
                            />
                          </button>
                        )}
                      </div>

                      {hasSubItems && isSubItemOpen && (
                        <ul className="mr-4 mt-2 space-y-1 ">
                          {subItem.items?.map((subSubItem) => (
                            <li key={subSubItem.title} className=" relative group ">
                              <Line className="w-10 h-[60px] absolute -top-6 -start-7" />
                              <Link
                                href={subSubItem.url}
                                aria-current={subSubItem.active ? "page" : undefined}
                                className={`flex items-center gap-2 text-14 text-black dark:text-slate-100 px-2 py-1 hover:bg-primaryColor dark:hover:bg-blue-600 hover:text-white rounded-md ms-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor ${
                                  subSubItem.active
                                    ? " bg-primaryColorLight text-primaryColor dark:bg-blue-900/30 dark:text-blue-400"
                                    : ""
                                }`}
                              >
                                <Flash
                                  className={`w-5 h-5 ${
                                    subSubItem.active && "text-primaryColor dark:text-blue-400"
                                  }`}
                                />
                                {subSubItem.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
