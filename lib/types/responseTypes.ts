/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ========================== global response start ==========================
interface Paginationdata {
  previous: null;
  next: string;
  current_page: number;
  per_page: number;
  total_pages: number;
  count: number;
  total_records: number;
}
// ========================== global response end ==========================

// ======================= login response start =======================
export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
}

export interface LoginData {
  user: AdminUser;
  token: string;
  pass_2fa?: boolean;
  has_multi_2fa?: boolean;
  "2fa_secret"?: string;
  method?: string;
  user_id?: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: Permission[];
  created_at: string;
  profile_image: string;
}

export interface Permission {
  id: number;
  permission: string;
  title: string;
  group: string;
}
// ======================= login response end =======================
// ========================== taxi response start ===========================
export interface TaxiResponse {
  success: boolean;
  message: string;
  data: TaxiData;
}

export interface TaxiData {
  records: TaxiRexord[];
  pagination_data: Paginationdata;
}

interface TaxiRexord {
  id: number;
  name: string;
  email: null | string;
  date_of_birth: null | string;
  gender: string;
  mobile: string;
  country_code: string;
  is_online: number;
  status: string;
  rating: number;
  otp_verified: number;
  is_active: boolean;
  step: number;
  last_seen: string;
  created_at: string;
  city: string;
  region: string;
  total_trips: number;
  wasl_status: boolean;
  nationalID: number;
  identity_number?: string;
  car_type: string;
  car_model: string;
  brand?: string;
  profile_image?: string;
  vehicle_type?: string;
  rides_count?: number;
  wallet_balance: number;
}
// ========================== taxi response end ===========================

// ============================= driver profile response start ======================
export interface DriverProfileResponse {
  success: boolean;
  message: string;
  data: DriverProfileComponentData;
}

export interface DriverProfileComponentData {
  driver: Driver;
}

export interface Driver {
  id: number;
  name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  profile_image: string;
  driving_license_number: string;
  driving_license_type: string;
  driving_license_expiration_date: string;
  front_side_license: null | string;
  front_side_identity: null | string;
  front_side_vehicle_form: null | string;
  mobile: string;
  country_code: string;
  identity_number: string;
  identity_number_expiration_date: null | string;
  is_online: number;
  status: string;
  rating: number;
  otp_verified: number;
  driver_without_car: number;
  latest_lat: string;
  latest_long: string;
  is_active: boolean;
  city: string;
  provider_id: null;
  provider_type: null;
  vehicle_form_expiration_date: null;
  step: number;
  last_seen: null;
  district_id: null;
  city_id: null;
  region_id: number;
  vehicle_data: Vehicledata;
  wallet: Wallet;
  bank_details: null;
  rides: Ride[];
  created_at: string;
  plate_type: string;
  plate_number: string;
  sequence_number: string;
  plate_letter_right: string;
  plate_letter_middle: string;
  plate_letter_left: string;
}

export interface Ride {
  id: number;
  pickup: Pickup | null;
  destination: Pickup;
  status_key: string;
  status: string;
  price: string;
  final_price: null;
  ride_distance: string;
  ride_duration: string;
  actual_ride_distance: null;
  actual_ride_duration: null;
  payment_method_key: string | null;
  payment_method: Paymentmethod | null;
  payment_status_key: string;
  payment_status: string;
  requested_at: string;
  start_at: null;
  end_at: null;
  has_active_requests: number;
  active_extra_hours_request: number;
  extra_hours: number;
  service_type_key: string;
  service_type: string;
  number_of_days: number;
  fontas_value_requested: null;
  is_now: boolean;
  customer_requested_to_complete: number;
  is_important_date: boolean;
  paid_at: null;
  customer: Customer;
  driver: TripDriver | null;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  rating: number;
  gender: Genders;
  profile_image: string | null;
}

interface TripDriver {
  id: number;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  rating: number;
  gender: Genders;
  profile_image: string | null;
}

interface Paymentmethod {
  title: string;
  logo: string;
}

interface Pickup {
  lat: number;
  long: number;
  address: string;
}

export interface Wallet {
  id: number;
  total_balance: number;
  withdrawal_balance: number;
  withdrawal_amount: number;
  transactions: {
    id: number;
    amount: number;
    type: string;
    payment_method: string;
    transaction_id: string;
    url: string;
    reference: null;
    is_active: number;
    created_at: string;
    refund_amount: number;
    refunded_at: string;
  }[];
  created_at: string;
}

interface Vehicledata {
  sequence_number: string;
  plate_number: string;
  plate_letter_right: string;
  plate_letter_middle: string;
  plate_letter_left: string;
  color_hex: string;
  color_name: string;
  brand: string;
  car_model: string;
  car_model_name: null;
  brand_name: null;
  plate_type: string;
  seats_number: number;
  wensh_type: null;
  wensh_type_key: null;
  light_transportation_type: null;
  light_transportation_type_key: null | string;
  available_for_important_dates: number;
  fontas_unit_id: null;
  vehicle_type: string;
  fontas_unit: Fontasunit;
  color_id: number;
  brand_id: number;
  car_model_id: number;
  rules: {
    id: number;
    title: string;
    description: string;
  }[];
}

interface Fontasunit {
  id: number;
  type: string;
  unit: string;
  value: number;
}

// ============================= outages analytics response start ======================
export interface OutageServiceAnalyticsData {
  pending: number;
  scheduled: number;
  accepted: number;
  driver_arrived: number;
  canceled_by_customer: number;
  canceled_by_driver: number;
  on_the_way: number;
  processing: number;
  done: number;
  canceled_automatically: number;
  total: number;
}

export interface OutagesAnalyticsData {
  fuel: OutageServiceAnalyticsData;
  tires: OutageServiceAnalyticsData;
  towing: OutageServiceAnalyticsData;
}

