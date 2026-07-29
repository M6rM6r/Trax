"use client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Flash, Line } from "@/public/SVG";
import { Link } from "@/i18n/navigation";
import React, { useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Navigation");
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
    <nav className="w-full grow" aria-label={t("mainMenu")} role="navigation">
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.title} className="relative">
            {item.items?.length ? (
              <div
                className={cn(
                  "group flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                  (item.isActive || openSections[item.title]) &&
                    "bg-primary/12 text-primary ring-1 ring-primary/20"
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
                      "text-sidebar-foreground group-hover:text-foreground",
                      (item.isActive || openSections[item.title]) && "text-primary"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium text-sidebar-foreground group-hover:text-foreground",
                      (item.isActive || openSections[item.title]) && "text-primary"
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
                    "rounded-md p-1 text-sidebar-foreground hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    (item.isActive || openSections[item.title]) && "text-primary"
                  )}
                  aria-label={
                    openSections[item.title]
                      ? `${t("collapse")} ${item.title}`
                      : `${t("expand")} ${item.title}`
                  }
                  aria-expanded={openSections[item.title]}
                >
                  <ArrowLeft
                    className={`w-5 transition-transform text-sidebar-foreground group-hover:text-primary ${
                      openSections[item.title] ? "-rotate-90" : ""
                    } ${(item.isActive || openSections[item.title]) && "text-primary"}`}
                  />
                </button>
              </div>
            ) : (
              <Link
                href={item.url}
                className={cn(
                  "group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                  item.isActive && "bg-primary/12 text-primary ring-1 ring-primary/20"
                )}
                aria-current={item.isActive ? "page" : undefined}
              >
                <item.icon
                  width={24}
                  className={cn(
                    "text-sidebar-foreground group-hover:text-foreground",
                    item.isActive && "text-primary"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium text-sidebar-foreground group-hover:text-foreground",
                    item.isActive && "text-primary"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            )}

            {item.items?.length && openSections[item.title] ? (
              <ul className="ms-4 mt-2 space-y-1 ">
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
                              !isOpenActive && subItemHasActiveChild && "text-primary"
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
                              isSubItemOpen
                                ? `${t("collapse")} ${subItem.title}`
                                : `${t("expand")} ${subItem.title}`
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
                        <ul className="ms-4 mt-2 space-y-1 ">
                          {subItem.items?.map((subSubItem) => (
                            <li key={subSubItem.title} className=" relative group ">
                              <Line className="w-10 h-[60px] absolute -top-6 -start-7" />
                              <Link
                                href={subSubItem.url}
                                aria-current={subSubItem.active ? "page" : undefined}
                                className={`flex items-center gap-2 text-14 text-sidebar-foreground px-2 py-1 hover:bg-sidebar-accent rounded-md ms-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                  subSubItem.active ? " bg-primary/10 text-primary" : ""
                                }`}
                              >
                                <Flash
                                  className={`w-5 h-5 ${subSubItem.active && "text-primary"}`}
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
