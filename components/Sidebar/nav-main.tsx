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
            {item.items?.length ? (
              <div
                className={cn(
                  "flex items-center justify-between hover:bg-sidebar-accent p-2 rounded-md group",
                  (item.isActive || openSections[item.title]) &&
                    "bg-primary text-primary-foreground"
                )}
              >
                <Link
                  href={item.url}
                  className="flex items-center gap-2 w-full"
                  aria-current={item.isActive ? "page" : undefined}
                >
                  <item.icon
                    width={24}
                    className={cn(
                      "text-sidebar-foreground group-hover:text-primary-foreground",
                      (item.isActive || openSections[item.title]) && "text-primary-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-16 text-sidebar-foreground group-hover:text-primary-foreground",
                      (item.isActive || openSections[item.title]) && "text-primary-foreground"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(item.title);
                  }}
                  className={cn(
                    "p-1 rounded text-sidebar-foreground group-hover:text-primary-foreground group-hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    (item.isActive || openSections[item.title]) &&
                      "bg-primary text-primary-foreground"
                  )}
                  aria-label={openSections[item.title] ? `طي ${item.title}` : `توسيع ${item.title}`}
                  aria-expanded={openSections[item.title]}
                >
                  <ArrowLeft
                    className={`transition-transform w-6 text-sidebar-foreground group-hover:text-primary-foreground ${
                      openSections[item.title] ? "-rotate-90" : ""
                    } ${(item.isActive || openSections[item.title]) && "text-primary-foreground"}`}
                  />
                </button>
              </div>
            ) : (
              <Link
                href={item.url}
                className={cn(
                  "flex items-center gap-2 w-full hover:bg-sidebar-accent p-2 rounded-md group",
                  item.isActive && "bg-primary text-primary-foreground"
                )}
                aria-current={item.isActive ? "page" : undefined}
              >
                <item.icon
                  width={24}
                  className={cn(
                    "text-sidebar-foreground group-hover:text-primary-foreground",
                    item.isActive && "text-primary-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-16 text-sidebar-foreground group-hover:text-primary-foreground",
                    item.isActive && "text-primary-foreground"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            )}

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
                            ? "bg-primary text-primary-foreground"
                            : subItemHasActiveChild
                              ? "bg-primary/10 text-primary"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
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
                              isOpenActive && "text-primary-foreground",
                              !isOpenActive &&
                                subItemHasActiveChild &&
                                "text-primary"
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
                            className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                            aria-label={
                              isSubItemOpen ? `طي ${subItem.title}` : `توسيع ${subItem.title}`
                            }
                            aria-expanded={isSubItemOpen}
                          >
                            <ArrowLeft
                              className={cn(
                                "transition-transform w-5",
                                isOpenActive
                                  ? "text-primary-foreground"
                                  : subItemHasActiveChild
                                    ? "text-primary"
                                    : "text-sidebar-foreground group-hover:text-primary-foreground",
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
                                className={`flex items-center gap-2 text-14 text-sidebar-foreground px-2 py-1 hover:bg-sidebar-accent rounded-md ms-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                  subSubItem.active
                                    ? " bg-primary/10 text-primary"
                                    : ""
                                }`}
                              >
                                <Flash
                                  className={`w-5 h-5 ${
                                    subSubItem.active && "text-primary"
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