export interface OutagesAnalyticsResponse {
  success: boolean;
  message: string;
  data: OutagesAnalyticsData;
}
// ============================= outages analytics response end ======================

// ============================= driver profile response end ======================

// ================================== all enums start ===========================
export interface AllEnums {
  FileTypes: FileTypes;
  InfoPagesTypes: InfoPagesTypes;
  DriverStatus: DriverStatus;
  Genders: Genders;
  LocationsTypes: LocationsTypes;
  AppTypes: AppTypes;
  FontasTypes: FontasTypes;
  FontasUnits: FontasUnits;
  WenshTypes: WenshTypes;
  LightTransportationTypes: LightTransportationTypes;
  CarModelTypes: CarModelTypes;
  DiscountTypes: DiscountTypes;
  VehicleTypes: CarModelTypes;
  ServiceTypes: ServiceTypes;
  DrivingLicenseType: DrivingLicenseType;
  WithdrawPaymentMethods: WithdrawPaymentMethods;
  DepositPaymentMethods: DepositPaymentMethods;
  ModelMap: ModelMap;
  ModelsDDLMap: string[];
  RidePaymentMethods: RidePaymentMethods;
  attachmentTypes: AttachmentTypes;
  ComplaintAppTypes: {
    en: EnAndAr;
    ar: EnAndAr;
  };
  ComplaintableType: {
    en: EnAndAr;
    ar: EnAndAr;
  };
  ComplaintPriorites: {
    en: EnAndAr;
    ar: EnAndAr;
  };
  ComplaintSource: {
    en: EnAndAr;
    ar: EnAndAr;
  };
  RejectComplaintReasons: {
    en: EnAndAr;
    ar: EnAndAr;
  };
}
interface EnAndAr {
  [key: string]: string;
}
interface AttachmentTypes {
  en: En17;
  ar: En17;
}
interface En17 {
  image: string;
  video: string;
  audio: string;
}

interface RidePaymentMethods {
  en: En16;
  ar: En16;
}

interface En16 {
  cash: Stcpay;
  creditcard: Stcpay;
  applepay: Stcpay;
}

interface ModelMap {
  User: string;
  File: string;
  InfoPage: string;
  Review: string;
  Color: string;
  Brand: string;
  CarModel: string;
  FontasUnit: string;
  Rule: string;
  ServiceSetting: string;
  Permission: string;
}

interface DepositPaymentMethods {
  en: En15;
  ar: En15;
}

interface En15 {
  creditcard: Stcpay;
}

interface WithdrawPaymentMethods {
  en: En14;
  ar: En14;
}

interface En14 {
  stc_pay: Stcpay;
}

interface Stcpay {
  title: string;
  logo: string;
}

interface DrivingLicenseType {
  en: En13;
  ar: En13;
}

interface En13 {
  private_driver_license: string;
  public_driver_license: string;
  motorcycle_driver_license: string;
  heavy_equipment_driver_license: string;
  temporary_driver_license: string;
  private_driver_license_foreigners: string;
  heavy_transport_driver_license: string;
}

interface ServiceTypes {
  en: En12;
  ar: En12;
}

interface En12 {
  taxi: string;
  fontas: string;
  wensh: string;
  light_transportation: string;
  driver_without_car: string;
  important_dates: string;
}

interface DiscountTypes {
  en: En11;
  ar: En11;
}

interface En11 {
  percentage: string;
  amount: string;
}

interface CarModelTypes {
  en: En10;
  ar: En10;
}

interface En10 {
  fontas: string;
  light_transportation: string;
  taxi: string;
  wensh: string;
}

interface LightTransportationTypes {
  en: En9;
  ar: En9;
}

interface En9 {
  single_cabin: string;
  double_cabin: string;
}

interface WenshTypes {
  en: En8;
  ar: En8;
}

interface En8 {
  hydraulic: string;
  basic: string;
  fork: string;
}

interface FontasUnits {
  en: En7;
  ar: En7;
}

interface En7 {
  ton: string;
  gallon: string;
  [key: string]: string;
}

interface FontasTypes {
  en: En6;
  ar: En6;
}

interface En6 {
  valid: string;
  invalid: string;
  [key: string]: string;
}
interface AppTypes {
  en: En5;
  ar: En5;
}
interface En5 {
  driver_app: string;
  customer_app: string;
}
interface LocationsTypes {
  en: En4;
  ar: En4;
}
interface En4 {
  pickup: string;
  destination: string;
  point: string;
}
export interface Genders {
  en: En3;
  ar: En3;
}
interface En3 {
  male: string;
  female: string;
}
interface DriverStatus {
  en: En2;
  ar: En2;
}
interface En2 {
  pending: string;
  suspended: string;
  wasl_pending: string;
  wasl_accepted: string;
  wasl_rejected: string;
  active: string;
}
export interface InfoPagesTypes {
  en: En;
  ar: En;
}
interface En {
  "on-boarding": string;
  "privacy-policy": string;
  "terms-conditions": string;
  faq: string;
}
interface FileTypes {
  pdf: string;
  jpeg: string;
  jpg: string;
  png: string;
  gif: string;
  svg: string;
  doc: string;
  docx: string;
  xls: string;
  xlsx: string;
  ppt: string;
  pptx: string;
  txt: string;
  heic: string;
  HEIC: string;
  "": string;
}
// ================================== all enums end ===========================

// ====================================== color model start ========================
export interface ColorModelResponse {
  success: boolean;
  message: string;
  data: ColorModelData;
}
interface ColorModelData {
  records: ColorModelRecord[];
}
interface ColorModelRecord {
  id: number;
  name_en: string;
  name_ar: string;
  hex: string;
  is_active: number;
  deleted_at: null;
  created_at: string;
  updated_at: string;
}
// ====================================== color model end ========================
// ========================================= car model model start =================
export interface CarModelResponse {
  success: boolean;
  message: string;
  data: CarModelDate;
}
interface CarModelDate {
  records: CarModelRecord[];
}
interface CarModelRecord {
  id: number;
  name_en: string;
  name_ar: string;
  brand_id: number;
  type: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}
