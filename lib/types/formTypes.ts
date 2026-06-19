export type TDriver = {
  image: File | null;
  name: string;
  gender: { label: string; value: string };
  mobile: string;
  country_code: string;
  phone: string;
  email: string;
  vehicleType: { label: string; value: string };
  vehicleModel: { label: string; value: string };
  vehicleColor: { label: string; value: string };
  seatsNumber: { label: string; value: string };
  rules: string[];
  importantAppointments: number;
};
export type Tfontas = {
  image: File | null;
  name: string;
  gender: { label: string; value: string };
  mobile: string;
  email: string;
  fontas_type: { label: string; value: string };
  fontas_unit_id: { label: string; value: string };
};
export type TLightTransportation = {
  image: File | null;
  name: string;
  gender: string;
  mobile: string;
  email: string;
  vehicleType: string;
  vehicleModel: string;
  numberOfCabins: string;
};
export type Twensh = {
  image: File | null;
  name: string;
  gender: string;
  mobile: string;
  email: string;
  type: string;
};
export type TDriversWithoutCar = {
  image: File | null;
  name: string;
  gender: { label: string; value: string };
  mobile: string;
  email: string;
};

export type TCompleteData = {
  image: File | null;
  imageDate: string;
  license: File | null;
  licenseDate: string;
  carForm: File | null;
  carFormDate: string;
  id: string;
  dop: string;
  mobile: string;
  email: string;
  boardType: string;
  serialNumber: string;
  carBoardType: string;
  rightCharacter: string;
  middleCaracter: string;
  leftCharacter: string;
};

export interface BasicFormValues {
  image: File | null;
  name: string;
  gender: string;
  mobile: string;
  email: string;
  country_code: string;
  phone: string;
  action?: number;
}
