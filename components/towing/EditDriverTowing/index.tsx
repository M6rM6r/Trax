/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import FormStepper from "../../shared/form/FormStepper";
import * as Yup from "yup";
import { fetcherClient } from "@/lib/fetcherClient";
import Step1 from "./Step1";
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
    Yup.object({}),
    Yup.object({
      image: Yup.mixed().nullable(),
      license: Yup.mixed().nullable(),
      carForm: Yup.mixed().nullable(),
    }),
    Yup.object({
      id: Yup.string()
        .matches(/^\d{10}$/, "رقم الهوية يجب ان يكون 10 ارقام")
        .matches(/^[12]/, "رقم الهوية يجب ان يبدأ بـ 1 أو 2")
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
    }),
  ];
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

  return (
    <FormStepper
      initialValues={{
        // step 1
        vehicleType: profileData.vehicle_data.brand_id,
        vehicleModel: profileData.vehicle_data.car_model_id,
        vehicleColor: profileData.vehicle_data.color_id,
        seatsNumber: profileData.vehicle_data.seats_number,
        rules: profileData.vehicle_data.rules,
        importantAppointments:
          profileData.vehicle_data.available_for_important_dates,
        // step 2
        front_side_identity: profileData.front_side_identity,
        imageDate: profileData.identity_number_expiration_date,
        front_side_license: profileData.front_side_license,

        licenseDate: profileData.driving_license_expiration_date,
        front_side_vehicle_form: profileData.front_side_vehicle_form,
        carFormDate: profileData.vehicle_form_expiration_date,
        // step 3
        id: profileData.identity_number,
        dop: profileData.date_of_birth,
        mobile: `+${profileData.country_code}${profileData.mobile}`,
        phone: profileData.mobile,
        country_code: profileData.country_code,
        email: profileData.email,
        boardType:
          profileData.vehicle_data.plate_type &&
          Number(profileData.vehicle_data.plate_type),
        serialNumber: profileData.vehicle_data.sequence_number,
        carBoardType: profileData.vehicle_data.plate_number,
        rightCharacter: profileData.vehicle_data.plate_letter_right,
        middleCaracter: profileData.vehicle_data.plate_letter_middle,
        leftCharacter: profileData.vehicle_data.plate_letter_left,
      }}
      validationSchemas={validationSchemas}
      labels={["بيانات الخدمة", "المستندات", "تعبئة البيانات!"]}
      steps={[
        (props) => <Step1 formikProps={props} />,
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
      onSubmit={async (values, { setSubmitting }) => {
        try {
          // Step 1: Set Service Data
          const serviceFormData = new FormData();
          serviceFormData.append("user_id", profileData.id.toString());
          serviceFormData.append("vehicle_type", "towing");
          serviceFormData.append("brand_id", values.vehicleType.toString());
          serviceFormData.append("car_model_id", values.vehicleModel.toString());
          serviceFormData.append("color_id", values.vehicleColor.toString());
          serviceFormData.append("seats_number", values.seatsNumber.toString());
          serviceFormData.append(
            "available_for_important_dates",
            values.importantAppointments.toString()
          );

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

          // Add rules
          if (values.rules.length > 0) {
            values.rules.forEach((rule: any) => {
              if (rule.is_assigned) {
                serviceFormData.append("rules[]", rule.id);
              }
            });
          }

          const serviceResponse: any = await fetcherClient(
            "/drivers/setService",
            {
              method: "POST",
              body: serviceFormData,
            }
          );

          if (!serviceResponse.success) {
            throw serviceResponse;
          }

          // Step 2: Update Documents
          const docsFormData = new FormData();
          docsFormData.append("user_id", profileData.id.toString());

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
            docsFormData.append(
              "identity_number_expiration_date",
              values.imageDate
            );
          }

          if (values.front_side_license && licenseFile) {
            docsFormData.append("front_side_license", licenseFile);
          }
          if (values.licenseDate) {
            docsFormData.append(
              "driving_license_expiration_date",
              values.licenseDate
            );
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

          const docsResponse: any = await fetcherClient(
            "/drivers/updateDocuments",
            {
              method: "POST",
              body: docsFormData,
            }
          );

          if (!docsResponse.success) {
            throw docsResponse;
          }

          // Step 3: Update remaining driver data
          const updateFormData = new FormData();
          updateFormData.append("identity_number", values.id);
          updateFormData.append("date_of_birth", values.dop);

          if (profileData.mobile !== values.phone) {
            updateFormData.append("mobile", values.phone);
            updateFormData.append("country_code", values.country_code);
          }

          if (values.email !== profileData.email) {
            updateFormData.append("email", values.email);
          }

          updateFormData.append("plate_type", values.boardType.toString());
          updateFormData.append("sequence_number", values.serialNumber);
          updateFormData.append("plate_number", values.carBoardType);
          updateFormData.append("plate_letter_right", values.rightCharacter);
          updateFormData.append("plate_letter_middle", values.middleCaracter);
          updateFormData.append("plate_letter_left", values.leftCharacter);
          updateFormData.append("_method", "put");

          const finalResponse: any = await fetcherClient(
            `/drivers/${profileData.id}`,
            {
              method: "PUT",
              body: updateFormData,
            }
          );

          // Step 4: Update to step 4 and set status to active
          const updateStepFormData = new FormData();
          updateStepFormData.append("user_id", profileData.id.toString());
          updateStepFormData.append("step", "4");
          updateStepFormData.append("status", "active");

          await fetcherClient("/drivers", {
            method: "POST",
            body: updateStepFormData,
          });

          showResponseToast(finalResponse);

          if (onClose) {
            onClose();
          }

          router.refresh();
        } catch (error: any) {
          showResponseToast(error.info || error);
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
};

export default Index;