// ========================================= car model model end =================
// =========================================== rule model start ======================
export interface RuleModelResponse {
  success: boolean;
  message: string;
  data: RuleModelData;
}
interface RuleModelData {
  records: RuleModelRecord[];
}
interface RuleModelRecord {
  id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}
// =========================================== rule model end ======================

// ======================================== brand model start =======================
export interface BrandModelResponse {
  success: boolean;
  message: string;
  data: BrandModelData;
}
interface BrandModelData {
  records: BrandModelRecord[];
}
interface BrandModelRecord {
  id: number;
  name_en: string;
  name_ar: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}
// ======================================== brand model end =======================

// =========================================== home stats response Start ====================

export interface TotalActiveDriversResponse {
  success: boolean;
  data: {
    total_active_drivers: number;
  };
}

export interface TotalFaultsDrivers {
  success: boolean;
  data: {
    fuel_active_drivers: number;
    tires_active_drivers: number;
    towing_active_drivers: number;
  };
}

export interface TotalMainServicesResponse {
  success: boolean;
  data: {
    total_active_taxi_drivers: number;
    total_active_fontas_drivers: number;
    total_active_light_transportation_drivers: number;
    total_active_wensh_drivers: number;
    total_with_out_cars_drivers: number;
    total_active_important_dates_drivers: number;
  };
}

export interface TotalActiveCustomersResponse {
  success: boolean;
  data: {
    total_active_customers: number;
    total_services: number;
  };
}

export interface TotalActiveUsersResponse {
  success: boolean;
  message: string;
  data: {
    total_drivers: number;
    total_customers: number;
    customers_with_no_location: number;
  };
}
// =========================================== home stats response End ====================

// =========================================== customers response Start ====================
export interface CustomersResponse {
  success: boolean;
  message: string;
  data: CustomersData;
}
interface CustomersData {
  records: CustomersRecord[];
  pagination_data: Paginationdata;
}
interface CustomersRecord {
  id: number;
  name: string;
  email: null | string;
  mobile: string;
  gender: string;
  country_code: string;
  is_active: boolean;
  profile_image: null;
  created_at: string;
}
// =========================================== customers response End ====================
// ============================================= customer profile response start ======================
export interface CustomerProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfileData;
}
interface CustomerProfileData {
  customer: Customerr;
}
interface Customerr {
  id: number;
  name: string;
  email: string;
  mobile: string;
  gender: string;
  profile_image: string;
  country_code: string;
  rating: number;
  otp_verified: number;
  is_active: boolean;
  rides: CustomerRide[];
  wallet: Wallet;
  bank_details: null;
  created_at: string;
  rides_count: number;
  rides_amount: number;
}

export interface CustomerRide {
  id: number;

  pickup: {
    lat: number;
    long: number;
    address: string;
  };

  destination: {
    lat: number;
    long: number;
    address: string;
  };

  status_key: string;
  status: string;

  price: number;
  final_price: number | null;

  required_cash_payment: string | number;
  ride_distance: string | number;
  ride_duration: string | number;

  time_label: string;
  distance_label: string;

  actual_ride_distance: number | null;
  actual_ride_duration: number | null;

  paid_by_wallet_amount: number;
  pay_with_wallet: boolean;

  payment_method_key: string;

  payment_method: {
    title: string;
    logo: string;
  } | null;

  payment_status_key: string;
  payment_status: string;

  requested_at: string; // datetime string
  start_at: string | null;
  end_at: string | null;

  has_active_requests: number;
  active_extra_hours_request: number;
  extra_hours: number;

  did_customer_review: boolean;
  customer_rating: number | null;
  customer_comment: string | null;
  review_tags: string[] | null;

  service_type_key: string;
  service_type: string;

  number_of_days: number | null;

  fontas_value_requested: number | null;
  fontas_unit: string | null;

  is_now: boolean;

  driver_gender: "male" | "female" | "any";

  customer_requested_to_complete: number;

  is_important_date: boolean;

  payment_security_code: string | null;

  paid_at: string | null;
  requested_payment_at: string | null;

  extra_hours_payment_method: string | null;

  should_pay: number;

  stc_pay_mobile: string | null;
  extra_hours_stc_pay_mobile: string | null;

  extra_hours_pay_with_wallet: number;

  price_change: number | null;

  price_change_payment_method_key: string | null;
  price_change_payment_method: string | null;

  price_change_payment_status_key: string | null;
  price_change_payment_status: string | null;

  to_be_paid: number | null;

  driver: any | null; // Unknown structure → keep as any
  vehicle_data: Vehicledata;

  url: string | null;
  beneficiary: string | null;

  vehicle_preference: any | null;
  cargo_details: any | null;
  service_details: any | null;

  waiting_approve: boolean;
  payment_processing: boolean;
}

// ============================================= customer profile response end ======================
export interface RolesResponse {
  success: boolean;
  message: string;
  data: RolesData;
}
interface RolesData {
  records: RolesRecord[];
  pagination_data: Paginationdata;
}
interface RolesRecord {
  id: number;
  title_en: string;
  title_ar: string;
  created_at: string;
}
export interface RoleResponse {
  success: boolean;
  message: string;
  data: RoleData;
}
interface RoleData {
  role: {
    id: number;
    title_en: string;
    title_ar: string;
    permissions: RolePermission[];
    created_at: string;
  };
}
interface RolePermission {
  id: number;
  permission: string;
  title: string;
  group: string;
}
export interface UsersResponse {
  success: boolean;
  message: string;
  data: UserData;
}
interface UserData {
  records: UserRecord[];
  pagination_data: Paginationdata;
}
interface UserRecord {
  id: number;
  name: string;
  email: string;
  created_at: string;
}
export interface UserResponse {
  success: boolean;
  message: string;
  data: UserData;
}
interface UserData {
  user: {
    id: number;
    name: string;
    email: string;
    permissions: UserPermission[];
    created_at: string;
  };
}
interface UserPermission {
  id: number;
  permission: string;
  title: string;
  group: string;
}

