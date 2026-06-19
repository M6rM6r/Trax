"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Shapes } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { initialMockups } from "./initialMockups";
import PageMockupSection from "@/components/Apps/CompanyWebsite/MockupSection";
import AppLinksManagement from "@/components/Apps/CompanyWebsite/AppLinksComponent";
import SaveChangesDialog from "@/components/Apps/CompanyWebsite/SaveChangesDialog";
import CancelChangesDialog from "@/components/Apps/CompanyWebsite/CancelChangesDialog";

const AdminMockupsPage = () => {
  const [mockups, setMockups] = useState<any>(null);
  const [editedMockups, setEditedMockups] = useState<any>({});
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    new Set(["homepage"])
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMockups(initialMockups);
      setEditedMockups(structuredClone(initialMockups));
    }, 500);
  }, []);

  const togglePage = (pageKey: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageKey)) {
      newExpanded.delete(pageKey);
    } else {
      newExpanded.add(pageKey);
    }
    setExpandedPages(newExpanded);
  };

  const handleContainerToggle = (
    pageKey: string,
    containerKey: string,
    active: boolean
  ) => {
    setEditedMockups((prev: any) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [containerKey]: {
          ...prev[pageKey][containerKey],
          active,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleChange = (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    value: any
  ) => {
    setEditedMockups((prev: any) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [containerKey]: {
          ...prev[pageKey][containerKey],
          mockups: {
            ...prev[pageKey][containerKey].mockups,
            [fieldKey]: value,
          },
        },
      },
    }));
    setHasChanges(true);
  };

  const handleArrayItemChange = (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    index: number,
    value: string
  ) => {
    const currentItems =
      editedMockups[pageKey]?.[containerKey]?.mockups?.[fieldKey] || [];
    const newItems = [...currentItems];

    if (typeof newItems[index] === "string") {
      newItems[index] = value;
    }

    handleChange(pageKey, containerKey, fieldKey, newItems);
  };

  const handleNestedObjectChange = (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    index: number,
    nestedKey: string,
    value: string
  ) => {
    const currentItems =
      editedMockups[pageKey]?.[containerKey]?.mockups?.[fieldKey] || [];
    const newItems = [...currentItems];
    newItems[index] = {
      ...newItems[index],
      [nestedKey]: value,
    };
    handleChange(pageKey, containerKey, fieldKey, newItems);
  };

  const confirmSave = () => {
    // API call would go here
    setMockups(structuredClone(editedMockups));
    setHasChanges(false);
    setShowSaveDialog(false);
    toast({ title: "تم حفظ التغييرات بنجاح!" });
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      resetChanges();
    }
  };

  const confirmCancel = () => {
    resetChanges();
    setShowCancelDialog(false);
  };

  const resetChanges = () => {
    setEditedMockups(structuredClone(mockups));
    setHasChanges(false);
  };

  const handleAppLinksChange = (links: any) => {
    toast({ title: "تم تحديث روابط التطبيقات بنجاح!" });
  };

  if (!mockups) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <LoadingSpinner />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Shapes className="w-5 text-iconColor" />,
            label: "إدارة المحتوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تحرير نصوص الموقع",
          },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* App Links Management Section */}
        <AppLinksManagement onLinksChange={handleAppLinksChange} />

        {/* Mockups Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-2xl">
              إدارة محتوى الموقع
            </CardTitle>
            <CardDescription className="text-right text-lg">
              يمكنك هنا تعديل جميع النصوص والمحتوى الظاهر في الموقع. كل قسم يمثل
              كتلة محتوى في الصفحة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(editedMockups).map(
                ([pageKey, pageData]: [string, any]) => (
                  <PageMockupSection
                    key={pageKey}
                    pageKey={pageKey}
                    pageData={pageData}
                    expandedPages={expandedPages}
                    onTogglePage={togglePage}
                    onContainerToggle={handleContainerToggle}
                    onChange={handleChange}
                    onArrayItemChange={handleArrayItemChange}
                    onNestedObjectChange={handleNestedObjectChange}
                  />
                )
              )}
            </div>

            {/* Action Buttons - Restored */}
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={!hasChanges}
                className="px-6 py-2"
              >
                إلغاء التغييرات
              </Button>

              <CustomDialog
                trigger={
                  <Button
                    variant={"primary"}
                    disabled={!hasChanges}
                    className="px-6 py-2 text-white text-lg font-medium"
                  >
                    حفظ التغييرات
                  </Button>
                }
                content={
                  <SaveChangesDialog
                    onConfirm={confirmSave}
                    onCancel={() => setShowSaveDialog(false)}
                  />
                }
                color={Colors.primary}
                title="تأكيد حفظ التغييرات"
                open={showSaveDialog}
                onOpenChange={setShowSaveDialog}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <CancelChangesDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelDialog(false)}
      />
    </MainLayout>
  );
};

export default AdminMockupsPage;
