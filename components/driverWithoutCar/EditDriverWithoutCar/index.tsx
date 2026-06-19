/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import FormStepper from "../../shared/form/FormStepper";
import * as Yup from "yup";
import { fetcherClient } from "@/lib/fetcherClient";
import CompleteData1 from "@/components/shared/CompleteData/CompleteData1";
import CompleteData2 from "@/components/shared/CompleteData/CompleteData2";
import { Driver } from "@/lib/types/responseTypes";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";
import { EVehicleType } from "@/lib/types/enums";
import { normalizeFile } from "@/lib/utils";

const Index = ({
  profileData,
  vehicle_type,
  onClose,
  isNewDriver = false,
}: {
  profileData: Driver;
  vehicle_type: EVehicleType;
  onClose?: () => void;
  isNewDriver?: boolean;
}) => {
  const validationSchemas = [
    // Step 1: Documents
    Yup.object({
      image: Yup.mixed().nullable(),
      license: Yup.mixed().nullable(),
    }),
    // Step 2: Complete Data
    Yup.object({
      id: Yup.string()
        .matches(/^\d{10}$/, "رقم الهوية يجب ان يكون 10 ارقام")
        .required("رقم الهوية مطلوب"),
      dop: Yup.string()
        .required("تاريخ الميلاد مطلوب"),
    }),
  ];
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

  // Handle each step submission
  const handleStepSubmit = async (step: number, values: any) => {
    console.log(`=== Step ${step} Submit ===`);

    if (step === 1) {
      // Step 1: Update Documents
      console.log("Step 1: Calling updateDocuments API...");
      const docsFormData = new FormData();
      docsFormData.append("user_id", profileData.id.toString());
      docsFormData.append("step", "2");

      const frontIdFile = await normalizeFile(
        values.front_side_identity,
        `${profileData.name}_identity.jpg`
      );
      const licenseFile = await normalizeFile(
        values.front_side_license,
        `${profileData.name}_license.jpg`
      );

      if (values.front_side_identity && frontIdFile) {
        docsFormData.append("front_side_identity", frontIdFile);
      }
      if (values.imageDate) {
        docsFormData.append("identity_number_expiration_date", values.imageDate);
      }

      if (values.front_side_license && licenseFile) {
        docsFormData.append("front_side_license", licenseFile);
      }
      if (values.licenseDate) {
        docsFormData.append("driving_license_expiration_date", values.licenseDate);
      }

      if (values.id) {
        docsFormData.append("identity_number", values.id);
      }
      if (values.dop) {
        docsFormData.append("date_of_birth", values.dop);
      }

      const docsResponse: any = await fetcherClient("/drivers/updateDocuments", {
        method: "POST",
        body: docsFormData,
      });

      if (!docsResponse.success) {
        showResponseToast(docsResponse);
        throw docsResponse;
      }

      console.log("✓ Step 1 completed successfully");
      showResponseToast(docsResponse);
    }
  };

  // Determine which step to start from based on driver's progress
  const getInitialStep = () => {
    if (isNewDriver || !profileData.step) return 1;
    const dbStep = Number(profileData.step);
    if (dbStep >= 3) return 1; // All steps complete, start from beginning for editing
    if (dbStep === 2) return 2; // Documents complete, show Complete Data step
    if (dbStep === 1) return 1; // Basic info complete, show Documents step
    return 1;
  };

  return (
    <FormStepper
      initialStep={getInitialStep()}
      initialValues={{
        // step 1: Documents
        front_side_identity: profileData.front_side_identity || "",
        imageDate: profileData.identity_number_expiration_date || "",
        front_side_license: profileData.front_side_license || "",
        licenseDate: profileData.driving_license_expiration_date || "",
        // step 2: Complete Data
        id: profileData.identity_number || "",
        dop: profileData.date_of_birth || "",
        mobile: `+${profileData.country_code || ""}${profileData.mobile || ""}`,
        phone: profileData.mobile || "",
        country_code: profileData.country_code || "",
        email: profileData.email || "",
      }}
      validationSchemas={validationSchemas}
      labels={["المستندات", "تعبئة البيانات!"]}
      steps={[
        (props) => (
          <CompleteData1
            formikProps={props}
            profileData={profileData}
            vehicleType={vehicle_type}
          />
        ),
        (props) => (
          <CompleteData2
            formikProps={props}
            profileData={profileData}
            vehicleType={vehicle_type}
          />
        ),
      ]}
      onStepSubmit={handleStepSubmit}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          // Step 2: Check WASL Validity (but always proceed regardless of result)
          console.log("Step 2: Calling checkWaslValidity API...");
          const waslFormData = new FormData();
          waslFormData.append("user_id", profileData.id.toString());
          waslFormData.append("step", "3");
          waslFormData.append("status", "active");
          waslFormData.append("wasl_status", "1"); // Set WASL status to active

          if (values.id) {
            waslFormData.append("identity_number", values.id);
          }
          if (values.dop) {
            waslFormData.append("date_of_birth", values.dop);
          }
          if (values.phone) {
            waslFormData.append("mobile", values.phone);
          }

          // Log WASL FormData contents for debugging
          console.log("Step 2 FormData contents:");
          Array.from(waslFormData.entries()).forEach(([key, value]) => {
            console.log(key + ': ' + value);
          });

          // Call WASL API but don't throw errors or show messages
          // This API will handle updating step and status internally
          try {
            await fetcherClient("/drivers/checkWaslValidity", {
              method: "POST",
              body: waslFormData,
            });
          } catch (waslError) {
            // Silently ignore WASL errors
            console.log("WASL validation called (errors ignored)");
          }

          console.log("✓ Step 2 completed successfully");
          console.log("=== All steps completed successfully! ===");

          showResponseToast({ success: true, message: "تم إكمال جميع الخطوات بنجاح" });

          // Close the form
          if (onClose) {
            onClose();
          }

          router.refresh();
        } catch (error: any) {
          console.error("❌ Error during final step:", error);
          console.error("Error details:", error.info || error);
          showResponseToast(error.info || error);

          // Close the form even on error
          if (onClose) {
            onClose();
          }

          router.refresh();
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
};

export default Index;