export interface RulesResponse {
  success: boolean;
  message: string;
  data: RulesData;
}

interface RulesData {
  records: RulesRecord[];
  pagination_data: Paginationdata;
}

export interface RulesRecord {
  id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  is_active: number;
  created_at: string;
}
export interface RuleResponse {
  success: boolean;
  message: string;
  data: RuleData;
}

interface RuleData {
  rule: Rule;
}

interface Rule {
  id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  is_active: number;
  created_at: string;
}

export interface BrandsResponse {
  success: boolean;
  message: string;
  data: BrandsData;
}

interface BrandsData {
  records: BrandsRecord[];
  pagination_data: Paginationdata;
}

export interface BrandsRecord {
  id: number;
  name_en: string;
  name_ar: string;
  is_active: number;
  created_at: string;
}

export interface BrandResponse {
  success: boolean;
  message: string;
  data: BrandData;
}

interface BrandData {
  brand: Brand;
}

interface Brand {
  id: number;
  name_en: string;
  name_ar: string;
  is_active: number;
  car_models: Carmodel[];
  created_at: string;
}

interface Carmodel {
  id: number;
  name_en: string;
  name_ar: string;
  brand_id: number;
  type: string;
  is_active: number;
  created_at: string;
}

export interface ModelsResponse {
  success: boolean;
  message: string;
  data: ModelData;
}

interface ModelData {
  records: ModelRecord[];
  pagination_data: Paginationdata;
}

export interface ModelRecord {
  id: number;
  name_en: string;
  name_ar: string;
  brand_id: number;
  brand: Brand;
  type: string;
  is_active: number;
  created_at: string;
}
export interface ModelResponse {
  success: boolean;
  message: string;
  data: ModelData;
}

interface ModelData {
  car_model: Carmodel;
}

interface Carmodel {
  id: number;
  name_en: string;
  name_ar: string;
  brand: Brand;
  type: string;
  is_active: number;
  created_at: string;
}

interface Brand {
  id: number;
  name_en: string;
  name_ar: string;
}
export interface UnitsResponse {
  success: boolean;
  message: string;
  data: UnitsData;
}

export interface UnitsData {
  records: UnitsRecord[];
  pagination_data: Paginationdata;
}

export interface UnitsRecord {
  id: number;
  type: string;
  unit: string;
  value: number;
  basic_price: number;
  is_active: number;
  active_drivers_count: number;
  created_at: string;
}
export interface UnitResponse {
  success: boolean;
  message: string;
  data: UnitData;
}

interface UnitData {
  fontas_unit: Fontasunit;
}

interface Fontasunit {
  id: number;
  type: string;
  unit: string;
  value: number;
  basic_price: number;
  is_active: number;
  active_drivers_count: number;
  created_at: string;
}
export interface ColorsResponse {
  success: boolean;
  message: string;
  data: ColorsData;
}

interface ColorsData {
  records: ColorsRecord[];
  pagination_data: Paginationdata;
}
export interface ColorsRecord {
  id: number;
  name_en: string;
  name_ar: string;
  hex: string;
  is_active: number;
  created_at: string;
}

export interface ColorResponse {
  success: boolean;
  message: string;
  data: ColorData;
}

interface ColorData {
  color: Color;
}

export interface Color {
  id: number;
  name_en: string;
  name_ar: string;
  hex: string;
  is_active: number;
  created_at: string;
}
export interface ServiceSettingsResponse {
  success: boolean;
  message: string;
  data: ServiceSettingsData[];
}

export interface ServiceSettingsData {
  id: number;
  service_type: string;
  service_subtype: null | string;
  key: string;
  value: number | string;
}

export interface RegionsResponse {
  success: boolean;
  message: string;
  data: RegionsData[];
}

export interface RegionsData {
  id: number;
  name: string;
  settings: Setting | Settings2 | Settings3 | Settings4 | null;
}

interface Settings4 {
  wensh: Wensh;
  light_transportation: Lighttransportation;
  driver_without_car: Driverwithoutcar4;
  taxi: Taxi;
  fontas: Fontas;
  important_dates: Importantdates;
  "": _;
}

interface _ {
  is_default: number;
}

interface Driverwithoutcar4 {
  time_period: string;
  is_default: number;
  time_period_interval: string;
  price_per_time_period: string;
  driver_percentage: number;
  is_hidden: string;
  is_coming_soon: string;
  waiting_cost: string;
  cancellation_cost: string;
  app_percentage: string;
  city_id: string;
}

interface Settings3 {
  wensh: Wensh2;
  light_transportation: Lighttransportation2;
  driver_without_car: Driverwithoutcar3;
  taxi: Taxi;
  fontas: Fontas;
  important_dates: Importantdates2;
}

interface Driverwithoutcar3 {
  time_period: string;
  is_default: number;
  time_period_interval: string;
  price_per_time_period: string;
  driver_percentage: number;
  is_hidden: string;
  is_coming_soon: string;
  waiting_cost: string;
  cancellation_cost: string;
  app_percentage: string;
  city_id: string;
  order: number;
}

interface Settings2 {
  wensh: Wensh2;
  light_transportation: Lighttransportation2;
  driver_without_car: Driverwithoutcar2;
  taxi: Taxi;
  fontas: Fontas;
  important_dates: Importantdates2;
}

interface Importantdates2 {
  cancellation_cost: string;
  is_default: number;
  waiting_cost: string;
  is_coming_soon: string;
  is_hidden: string;
  driver_percentage: string;
  additional_time_interval: string;
  additional_time_price: string;
  base_price: string;
  basic_time: string;
  basic_time_interval: string;
  app_percentage: number;
  order: number;
}

