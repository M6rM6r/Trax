"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import CustomDialog, { Colors } from "../CustomDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";

/**
 * مكون AuthenticatorDialog - التحقق عبر تطبيق المصادقة
 * يوفر واجهة ثنائية المراحل:
 * 1. المرحلة الأولى: عرض QR Code والمفتاح السري
 * 2. المرحلة الثانية: إدخال رمز التحقق (6 أرقام)
 *
 * يدعم:
 * - عرض QR Code يمكن مسحه بتطبيقات المصادقة (Google Authenticator, Microsoft, إلخ)
 * - نسخ المفتاح السري يدويًا
 * - تحميل صورة QR Code
 * - التحقق من الرمز المُولّد بواسطة التطبيق
 */
interface AuthenticatorDialogProps {
  trigger?: React.ReactNode;
  onConfirm?: () => void;
  open?: boolean;
  onRevalidate?: () => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  data:
    | {
        active: boolean;
        key: string;
        visible: boolean;
      }
    | undefined;
}

const AuthenticatorDialog = ({
  trigger,
  onConfirm,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onRevalidate,
  data,
}: AuthenticatorDialogProps) => {
  // حالة الـ Dialog - مراقبة داخلية إذا لم يتم توفير حالة خارجية
  const [internalOpen, setInternalOpen] = React.useState(false);
  // حالة Dialog التحذير
  const [warningDialogOpen, setWarningDialogOpen] = React.useState(false);
  // استخدام الحالة الخارجية إذا تم توفيرها، وإلا استخدام الحالة الداخلية
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  // حالة التحميل للتحقق من API
  const [isLoading, setIsLoading] = React.useState(false);
  const { showResponseToast } = useResponseToast();

  // حالة النسخ - يظهر تأكيد عند نسخ المفتاح
  const [copied, setCopied] = useState(false);
  // حالة العرض - "qr" أو "otp"
  const [showOTP, setShowOTP] = useState(false);
  // قيمة رمز التحقق (6 أرقام)
  const [otpValue, setOtpValue] = useState("");
  // الوقت المتبقي للعد التنازلي (بالثواني)
  const [timeLeft, setTimeLeft] = useState(30);
  // هل يمكن إعادة إرسال الرمز
  const [canResend, setCanResend] = useState(false);

  // بيانات التحقق الثنائي من الاستجابة
  const [twoFactorData, setTwoFactorData] = React.useState<{
    secret: string;
    method: string;
    canResendAt: string;
  } | null>(null);

  // المفتاح السري ورمز QR من API
  const [secretKey, setSecretKey] = React.useState<string>("");
  const [qrCodeValue, setQrCodeValue] = React.useState<string>("");

  // مرجع إلى عنصر QR Code لتحميله
  const qrRef = React.useRef<HTMLDivElement>(null);

  /**
   * التحقق من حالة التحقق الثنائي قبل فتح الـ Dialog وجلب بيانات QR Code
   */
  const handleOpenDialog = async () => {
    setIsLoading(true);
    try {
      const response = await fetcherClient("/2fa/enable/authenticator", {
        method: "POST",
      });

      if ((response as any).success && (response as any).data) {
        // حفظ بيانات التحقق الثنائي
        setTwoFactorData({
          secret: (response as any).data["2fa_secret"],
          method: (response as any).data.method,
          canResendAt: (response as any).data.can_resend_otp_at,
        });

        // حفظ المفتاح السري ورمز QR
        setSecretKey((response as any).data.authenticator_secret);
        setQrCodeValue((response as any).data.qr_code);

        // فتح الـ Dialog
        setIsOpen(true);
      }
    } catch (error: any) {
      showResponseToast(
        error.info || { success: false, message: "حدث خطأ في التحقق" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** نسخ المفتاح السري إلى الحافظة */
  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** تحميل صورة QR Code كـ PNG */
  const handleDownloadQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas") as HTMLCanvasElement;
      if (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "authenticator-qr-code.png";
        link.click();
      }
    }
  };

  /** عداد العد التنازلي - يعمل فقط عند عرض مرحلة OTP */
  React.useEffect(() => {
    if (!showOTP) return;

    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }

    if (!canResend) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, canResend, showOTP]);

  /**
   * معالج إعادة الإرسال - يعيد تشغيل العداد وينظف حقل OTP
   * TODO: ربط هذه الدالة بـ API لإعادة إرسال الرمز إذا لزم الأمر
   */
  const handleResend = () => {
    // TODO: استدعاء API لإعادة إرسال الرمز إن أمكن
    setTimeLeft(30);
    setCanResend(false);
    setOtpValue("");
  };

  /** تنسيق الوقت من ثواني إلى صيغة MM:SS */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * معالج تأكيد الرمز - التحقق من أن الرمز صحيح
   * TODO: التحقق من صحة الرمز مع API قبل الاستدعاء
   */
  const handleConfirmOTP = async () => {
    setIsLoading(true);
    try {
      // التحقق من وجود بيانات التحقق الثنائي
      if (!twoFactorData) {
        showResponseToast({
          success: false,
          message: "بيانات التحقق غير متوفرة",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetcherClient("/2fa/continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "2fa_secret": twoFactorData.secret,
          otp: otpValue,
          "2fa_method": twoFactorData.method,
        }),
      });

      showResponseToast(response as any);

      if ((response as any).success) {
        // إغلاق الـ Dialog
        setIsOpen(false);

        // تنظيف الحالات
        setTimeout(() => {
          setOtpValue("");
          setTimeLeft(30);
          setCanResend(false);
        }, 300); // تأخير صغير لإتمام animation الإغلاق

        // استدعاء callback من الـ parent
        if (onConfirm) {
          onConfirm();
        }

        // تحديث الصفحة
        if (onRevalidate) {
          await onRevalidate();
        }
      }
    } catch (error: any) {
      showResponseToast(
        error.info || {
          success: false,
          message: "حدث خطأ أثناء التحقق من الرمز",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDisable = async () => {
    setIsLoading(true);
    try {
      const response = await fetcherClient("/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "2fa_method": "authenticator",
        }),
      });

      showResponseToast(response as any);

      if ((response as any).success) {
        setWarningDialogOpen(false);
        // استدعاء callback من الـ parent
        if (onConfirm) {
          onConfirm();
        }
        // تحديث الصفحة
        if (onRevalidate) {
          await onRevalidate();
        }
      }
    } catch (error: any) {
      showResponseToast(
        error.info || { success: false, message: "حدث خطأ أثناء إلغاء التفعيل" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {" "}
      <CustomDialog
        className="max-w-[628px]"
        title={showOTP ? "أدخل رمز التحقق" : "التفعيل عبر تطبيق المصادقة"}
        trigger={
          trigger || (
            <>
              {!data?.active ? (
                <div
                  className=" text-[#11489B] font-[600] cursor-pointer hover:opacity-80 transition"
                  onClick={handleOpenDialog}
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                    pointerEvents: isLoading ? "none" : "auto",
                  }}
                >
                  {isLoading ? "جاري التحميل..." : "فعل الآن"}
                </div>
              ) : (
                <div
                  className=" text-[#FF0000] font-[600] cursor-pointer hover:opacity-80 transition"
                  onClick={() => setWarningDialogOpen(true)}
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                    pointerEvents: isLoading ? "none" : "auto",
                  }}
                >
                  {isLoading ? "جاري التحميل..." : "إلغاء التفعيل"}
                </div>
              )}
            </>
          )
        }
        color={Colors.primary}
        open={isOpen}
        onOpenChange={setIsOpen}
        content={
          showOTP ? (
            // مرحلة 2: إدخال رمز التحقق (OTP)
            <>
              <h3 className="text-24 text-textMain font-[700] mb-3">
                أدخل رمز التحقق
              </h3>
              <p className="text-16 text-textSubText mb-5">
                اكتب الرمز المكوّن من 6 أرقام أو أدخل الرقم السري لإتمام عملية
                التحقق بأمان.
              </p>
              <div className="space-y-6 flex flex-col items-center w-full">
                {/* حقول إدخال OTP - 6 حقول منفصلة */}
                <div className="w-full space-y-4 flex flex-col justify-center items-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    dir="ltr"
                    className="flex flex-row gap-3 justify-center"
                  >
                    <InputOTPGroup className="flex flex-row gap-3 justify-center text-left">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-14 h-14 text-2xl flex items-center justify-center border-2 border-gray-300 rounded-md focus:border-blue-600 focus:ring-0 transition-colors duration-150 text-center"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* العداد والوقت المتبقي */}
                <div className="text-center space-y-3 w-full">
                  {!canResend && (
                    <div className="text-sm text-primaryColor font-medium font-mono">
                      {formatTime(timeLeft)} s
                    </div>
                  )}
                </div>

                {/* زر إعادة الإرسال - يظهر بعد انتهاء العداد */}
                <button
                  onClick={handleResend}
                  className={`${
                    canResend
                      ? "text-primaryColor cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  } font-medium text-sm transition-colors duration-200 mx-auto block`}
                  disabled={!canResend}
                >
                  إعادة إرسال
                </button>

                {/* أزرار المرحلة الثانية */}
                <div className="w-full flex gap-2 flex-col">
                  <Button
                    className={`${
                      otpValue.length === 6
                        ? "bg-primaryColor hover:bg-primaryColor"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={otpValue.length !== 6}
                    size="lg"
                    onClick={handleConfirmOTP}
                  >
                    تأكيد
                  </Button>
                  <button
                    onClick={() => setShowOTP(false)}
                    className="text-center py-3 font-medium text-textSubText hover:text-textMain transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </>
          ) : (
            // مرحلة 1: عرض QR Code والمفتاح السري
            <>
              <h3 className="text-24 text-textMain font-[700] mb-3">
                امسح رمز QR لتفعيل التحقق الثنائي
              </h3>
              <p className="text-16 text-textSubText mb-5">
                افتح تطبيق المصادقة مثل Google Authenticator أو Microsoft
                Authenticator، بيمكنك مسح رمز QR أو إدخال الرمز السري يدويا في
                تطبيق المصادقة لإتمام عملية التفعيل.
              </p>
              <div className="space-y-6 flex flex-col items-center w-full">
                {/* عرض QR Code - يمكن مسحه بهاتف ذكي */}
                <div
                  ref={qrRef}
                  className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center"
                >
                  <QRCodeSVG
                    value={qrCodeValue}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                {/* المفتاح السري - بديل لمسح QR Code */}
                <div className="text-center w-full">
                  <p className="text-sm text-textSubText mb-3">أو</p>
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-4 justify-center w-full">
                    <code className="font-mono text-lg font-bold text-center flex-1 break-all">
                      {secretKey}
                    </code>
                    {/* زر نسخ المفتاح السري */}
                    <button
                      onClick={handleCopy}
                      className="text-primaryColor hover:text-primaryColor/80 transition-colors flex-shrink-0"
                      title="نسخ المفتاح السري"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-2">
                      تم النسخ بنجاح!
                    </p>
                  )}
                </div>

                {/* رابط تحميل صورة QR Code */}
                <button
                  onClick={handleDownloadQR}
                  className="text-primaryColor hover:text-primaryColor/80 transition-colors font-medium text-sm"
                >
                  تحميل رمز QR
                </button>

                {/* أزرار المرحلة الأولى */}
                <div className="w-full flex gap-2 flex-col">
                  {/* زر الانتقال إلى مرحلة التحقق */}
                  <Button
                    className="bg-primaryColor hover:bg-primaryColor"
                    size="lg"
                    onClick={() => setShowOTP(true)}
                  >
                    تم
                  </Button>
                  {/* زر الإغلاق */}
                  <DialogClose asChild>
                    <Button size="lg" variant="ghost">
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </>
          )
        }
      />{" "}
      {/* Dialog التحذير لإلغاء التفعيل */}
      <CustomDialog
        className="max-w-[628px]"
        title="تنبيه هام"
        trigger={<></>}
        color={Colors.error}
        open={warningDialogOpen}
        onOpenChange={setWarningDialogOpen}
        content={
          <div className="flex flex-col items-center justify-center gap-6 py-4">
            {/* أيقونة التحذير */}
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* النص الرئيسي */}
            <div className="text-center">
              <h3 className="text-20 text-textMain font-[700] mb-3">
                هل تريد إلغاء التحقق عبر تطبيق المصادقة؟
              </h3>
              <p className="text-16 text-textSubText">
                بإلغاء هذه الطريقة، لن تتمكن من استخدام تطبيق المصادقة للتحقق
                الثنائي عند تسجيل الدخول.
              </p>
            </div>

            {/* الأزرار */}
            <div className="w-full flex flex-col gap-3 mt-2">
              <Button
                className="w-full border-2 border-red-600 bg-white text-red-600 hover:bg-red-50"
                size="lg"
                onClick={handleConfirmDisable}
                disabled={isLoading}
              >
                {isLoading ? "جاري المعالجة..." : "تأكيد الإلغاء"}
              </Button>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
                onClick={() => setWarningDialogOpen(false)}
                disabled={isLoading}
              >
                عودة
              </Button>
            </div>
          </div>
        }
      />
    </>
  );
};

export default AuthenticatorDialog;
