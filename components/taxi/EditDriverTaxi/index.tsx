/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import FormStepper from "../../shared/form/FormStepper";
import * as Yup from "yup";
import { fetcherClient } from "@/lib/fetcherClient";
import Step2 from "./Step2";
import CompleteData1 from "@/components/shared/CompleteData/CompleteData1";
import CompleteData2 from "@/components/shared/CompleteData/CompleteData2";
import { Driver } from "@/lib/types/responseTypes";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";
import { EVehicleType } from "@/lib/types/enums";
import { normalizeFile } from "@/lib/utils";

const Index = ({
  profileData,
  vehicleType,
  onClose,
  isNewDriver = false,
}: {
  profileData: Driver;
  vehicleType: EVehicleType;
  onClose?: () => void;
  isNewDriver?: boolean;
}) => {
  const validationSchemas = [
    // Step 1: Service Data
    Yup.object({}),
    // Step 2: Documents
    Yup.object({
      image: Yup.mixed().nullable(),
      license: Yup.mixed().nullable(),
      carForm: Yup.mixed().nullable(),
    }),
    // Step 3: WASL Validation
    Yup.object({
      id: Yup.string()
        .matches(/^\d{10}$/, "رقم الهوية يجب ان يكون 10 ارقام")
        .matches(/^[1]/, "رقم الهوية يجب ان يبدأ بـ 1 ") // Saudi IDs start with 1
        .required("رقم الهوية مطلوب"),
      dop: Yup.string()
        .required("تاريخ الميلاد مطلوب"),
      serialNumber: Yup.string()
        .matches(/^\d{5,}$/, "رقم التسلسل يجب ان يكون 5 ارقام على الأقل")
        .test(
          "len",
          "رقم التسلسل يجب ان يكون 15 رقم",
          (val) => !val || val.toString().length <= 15
        )
        .required("رقم التسلسل مطلوب"),
      boardType: Yup.string().required("نوع اللوحة مطلوب"),
      carBoardType: Yup.string()
        .matches(/^\d{1,4}$/, "رقم اللوحة يجب ان يكون من 1 الى 4 ارقام")
        .required("رقم اللوحة مطلوب"),
      rightCharacter: Yup.string()
        .matches(/^[\u0600-\u06FFa-zA-Z]$/, "حرف اليمين يجب ان يكون حرف واحد")
        .max(1, "حرف اليمين يجب ان يكون حرف واحد")
        .required("حرف اليمين مطلوب"),
      middleCaracter: Yup.string()
        .matches(/^[\u0600-\u06FFa-zA-Z]$/, "حرف الوسط يجب ان يكون حرف واحد")
        .max(1, "حرف الوسط يجب ان يكون حرف واحد")
        .required("حرف الوسط مطلوب"),
      leftCharacter: Yup.string()
        .matches(/^[\u0600-\u06FFa-zA-Z]$/, "حرف اليسار يجب ان يكون حرف واحد")
        .max(1, "حرف اليسار يجب ان يكون حرف واحد")
        .required("حرف اليسار مطلوب"),
      country_code: Yup.string().required("مفتاح الدولة مطلوب"),
    }),
  ];
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

  // Handle each step submission
  const handleStepSubmit = async (step: number, values: any) => {
    console.log(`=== Step ${step} Submit ===`);

    if (step === 1) {
      // Step 1: Set Service Data
      console.log("Step 1: Calling setService API...");
      const serviceFormData = new FormData();
      serviceFormData.append("user_id", profileData.id.toString());
      serviceFormData.append("vehicle_type", "taxi");
      serviceFormData.append("brand_id", values.vehicleType.toString());
      serviceFormData.append("car_model_id", values.vehicleModel.toString());
      serviceFormData.append("color_id", values.vehicleColor.toString());
      serviceFormData.append("seats_number", values.seatsNumber.toString());
      serviceFormData.append(
        "available_for_important_dates",
        values.importantAppointments.toString()
      );
      serviceFormData.append("step", "2");

      // Add personal data
      if (values.id) {
        serviceFormData.append("identity_number", values.id);
      }
      if (values.dop) {
        serviceFormData.append("date_of_birth", values.dop);
      }

      // Add plate data
      if (values.boardType) {
        serviceFormData.append("plate_type", values.boardType.toString());
      }
      if (values.serialNumber) {
        serviceFormData.append("sequence_number", values.serialNumber);
      }
      if (values.carBoardType) {
        serviceFormData.append("plate_number", values.carBoardType);
      }
      if (values.rightCharacter) {
        serviceFormData.append("plate_letter_right", values.rightCharacter);
      }
      if (values.middleCaracter) {
        serviceFormData.append("plate_letter_middle", values.middleCaracter);
      }
      if (values.leftCharacter) {
        serviceFormData.append("plate_letter_left", values.leftCharacter);
      }
      if (values.country_code) {
        serviceFormData.append("country_code", values.country_code);
      }
      

      // Add rules
      if (values.rules.length > 0) {
        values.rules.forEach((rule: any) => {
          if (rule.is_assigned) {
            serviceFormData.append("rules[]", rule.id);
          }
        });
      }

      // Log FormData contents for debugging
      console.log("Step 1 FormData contents:");
      Array.from(serviceFormData.entries()).forEach(([key, value]) => {
        console.log(key + ':', value);
      });

      const serviceResponse: any = await fetcherClient("/drivers/setService", {
        method: "POST",
        body: serviceFormData,
        cache: "no-store",
      });

      console.log("setService Response:", serviceResponse);

      if (!serviceResponse.success) {
        console.error("setService failed:", serviceResponse);
        console.error("Error details:", serviceResponse.info);
        showResponseToast(serviceResponse);
        throw serviceResponse;
      }

      console.log("✓ Step 1 completed successfully");
      showResponseToast(serviceResponse);
    } else if (step === 2) {
      // Step 2: Update Documents
      console.log("Step 2: Calling updateDocuments API...");
      const docsFormData = new FormData();
      docsFormData.append("user_id", profileData.id.toString());
      docsFormData.append("step", "3");

      const frontIdFile = await normalizeFile(
        values.front_side_identity,
        `${profileData.name}_identity.jpg`
      );
      const licenseFile = await normalizeFile(
        values.front_side_license,
        `${profileData.name}_license.jpg`
      );
      const vehicleFormFile = await normalizeFile(
        values.front_side_vehicle_form,
        `${profileData.name}_vehicle_form.jpg`
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

      if (values.front_side_vehicle_form && vehicleFormFile) {
        docsFormData.append("front_side_vehicle_form", vehicleFormFile);
      }
      if (values.carFormDate) {
        docsFormData.append("vehicle_form_expiration_date", values.carFormDate);
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

      console.log("✓ Step 2 completed successfully");
      showResponseToast(docsResponse);
    }
  };

  // Determine which step to start from based on driver's progress
  const getInitialStep = () => {
    if (isNewDriver || !profileData.step) return 1;
    // Driver's step value in DB corresponds to the completed step
    // DB step=1 → User completed Basic Info (outside stepper), show Step 1 (Service Data)
    // DB step=2 → User completed Service Data, show Step 2 (Documents)
    // DB step=3 → User completed Documents, show Step 3 (WASL)
    // DB step>=4 → All complete, allow editing from Step 1
    const dbStep = Number(profileData.step);
    if (dbStep >= 4) return 1; // All steps complete, start from beginning for editing
    if (dbStep === 3) return 3; // Documents complete, show WASL step
    if (dbStep === 2) return 2; // Service Data complete, show Documents step
    if (dbStep === 1) return 1; // Basic info complete, show Service Data step
    return 1;
  };

  return (
    <FormStepper
      initialStep={getInitialStep()}
      initialValues={{
        // step 1: Basic Info
        image: profileData.profile_image || null,
        name: profileData.name || "",
        gender: profileData.gender || "",
        phone: profileData.mobile || "",
        country_code: profileData.country_code || "",
        email: profileData.email || "",
        // step 2: Service Data
        vehicleType: profileData.vehicle_data?.brand_id || "",
        vehicleModel: profileData.vehicle_data?.car_model_id || "",
        vehicleColor: profileData.vehicle_data?.color_id || "",
        seatsNumber: profileData.vehicle_data?.seats_number || "",
        rules: profileData.vehicle_data?.rules || [],
        importantAppointments:
          profileData.vehicle_data?.available_for_important_dates || 0,
        // step 3: Documents
        front_side_identity: profileData.front_side_identity || "",
        imageDate: profileData.identity_number_expiration_date || "",
        front_side_license: profileData.front_side_license || "",
        licenseDate: profileData.driving_license_expiration_date || "",
        front_side_vehicle_form: profileData.front_side_vehicle_form || "",
        carFormDate: profileData.vehicle_form_expiration_date || "",
        // step 4: Complete Data
        id: profileData.identity_number || "",
        dop: profileData.date_of_birth || "",
        mobile: `+${profileData.country_code || ""}${profileData.mobile || ""}`,
        boardType:
          (profileData.vehicle_data?.plate_type &&
          Number(profileData.vehicle_data.plate_type)) || "",
        serialNumber: profileData.vehicle_data?.sequence_number || "",
        carBoardType: profileData.vehicle_data?.plate_number || "",
        rightCharacter: profileData.vehicle_data?.plate_letter_right || "",
        middleCaracter: profileData.vehicle_data?.plate_letter_middle || "",
        leftCharacter: profileData.vehicle_data?.plate_letter_left || "",
      }}
      validationSchemas={validationSchemas}
      labels={["بيانات الخدمة", "المستندات", "تعبئة البيانات!"]}
      steps={[
        (props) => <Step2 formikProps={props} />,
        (props) => (
          <CompleteData1
            formikProps={props}
            profileData={profileData}
            vehicleType={vehicleType}
          />
        ),
        (props) => (
          <CompleteData2
            formikProps={props}
            profileData={profileData}
            vehicleType={vehicleType}
          />
        ),
      ]}
      onStepSubmit={handleStepSubmit}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          // Step 3: Check WASL Validity
          console.log("Step 3: Calling checkWaslValidity API...");
          const waslFormData = new FormData();
          waslFormData.append("user_id", profileData.id.toString());
          if (values.id) {
            waslFormData.append("identity_number", values.id);
          }
          if (values.dop) {
            waslFormData.append("date_of_birth", values.dop);
          }
          if (values.serialNumber) {
            waslFormData.append("sequence_number", values.serialNumber);
          }
          if (values.rightCharacter) {
            waslFormData.append("plate_letter_right", values.rightCharacter);
          }
          if (values.middleCaracter) {
            waslFormData.append("plate_letter_middle", values.middleCaracter);
          }
          if (values.leftCharacter) {
            waslFormData.append("plate_letter_left", values.leftCharacter);
          }
          if (values.carBoardType) {
            waslFormData.append("plate_number", values.carBoardType);
          }
          if (values.boardType) {
            waslFormData.append("plate_type", values.boardType.toString());
          }
          if (values.phone) {
            waslFormData.append("mobile", values.phone);
          }
          if (values.country_code) {
            waslFormData.append("country_code", values.country_code);
          }
          
          // Log WASL FormData contents for debugging
          console.log("Step 3 FormData contents:");
          Array.from(waslFormData.entries()).forEach(([key, value]) => {
            console.log(key + ': ' + value);
          });

          const waslResponse: any = await fetcherClient(
            "/drivers/checkWaslValidity",
            {
              method: "POST",
              body: waslFormData,
            }
          );

          console.log("checkWaslValidity Response:", waslResponse);

          if (waslResponse.success) {
            // WASL validation successful - update to step 4 and set status to active
            console.log("✓ WASL validation successful - updating to step 4 and status to active");

            const updateStepFormData = new FormData();
            updateStepFormData.append("user_id", profileData.id.toString());
            updateStepFormData.append("step", "4");
            updateStepFormData.append("status", "active");

            await fetcherClient("/drivers", {
              method: "POST",
              body: updateStepFormData,
            });

            console.log("✓ Step 3 completed successfully");
            console.log("=== All steps completed successfully! ===");
          } else {
            // WASL validation failed - stay at step 3 and set status to wasl_rejected
            console.log("✗ WASL validation failed - staying at step 3 and setting status to wasl_rejected");

            const updateStatusFormData = new FormData();
            updateStatusFormData.append("user_id", profileData.id.toString());
            updateStatusFormData.append("status", "wasl_rejected");

            await fetcherClient("/drivers", {
              method: "POST",
              body: updateStatusFormData,
            });
          }

          showResponseToast(waslResponse);

          // Close the form regardless of success or failure
          if (onClose) {
            onClose();
          }

          router.refresh();
        } catch (error: any) {
          console.error("❌ Error during WASL validation:", error);
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