interface Driverwithoutcar2 {
  time_period: string;
  is_default: number;
  time_period_interval: string;
  price_per_time_period: string;
  driver_percentage: number;
  is_hidden: string;
  is_coming_soon: string;
  waiting_cost: string;
  cancellation_cost: string;
  app_percentage: string;
  order: number;
}

interface Lighttransportation2 {
  double_cabin: Fork;
  single_cabin: Singlecabin;
  is_coming_soon: number;
  is_hidden: number;
  price_per_km: number;
  price_per_minute: number;
  base_price: number;
  minimum_charge: number;
  waiting_cost: number;
  cancellation_cost: number;
  driver_percentage: number;
  is_default: number;
  order: number;
}

interface Wensh2 {
  fork: Fork;
  basic: Basic;
  hydraulic: Fork;
  cancellation_cost: string;
  is_default: number;
  waiting_cost: string;
  is_hidden: string;
  is_coming_soon: string;
  base_price: string;
  minimum_charge: string;
  driver_percentage: string;
  price_per_minute: string;
  price_per_km: string;
  app_percentage: number;
  order: number;
}

interface Setting {
  wensh: Wensh;
  light_transportation: Lighttransportation;
  driver_without_car: Driverwithoutcar;
  taxi: Taxi;
  fontas: Fontas;
  important_dates: Importantdates;
}

interface Importantdates {
  cancellation_cost: string;
  is_default: number;
  is_hidden: string;
  is_coming_soon: string;
  waiting_cost: string;
  driver_percentage: string;
  additional_time_price: string;
  additional_time_interval: string;
  base_price: string;
  basic_time_interval: string;
  basic_time: string;
  app_percentage: number;
}

interface Fontas {
  "0": _0;
  "1": _1;
  "2": _1;
  "3": _1;
  "4": _1;
  "5": _1;
  "6": _1;
  "14": _14;
  "15": _14;
  "16": _14;
  base_price: string;
  is_default: number;
  price_per_minute: string;
  price_per_km: string;
  free_km: string;
  minimum_charge: string;
  driver_percentage: string;
  is_hidden: string;
  is_coming_soon: string;
  waiting_cost: string;
  cancellation_cost: string;
  app_percentage: string;
  city_id: string;
  order: number;
}

interface _14 {
  base_price: string;
}

interface _1 {
  base_price: string;
  is_default: number;
}

interface _0 {
  base_price: number;
  is_default: number;
}

interface Taxi {
  is_coming_soon: string;
  is_hidden: string;
  price_per_km: string;
  price_per_minute: string;
  base_price: string;
  minimum_charge: string;
  waiting_cost: string;
  cancellation_cost: string;
  driver_percentage: number;
  is_default: number;
  app_percentage: string;
  order: number;
  city_id: string;
}

interface Driverwithoutcar {
  time_period: string;
  is_default: number;
  time_period_interval: string;
  price_per_time_period: string;
  driver_percentage: number;
  is_hidden: string;
  is_coming_soon: string;
  waiting_cost: string;
  cancellation_cost: string;
  app_percentage: string;
}

interface Lighttransportation {
  double_cabin: Fork;
  single_cabin: Singlecabin;
  is_coming_soon: number;
  is_hidden: number;
  price_per_km: number;
  price_per_minute: number;
  base_price: number;
  minimum_charge: number;
  waiting_cost: number;
  cancellation_cost: number;
  driver_percentage: number;
  is_default: number;
}

interface Singlecabin {
  is_coming_soon: string;
  is_default: number;
  is_hidden: string;
  price_per_km: string;
  price_per_minute: string;
  base_price: string;
  minimum_charge: string;
  waiting_cost: string;
  cancellation_cost: string;
  city_id: string;
}

interface Wensh {
  fork: Fork;
  basic: Basic;
  hydraulic: Fork;
  waiting_cost: string;
  is_default: number;
  cancellation_cost: string;
  is_coming_soon: string;
  is_hidden: string;
  base_price: string;
  minimum_charge: string;
  driver_percentage: string;
  price_per_minute: string;
  price_per_km: string;
  app_percentage: number;
}

interface Basic {
  cancellation_cost: string;
  is_default: number;
  waiting_cost: string;
  is_hidden: string;
  is_coming_soon: string;
  minimum_charge: string;
  base_price: string;
  driver_percentage: string;
  price_per_km: string;
  price_per_minute: string;
}

interface Fork {
  is_coming_soon: string;
  is_hidden: string;
  price_per_km: string;
  price_per_minute: string;
  base_price: string;
  minimum_charge: string;
  waiting_cost: string;
  cancellation_cost: string;
  is_default: number;
}

export interface PeakTimesResponse {
  success: boolean;
  message: string;
  data: PeakTimeData[];
}

export interface PeakTimeData {
  day: string;
  translated_day: string;
  start_time: string;
  end_time: string;
  zone_id: number;
  id: number;
  price_per_km: string;
  price_per_minute: string;
  base_price: string;
  minimum_charge: string;
  cancellation_cost: string;
  waiting_cost: string;
  free_km?: string;
  cancellation_time?: string;
}

export interface EnumDDLResponse {
  success: boolean;
  message: string;
  data: EnumDDLData;
}

export interface EnumDDLData {
  records: {
    key: string;
    value: string;
  }[];
}

export interface LabelsResponse {
  success: boolean;
  message: string;
  data: LabelsData;
}
export interface LabelsData {
  records: LabelsRecord[];
  pagination_data: Paginationdata;
}
export interface LabelsRecord {
  id: number;
  title_en: string;
  title_ar: string;
  is_active: number;
  description_ar: string;
  description_en: string;
  color: string;
  created_at: string;
}
export interface LabelResponse {
  success: boolean;
  message: string;
  data: LabelData;
}

