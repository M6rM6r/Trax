"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ContainerMockupSection from "@/components/Apps/CompanyWebsite/ContainerMockupSection";
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/Apps/CompanyWebsite/Icons";

interface PageMockupSectionProps {
  pageKey: string;
  pageData: any;
  expandedPages: Set<string>;
  onTogglePage: (pageKey: string) => void;
  onContainerToggle: (
    pageKey: string,
    containerKey: string,
    active: boolean
  ) => void;
  onChange: (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    value: any
  ) => void;
  onArrayItemChange: (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    index: number,
    value: string
  ) => void;
  onNestedObjectChange: (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    index: number,
    nestedKey: string,
    value: string
  ) => void;
}

const PageMockupSection = ({
  pageKey,
  pageData,
  expandedPages,
  onTogglePage,
  onContainerToggle,
  onChange,
  onArrayItemChange,
  onNestedObjectChange,
}: PageMockupSectionProps) => {
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(
    new Set()
  );

  const toggleContainer = (containerKey: string) => {
    const newExpanded = new Set(expandedContainers);
    if (newExpanded.has(containerKey)) {
      newExpanded.delete(containerKey);
    } else {
      newExpanded.add(containerKey);
    }
    setExpandedContainers(newExpanded);
  };

  const getPageTitle = (pageKey: string) => {
    const titles: { [key: string]: string } = {
      homepage: "الصفحة الرئيسية",
      about: "من نحن",
      careers: "الوظائف",
      contact: "اتصل بنا",
      drivers: "السائقين",
      passengers: "الركاب",
      helpCenter: "مركز المساعدة",
      news: "الأخبار",
      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام",
      services: "الخدمات",
    };
    return titles[pageKey] || pageKey;
  };

  const activeContainersCount = Object.values(pageData).filter(
    (container: any) => container.active
  ).length;

  return (
    <Card key={pageKey} className="border-2 border-gray-200">
      <CardHeader
        className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border-b"
        onClick={() => onTogglePage(pageKey)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {expandedPages.has(pageKey) ? (
              <ChevronUpIcon />
            ) : (
              <ChevronDownIcon />
            )}
            <CardTitle className="text-xl font-bold text-gray-800">
              {getPageTitle(pageKey)}
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {Object.keys(pageData).length} قسم
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {activeContainersCount} نشط
            </span>
          </div>
        </div>
      </CardHeader>

      {expandedPages.has(pageKey) && (
        <CardContent className="pt-6 space-y-4">
          {Object.entries(pageData).map(
            ([containerKey, containerData]: [string, any]) => (
              <ContainerMockupSection
                key={containerKey}
                pageKey={pageKey}
                containerKey={containerKey}
                containerData={containerData}
                expandedContainers={expandedContainers}
                onToggleContainer={toggleContainer}
                onContainerToggle={onContainerToggle}
                onChange={onChange}
                onArrayItemChange={onArrayItemChange}
                onNestedObjectChange={onNestedObjectChange}
              />
            )
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PageMockupSection;
