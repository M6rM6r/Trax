"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { EyeIcon, EyeOffIcon, ChevronDownIcon, ChevronUpIcon } from "./Icons";

interface AppLinksData {
  driver: {
    active: boolean;
    googlePlay: string;
    appStore: string;
  };
  passenger: {
    active: boolean;
    googlePlay: string;
    appStore: string;
  };
}

const initialAppLinks: AppLinksData = {
  driver: {
    active: true,
    googlePlay:
      "https://play.google.com/store/apps/details?id=com.zeem.driver&hl=en",
    appStore:
      "https://apps.apple.com/eg/app/%D8%B3%D8%A7%D8%A6%D9%82-%D8%B2%D9%8A%D9%85-zeem-driver/id6443723481",
  },
  passenger: {
    active: true,
    googlePlay:
      "https://play.google.com/store/apps/details?id=com.zeem.customer&hl=en",
    appStore:
      "https://apps.apple.com/us/app/%D8%B2%D9%8A%D9%85-zeem/id6443638059",
  },
};

interface AppLinksManagementProps {
  onLinksChange?: (links: AppLinksData) => void;
}

const AppLinksManagement = ({ onLinksChange }: AppLinksManagementProps) => {
  const [appLinks, setAppLinks] = useState<AppLinksData>(initialAppLinks);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLinkChange = (
    appType: "driver" | "passenger",
    field: "googlePlay" | "appStore",
    value: string
  ) => {
    setAppLinks((prev) => ({
      ...prev,
      [appType]: {
        ...prev[appType],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleAppToggle = (
    appType: "driver" | "passenger",
    active: boolean
  ) => {
    setAppLinks((prev) => ({
      ...prev,
      [appType]: {
        ...prev[appType],
        active,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    onLinksChange?.(appLinks);
    setHasChanges(false);
    setShowSaveDialog(false);
    // Here you would typically make an API call to save the links
  };

  const resetChanges = () => {
    setAppLinks(initialAppLinks);
    setHasChanges(false);
  };

  const getAppTitle = (appType: "driver" | "passenger"): string => {
    return appType === "driver" ? "تطبيق السائقين" : "تطبيق الركاب";
  };

  const getStoreBadge = (store: "googlePlay" | "appStore") => {
    return store === "googlePlay" ? "متجر Google Play" : "متجر App Store";
  };

  const getActiveAppsCount = () => {
    return Object.values(appLinks).filter((app) => app.active).length;
  };

  const SaveDialogContent = (
    <div className="space-y-4">
      <p className="text-right text-gray-700 text-lg">
        هل أنت متأكد من أنك تريد حفظ روابط التطبيقات؟ سيتم تحديث الروابط في
        الموقع مباشرة.
      </p>
      <div className="flex gap-3 justify-end pt-4">
        <Button
          variant="outline"
          onClick={() => setShowSaveDialog(false)}
          className="px-6"
        >
          إلغاء
        </Button>
        <Button
          variant={"primary"}
          onClick={confirmSave}
          className="px-8 py-3 text-white text-lg font-medium"
        >
          تأكيد الحفظ
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader
        className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            <CardTitle className="text-xl font-bold text-gray-800">
              إدارة روابط التطبيقات
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {Object.keys(appLinks).length} تطبيق
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {getActiveAppsCount()} نشط
            </span>
          </div>
        </div>
        <CardDescription className="text-right text-lg mt-2">
          إدارة روابط تحميل تطبيقات الهواتف من متاجر التطبيقات
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-6 space-y-6">
          {/* Driver App Links */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-800 text-lg">
                  {getAppTitle("driver")}
                </h3>
                <Badge variant="secondary" className="text-sm">
                  2 من الروابط
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {appLinks.driver.active ? <EyeIcon /> : <EyeOffIcon />}
                  <span
                    className={`text-sm ${
                      appLinks.driver.active
                        ? "text-green-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {appLinks.driver.active ? "نشط" : "غير نشط"}
                  </span>
                </div>
                <Switch
                  checked={appLinks.driver.active}
                  onCheckedChange={(checked) =>
                    handleAppToggle("driver", checked)
                  }
                />
              </div>
            </div>

            {appLinks.driver.active && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex flex-col space-y-2">
                  <label className="text-right font-medium text-gray-700">
                    رابط متجر Google Play
                  </label>
                  <Input
                    dir="ltr"
                    value={appLinks.driver.googlePlay}
                    onChange={(e) =>
                      handleLinkChange("driver", "googlePlay", e.target.value)
                    }
                    placeholder="أدخل رابط Google Play"
                  />
                  <Badge variant="outline" className="self-start">
                    {getStoreBadge("googlePlay")}
                  </Badge>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-right font-medium text-gray-700">
                    رابط متجر App Store
                  </label>
                  <Input
                    dir="ltr"
                    value={appLinks.driver.appStore}
                    onChange={(e) =>
                      handleLinkChange("driver", "appStore", e.target.value)
                    }
                    placeholder="أدخل رابط App Store"
                  />
                  <Badge variant="outline" className="self-start">
                    {getStoreBadge("appStore")}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Passenger App Links */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-800 text-lg">
                  {getAppTitle("passenger")}
                </h3>
                <Badge variant="secondary" className="text-sm">
                  2 من الروابط
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {appLinks.passenger.active ? <EyeIcon /> : <EyeOffIcon />}
                  <span
                    className={`text-sm ${
                      appLinks.passenger.active
                        ? "text-green-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {appLinks.passenger.active ? "نشط" : "غير نشط"}
                  </span>
                </div>
                <Switch
                  checked={appLinks.passenger.active}
                  onCheckedChange={(checked) =>
                    handleAppToggle("passenger", checked)
                  }
                />
              </div>
            </div>

            {appLinks.passenger.active && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex flex-col space-y-2">
                  <label className="text-right font-medium text-gray-700">
                    رابط متجر Google Play
                  </label>
                  <Input
                    dir="ltr"
                    value={appLinks.passenger.googlePlay}
                    onChange={(e) =>
                      handleLinkChange(
                        "passenger",
                        "googlePlay",
                        e.target.value
                      )
                    }
                    placeholder="أدخل رابط Google Play"
                  />
                  <Badge variant="outline" className="self-start">
                    {getStoreBadge("googlePlay")}
                  </Badge>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-right font-medium text-gray-700">
                    رابط متجر App Store
                  </label>
                  <Input
                    dir="ltr"
                    value={appLinks.passenger.appStore}
                    onChange={(e) =>
                      handleLinkChange("passenger", "appStore", e.target.value)
                    }
                    placeholder="أدخل رابط App Store"
                  />
                  <Badge variant="outline" className="self-start">
                    {getStoreBadge("appStore")}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
            <Button
              onClick={resetChanges}
              variant="outline"
              disabled={!hasChanges}
              className="px-6 py-2"
            >
              إعادة التعيين
            </Button>

            <CustomDialog
              trigger={
                <Button
                  variant={"primary"}
                  disabled={!hasChanges}
                  className="px-6 py-2 text-white text-lg font-medium"
                >
                  حفظ الروابط
                </Button>
              }
              content={SaveDialogContent}
              color={Colors.primary}
              title="تأكيد حفظ الروابط"
              open={showSaveDialog}
              onOpenChange={setShowSaveDialog}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AppLinksManagement;