interface LabelData {
  label: LabelsRecord;
}

export interface LogsResponse {
  success: boolean;
  message: string;
  data: LogsData;
}

interface LogsData {
  records: LogsRecord[];
  pagination_data: Paginationdata;
}

export interface LogsRecord {
  id: number;
  route_name: string;
  url: string;
  method: string;
  user_id: null;
  ip: string;
  user_agent: string;
  model: string;
  model_id: number;
  created_at: string;
}

export type NotificationType =
  | "SMS"
  | "REGISTERATION"
  | "TAXI"
  | "WENSH"
  | "FONTAS"
  | "LIGHT_TRANSPORTATION"
  | "DRIVER_WITHOUT_CAR"
  | "IMPORTANT_DATES";

export const ServiceTypesAr = {
  sms: "رسالة عبر الهاتف",
  registeration: "إشعار تسجيل الدخول",
  taxi: "زيم ركاب",
  fontas: "وايت ماء",
  wensh: "سطحات",
  light_transportation: "النقل الخفيف",
  driver_without_car: "سائق بدون سيارة",
  important_dates: "أجتماعات ومواعيد مهمة",
} as const;

export enum RidePaymentMethodsEnum {
  CASH = "cash",
  CREDIT_CARD = "creditcard",
  STC_PAY = "stcpay",
  APPLE_PAY = "applepay",
}
// Type for keys
export type ServiceTypeKey = keyof typeof ServiceTypesAr;

// Type for values (Arabic names)
export type ServiceTypeValue = (typeof ServiceTypesAr)[ServiceTypeKey];

export interface NotificationResponse {
  success: boolean;
  message?: string;
  data: {
    records: NotificationRecord[];
  };
}

export interface NotificationRecord {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  channel: string;
  type: NotificationType;
  isActive: boolean;
}

export interface LogResponse {
  success: boolean;
  message: string;
  data: LogData;
}

interface LogData {
  activity_log: Activitylog;
}

interface Activitylog {
  id: number;
  route_name: string;
  url: string;
  method: string;
  user_id: number;
  user_name: string;
  ip: string;
  user_agent: string;
  model: string;
  model_id: number;
  request_body: Requestbody;
  old_data: null;
  created_at: string;
}

interface Requestbody {
  day: string;
  zone_id: null;
}

export interface PagesResponse {
  success: boolean;
  message: string;
  data: PagesData;
}

interface PagesData {
  records: PagesRecord[];
  pagination_data: Paginationdata;
}
export interface PagesRecord {
  id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  type: string;
  order: number;
  app: string;
  is_active: number;
  created_at: string;
}

export interface PageResponse {
  success: boolean;
  message: string;
  data: PageData;
}

interface PageData {
  info_page: Infopage;
}

interface Infopage {
  id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  type: string;
  order: number;
  app: string;
  is_active: number;
  files: any[];
  created_at: string;
}

export interface BannersResponse {
  success: boolean;
  message: string;
  data: BannersData;
}

interface BannersData {
  records: BannersRecord[];
  pagination_data: Paginationdata;
}
export interface BannersRecord {
  id: number;
  order: number;
  title_en: string;
  title_ar: string;
  target_url: string;
  banner_en: string;
  banner_ar: string;
  app: string;
  is_active: number;
  created_at: string;
}

export interface BannerResponse {
  success: boolean;
  message: string;
  data: BannerData;
}

interface BannerData {
  banner: Banner;
}

interface Banner {
  id: number;
  order: number;
  title_en: string;
  title_ar: string;
  target_url: string;
  app: string;
  banner_en: string;
  banner_ar: string;
  is_active: number;
  created_at: string;
}

export interface TeamsResponse {
  success: boolean;
  message: string;
  data: TeamsData;
}

interface TeamsData {
  records: TeamsRecord[];
  pagination_data: Paginationdata;
}
export interface TeamsRecord {
  id: number;
  title_en: string;
  title_ar: string;
  is_active: null;
  members_count: number;
  created_at: string;
}

export interface DDLListForUserResponse {
  success: boolean;
  message: string;
  data: DDLListForUserData;
}

interface DDLListForUserData {
  records: DDLListForUserRecord[];
}

export interface DDLListForUserRecord {
  id: number;
  name: string;
  email: string;
  email_verified_at: null;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  profile_image: null;
}
export interface DDLListForCategoryResponse {
  success: boolean;
  message: string;
  data: DDLListForCategoryData;
}

interface DDLListForCategoryData {
  records: DDLListForCategoryRecord[];
}

interface DDLListForCategoryRecord {
  id: number;
  title_en: string;
  title_ar: string;
  is_active: number;
  parent_id: null;
  deleted_at: null;
  created_at: string;
  updated_at: string;
  description_en: null;
  description_ar: null;
  services: null;
  app: null;
  attachments_types: null;
  ride_related: boolean;
}

export interface TeamResponse {
  success: boolean;
  message: string;
  data: TeamData;
}

interface TeamData {
  team: Team;
}

interface Team {
  id: number;
  title_en: string;
  title_ar: string;
  is_active: number;
  members_count: number;
  categories: Category[];
  members: Member[];
  manager: Manager;
  created_at: string;
}

interface Manager {
  id: number;
  name: string;
  email: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  is_manager: number;
}

interface Category {
  id: number;
  title_en: string;
  title_ar: string;
  is_active: number;
  parent_id: null;
  complaints_count: number;
  complaint_types: number;
  created_at: string;
}
export interface ActionsResponse {
  success: boolean;
  message: string;
  data: ActionsData;
}

interface ActionsData {
  records: ActionsRecord[];
  pagination_data: Paginationdata;
}

export interface ActionsRecord {
  id: number;
  name_en: string;
  name_ar: string;
  is_active: number;
  created_at: string;
  type: string;
}
export interface ActionResponse {
  success: boolean;
  message: string;
  data: ActionData;
}

interface ActionData {
  disciplinary_action: Disciplinaryaction;
}

export interface Disciplinaryaction {
  id: number;
  name_en: string;
  name_ar: string;
  is_active: number;
  created_at: string;
  type: string;
}
export interface ComplaintCategoriesResponse {
  success: boolean;
  message: string;
  data: ComplaintCategoriesData;
}

interface ComplaintCategoriesData {
  records: ComplaintCategoryRecord[];
  pagination_data: Paginationdata;
}
export interface ComplaintCategoryRecord {
  id: number;
  title_en: string;
  title_ar: string;
  is_active: number;
  parent_id: null;
  complaints_count: number;
  complaint_types: number;
  app: {
    key: string;
    label: string;
  }[];
  created_at: string;
}
export interface ComplaintCategoryResponse {
  success: boolean;
  message: string;
  data: ComplaintCategoryData;
}

interface ComplaintCategoryData {
  complaint_category: Complaintcategory;
}

interface Complaintcategory {
  id: number;
  title_en: string;
  title_ar: string;
  description_en: null | string;
  description_ar: null | string;
  services: null | string[];
  app: null | string[];
  ride_related: boolean;
  team: {
    id: number;
    title_en: string;
    title_ar: string;
  }[];
  is_active: number;
  parent_id: null | number;
  complaints_count: number;
  subcategories_count: number;
  subcategories: SubCategoryData[];
  displinaryActions: [
    {
      id: number;
      name_en: string;
      name_ar: string;
      is_active: number;
      created_at: string;
    }
  ];
  created_at: string;
  attachments_types: null | string[];
}
export interface SubCategoryData {
  id: number;
  title_en: string;
  title_ar: string;
  is_active: number;
  parent_id: number;
  complaints_count: number;
  complaint_types: number;
  app: {
    key: string;
    label: string;
  }[];
  created_at: string;
}

export interface clientsResponse {
  success: boolean;
  message: string;
  data: ClientsData;
}

interface ClientsData {
  records: ClientsRecord[];
  pagination_data: Paginationdata;
}
export interface ClientsRecord {
  id: number;
  type: string;
  label: string;
  name: string;
  email: null | string;
  phone: string;
  country_code: string;
  created_at: string;
  complaints_count: number;
  is_active: boolean;
}
export interface ClientResponse {
  success: boolean;
  message: string;
  data: ClientData[];
}

export interface ClientData {
  id: number;
  against: Against;
  role: string;
  assigned_to: Assignedto;
  category: Category;
  team: null | number;
  status: Status;
  priority: Status;
  created_at: string;
}

interface Status {
  key: string;
  label: string;
}

interface Category {
  id: number;
  name_en: string;
  name_ar: string;
}

interface Assignedto {
  id: null;
  name: null;
}

interface Against {
  name: string;
  type: string;
  rating: number;
  image: string;
}

export interface complaintsResponse {
  success: boolean;
  message: string;
  data: ComplaintsData;
}

interface ComplaintsData {
  records: ComplaintsRecord[];
  pagination_data: Paginationdata;
}

export interface ComplaintsRecord {
  id: number;
  against: Against;
  assigned_to: Assignedto;
  category: Category;
  team: number;
  status: Status;
  priority: Status;
  created_at: string;
}

interface Status {
  key: string;
  label: string;
}

interface Category {
  id: number;
  name_en: string;
  name_ar: string;
}

interface Assignedto {
  id: null;
  name: null;
}

interface Against {
  name: string;
  type: string;
  rating: number;
  image: string;
}

export interface ComplaintResponse {
  success: boolean;
  message: string;
  data: ComplaintData;
}

interface ComplaintData {
  complaint: Complaint;
}

export interface Complaint {
  id: number;
  opened_since_days: number;
  status: Status;
  priority: Status;
  category: {
    id: number;
    name_en: string;
    name_ar: string;
    parent_id: number;
    parent_name_en: string;
    parent_name_ar: string;
  };
  description: null;
  notes: Note[];
  complaint_source: Status;
  links: any[];
  against: Against;
  assigned_to: Assignedto;
  complainant: Complainant;
  files: File[];
  team: {
    id: number;
    name: string;
    email: string;
    is_manager: number;
  }[];
  ride: {
    id: number;
    status: string;
    pickup: Pickup;
    destination: Pickup;
    ride_date: string;
    price: string;
    final_price: string;
    vehicle: string;
    plate_number: string;
    plate_letter_right: string;
    plate_letter_middle: string;
    plate_letter_left: string;
    color_hex: null;
    color_name: null;
    brand: null;
    car_model: null;
    brand_name: null;
    plate_type: string;
    seats_number: null;
  };
  history: ComplaintHistory[];
  actions: Action[];
  created_at: string;
}

export interface Action {
  id: number;
  procedure_type: string;
  note: string;
  user_id: number;
  complaint_id: number;
  disciplinary_action: {
    id: number;
    name_en: string;
    name_ar: string;
    slug: string;
  };
  duration: null;
  amount: string;
  reason: string | null;
  customerable_type: string;
  customerable_id: number;
  created_at: string;
}

export interface ComplaintHistory {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface Pickup {
  lat: number;
  long: number;
  address: string;
}

interface File {
  id: number;
  name: string;
}

interface Complainant {
  id: number;
  name: string;
  type: string;
  key: string;
  gender: string;
  rating: number;
  image: null | string;
  phone: string;
}

interface Assignedto {
  id: null;
  name: null;
  email: null;
  team: number;
  team_name_en: string;
  team_name_ar: string;
}

interface Against {
  id: number;
  name: string;
  type: string;
  key: string;
  rating: number;
  image: string;
  gender: string;
  phone: string;
}

export interface Note {
  id: number;
  user: User;
  note: string;
  replies: Reply[];
  complaint_id: number;
  created_at: string;
}

interface Reply {
  id: number;
  user: User;
  note: string;
  replies: any[];
  complaint_id: number;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  type: string;
}
interface Status {
  key: string;
  label: string;
}
export interface ListLightTransportationCargo {
  success: boolean;
  message: string;
  data: Data;
}

export interface Data {
  records: Record[];
  pagination_data: PaginationData;
}

export interface PaginationData {
  previous: null;
  next: null;
  current_page: number;
  per_page: number;
  total_pages: number;
  count: number;
  total_records: number;
}

export interface Record {
  id: number;
  name_ar: string;
  name_en: string;
  cargo_type: string;
  cargo_type_key: string;
  icon: null | string;
  is_active: number;
  created_at: string;
}

export interface ShowLightTransportationCargo {
  success: boolean;
  message: string;
  data: Data;
}

export interface Data {
  light_transportation_cargo: LightTransportationCargo;
}

export interface LightTransportationCargo {
  id: number;
  name_ar: string;
  name_en: string;
  cargo_type: string;
  cargo_type_key: string;
  is_active: number;
  icon: null;
  details: Details[];
  created_at: string;
}

export interface Details {
  unit: string;
  free_limit: number;
  price_per_unit: string;
  deleted_at: null;
  full_basin_price: string;
  half_basin_price: string;
  basin_size: string;
}

export interface CargoTypes {
  success: boolean;
  message: string;
  data: Data;
}

export interface Data {
  records: Record[];
}

export interface Record {
  key: string;
  value: string;
}

// Referral Statistics
export interface ReferralStatistics {
  success: boolean;
  message: string;
  data: Data;
}

export interface Data {
  general_stats: GeneralStats;
  drivers_stats: ErsStats;
  customers_stats: ErsStats;
  customer_to_customer_stats: ErStats;
  customer_to_driver_stats: ErStats;
  driver_to_customer_stats: ErStats;
  driver_to_driver_stats: ErStats;
}

export interface ErStats {
  total_invites: number;
  success_rate: string;
  transfer_rate: string;
  total_rewards: number;
  total_withdrawals: number;
}

export interface ErsStats {
  total_referrer_customers: number;
  total_invites_sent: number;
  total_rewarded_users: number;
  success_rate: string;
  total_drivers_rewards: number;
  total_drivers_withdrawals: number;
}

export interface GeneralStats {
  total_invites_sent: number;
  total_successfull_invites: number;
  transfer_rate: string;
  total_rewards: number;
  total_withdrawals: number;
  total_pending_price: number;
}
export interface FuelsToolsResponse {
  success: boolean;
  message: string;
  data: FuelsToolsData;
}

export interface FuelsToolsData {
  records: FuelsToolsRecord[];
  pagination_data: Paginationdata;
}

export interface FuelsToolsRecord {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  service_id: number;
  image: string;
  created_at: string;
}
export interface FuelsOrdersResponse {
  success: boolean;
  message: string;
  data: FuelsOrdersData;
}

interface FuelsOrdersData {
  records: FuelsOrdersRecord[];
  pagination_data: Paginationdata;
}
export interface FuelsOrdersRecord {
  id: number;
  driver: Driver;
  status: string;
  is_online: number;
  created_at: string;
}
export interface FuelOrderResponse {
  success: boolean;
  message: string;
  data: FuelOrderData;
}

interface FuelOrderData {
  message: Message;
}

interface Message {
  id: number;
  driver: Driver;
  tools: Tool2[];
  status: string;
  created_at: string;
}

interface Tool2 {
  id: number;
  tool: Tool;
  status: string;
  rejection_reason: null;
  created_at: string;
}

interface Tool {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  service: Service;
  image: string;
  created_at: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  service_name: string;
  status: null;
  status_text: null;
  service_image: string;
  is_online: number;
}

interface Rule {
  id: number;
  title: string;
  description: string;
  is_assigned: boolean;
}

interface Fontasunit {}

// =========================================== Cancellation Reasons Start ====================
export interface CancellationReasonsResponse {
  success: boolean;
  message: string;
  data: CancellationReasonRecord[];
}

export interface CancellationReasonRecord {
  id: number;
  reason_ar: string;
  reason_en: string;
  sorting: string | number;
  status: "active" | "disabled";
  category: "driver" | "customer";
  services?: CancellationReasonService[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CancellationReasonService {
  id: number;
  key: string;
  title_en: string;
  title_ar: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pivot?: {
    cancellation_reason_id: number;
    service_id: number;
  };
}

export interface CreateCancellationReasonResponse {
  success: boolean;
  message: string;
  data: CancellationReasonRecord;
}

export interface CreateCancellationReasonBody {
  reason_ar: string;
  reason_en: string;
  category: "driver" | "customer";
  sorting: number | string;
  status: "active" | "disabled";
  service_ids: number[];
}

export interface ServiceListResponse {
  success: boolean;
  message: string;
  data: CancellationReasonService[];
}

export interface CancellationStatisticsResponse {
  success: boolean;
  message: string;
  data: CancellationStatisticsData;
}

export interface CancellationStatisticsData {
  total_cancellations: number;
  customer_cancellations: number;
  driver_cancellations: number;
  services_most_cancelled: ServiceCancellationStat[];
  reasons_most_cancelled: ReasonCancellationStat[];
  customers_most_cancelled: UserCancellationStat[];
  drivers_most_cancelled: DriverCancellationStat[];
}

export interface ServiceCancellationStat {
  name: string;
  count: number;
}

export interface ReasonCancellationStat {
  reason: string;
  count: number;
}

export interface UserCancellationStat {
  name: string;
  count: number;
}

export interface DriverCancellationStat {
  name: string;
  count: number;
}
// =========================================== Cancellation Reasons End ====================
