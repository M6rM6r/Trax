export enum EVehicleType {
  taxi = "taxi",
  fontas = "fontas",
  wensh = "wensh",
  light_transportation = "light_transportation",
  driver_without_car = "driver_without_car",
  fast_support = "fast_support",
  fuel = "fuel",
  towing = "towing",
}

export enum EVehicleLicenseType {
  private = "private", // رخصة خاصة
  professional_light = "professional_light", // مهنية درجة ثالثة
  professional_medium = "professional_medium", // مهنية درجة ثانية
  professional_heavy = "professional_heavy", // مهنية درجة أولى
  motorcycle = "motorcycle", // دراجة نارية
  construction = "construction", // معدات / إنشائية
  public = "public", // عامة / نقل جماعي
}

export const vehicleTypes: Record<EVehicleType, string> = {
  [EVehicleType.taxi]: "تاكسي",
  [EVehicleType.fontas]: "فونطاس",
  [EVehicleType.wensh]: "ونش",
  [EVehicleType.light_transportation]: "نقل خفيف",
  [EVehicleType.driver_without_car]: "بدون سيارة",
  [EVehicleType.fast_support]: "عطالات",
  [EVehicleType.fuel]: "خدمة الوقود",
  [EVehicleType.towing]: "خدمة السحب",
};

export const NotificationTemplatesChannels = {
  ar: {
    sms: "SMS",
    notification: "Notification",
    email: "Email",
    whatsapp: "Whatsapp",
  },
};

export const NotificationTemplatesTypes = {
  ar: {
    welcome: "رسالة ترحيب",
    fuel: "رسالة خدمة الوقود",
    tires: "رسالة خدمة الاطارات",
    towing: "رسالة خدمة السحب",
    active_fuel: "رسالة قبول خدمة الوقود",
    rejected_fuel: "رسالة رفض خدمة الوقود",
    active_tires: "رسالة قبول خدمة الإطارات",
    rejected_tires: "رسالة رفض خدمة الإطارات",
    active_towing: "رسالة قبول خدمة السحب",
    rejected_towing: "رسالة رفض خدمة السحب",
    driver_without_car: "رسالة خدمة السائق بدون سيارة",
    important_dates: "رسالة خدمة المواعيد المهمة",
    light_transportation: "رسالة خدمة النقل الخفيف",
    fontas: "رسالة خدمة فونطاس",
    wensh: "رسالة خدمة وينش",
    taxi: "رسالة خدمة التاكسي",
  },
};

export const allEnumsData: any = {
  FileTypes: {
    pdf: "pdf",
    jpeg: "jpeg",
    jpg: "jpg",
    png: "png",
    gif: "gif",
    svg: "svg",
    doc: "doc",
    docx: "docx",
    xls: "xls",
    xlsx: "xlsx",
    ppt: "ppt",
    pptx: "pptx",
    txt: "txt",
    heic: "heic",
    HEIC: "HEIC",
    "": "Unknown",
  },
  InfoPagesTypes: {
    en: {
      "on-boarding": "On Boarding",
      "privacy-policy": "Privacy & Policy",
      "terms-conditions": "Terms & Conditions",
      faq: "FAQ",
    },
    ar: {
      "on-boarding": "التسجيل",
      "privacy-policy": "سياسة الخصوصية",
      "terms-conditions": "الشروط والأحكام",
      faq: "الأسئلة الشائعة",
    },
  },
  DriverStatus: {
    en: {
      pending: "Pending",
      suspended: "Suspended",
      wasl_pending: "Pending Wasl",
      wasl_accepted: "Wasl Accepted",
      wasl_rejected: "Wasl Rejected",
      active: "Active",
    },
    ar: {
      pending: "قيد الانتظار",
      suspended: "معلق",
      wasl_pending: "في انتظار وصل",
      wasl_accepted: "مقبول من وصل",
      wasl_rejected: "مرفوض من وصل",
      active: "نشط",
    },
  },
  Genders: {
    en: {
      male: "Male",
      female: "Female",
    },
    ar: {
      male: "ذكر",
      female: "أنثى",
    },
  },
  LocationsTypes: {
    en: {
      pickup: "Pickup",
      destination: "Destination",
      point: "Point",
    },
    ar: {
      pickup: "التقاط",
      destination: "وجهة وصول",
      point: "نقطة في المنتصف",
    },
  },
  AppTypes: {
    en: {
      driver_app: "Driver App",
      customer_app: "Customer App",
    },
    ar: {
      driver_app: "تطبيق السائق",
      customer_app: "تطبيق العميل",
    },
  },
  FontasTypes: {
    en: {
      valid: "Valid For Drinking",
      invalid: "Invalid For Drinking",
    },
    ar: {
      valid: "صالح للشرب",
      invalid: "غير صالح للشرب",
    },
  },
  FontasUnits: {
    en: {
      ton: "Ton",
      gallon: "Gallon",
    },
    ar: {
      ton: "طن",
      gallon: "جالون",
    },
  },
  WenshTypes: {
    en: {
      hydraulic: "Hydraulic",
      basic: "Basic",
      fork: "Fork",
    },
    ar: {
      hydraulic: "هيدروليكي",
      basic: "أساسي",
      fork: "رافعه",
    },
  },
  LightTransportationTypes: {
    en: {
      single_cabin: "Single Cabin",
      double_cabin: "Double Cabin",
    },
    ar: {
      single_cabin: "كابينة مفردة",
      double_cabin: "كابينة مزدوجة",
    },
  },
  CarModelTypes: {
    en: {
      fontas: "Fontas",
      light_transportation: "Light Transportportation",
      taxi: "Taxi",
      wensh: "Wensh",
    },
    ar: {
      fontas: "وايت ماء",
      light_transportation: "نقل خفيف",
      taxi: "تاكسي",
      wensh: "ونش",
    },
  },
  DiscountTypes: {
    en: {
      percentage: "Percentage",
      amount: "Amount",
    },
    ar: {
      percentage: "نسبة مئويه",
      amount: "رقم محدد",
    },
  },
  VehicleTypes: {
    en: {
      taxi: "Taxi",
      fontas: "Fontas",
      wensh: "Wensh",
      light_transportation: "Light Transportation",
    },
    ar: {
      taxi: "زيم ركاب",
      fontas: "وايت ماء",
      wensh: "سطحات",
      light_transportation: "النقل الخفيف",
    },
  },
  ServiceTypes: {
    en: {
      taxi: "Taxi",
      fontas: "Fontas",
      wensh: "Wensh",
      light_transportation: "Light Transportation",
      driver_without_car: "Driver Without Car",
      important_dates: "Important Dates",
    },
    ar: {
      taxi: "زيم ركاب",
      fontas: "وايت ماء",
      wensh: "سطحات",
      light_transportation: "النقل الخفيف",
      driver_without_car: "سائق بدون سيارة",
      important_dates: "أجتماعات ومواعيد مهمة",
    },
  },
  DrivingLicenseType: {
    en: {
      private_driver_license: "Private Driver's License",
      public_driver_license: "Public Driver's License",
      motorcycle_driver_license: "Motorcycle Driver's License",
      heavy_equipment_driver_license: "Heavy Equipment Driver's License",
      temporary_driver_license: "Temporary Driver's License",
      private_driver_license_foreigners:
        "Private Driver's License for Foreigners",
      heavy_transport_driver_license: "Heavy Transport Driver's License",
    },
    ar: {
      private_driver_license: "رخصة القيادة الخاصة",
      public_driver_license: "رخصة القيادة العامة",
      motorcycle_driver_license: "رخصة قيادة الدراجات النارية",
      heavy_equipment_driver_license: "رخصة قيادة المعدات الثقيلة",
      temporary_driver_license: "رخصة القيادة المؤقتة",
      private_driver_license_foreigners: "رخصة القيادة الخاصة بالأجانب",
      heavy_transport_driver_license: "رخصة قيادة النقل الثقيل",
    },
  },
  WithdrawPaymentMethods: {
    en: {
      stc_pay: {
        title: "STC Pay",
        logo: "",
      },
    },
    ar: {
      stc_pay: {
        title: "STC باى",
        logo: "",
      },
    },
  },
  DepositPaymentMethods: {
    en: {
      creditcard: {
        title: "Bank Card",
        logo: "",
      },
    },
    ar: {
      creditcard: {
        title: "كارت بنكى",
        logo: "",
      },
    },
  },
  ModelMap: {
    User: "App\\Models\\User",
    File: "App\\Models\\File",
    InfoPage: "App\\Models\\InfoPage",
    Review: "App\\Models\\Review",
    Color: "App\\Models\\Color",
    Brand: "App\\Models\\Brand",
    CarModel: "App\\Models\\CarModel",
    FontasUnit: "App\\Models\\FontasUnit",
    Rule: "App\\Models\\Rule",
    ServiceSetting: "App\\Models\\ServiceSetting",
    Permission: "App\\Models\\Permission",
  },
  ModelsDDLMap: [
    "User",
    "File",
    "InfoPage",
    "Review",
    "Color",
    "Brand",
    "CarModel",
    "FontasUnit",
    "Rule",
    "ServiceSetting",
  ],
  RidePaymentMethods: {
    en: {
      cash: {
        title: "Cash",
        logo: "payment_methods/cash.png",
      },
      creditcard: {
        title: "Bank Card",
        logo: "payment_methods/bank_account.png",
      },
      applepay: {
        title: "Apple Pay",
        logo: "payment_methods/apple_pay.png",
      },
    },
    ar: {
      cash: {
        title: "كاش",
        logo: "payment_methods/cash.png",
      },
      creditcard: {
        title: "كارت بنكى",
        logo: "payment_methods/bank_account.png",
      },
      applepay: {
        title: "Apple باي",
        logo: "payment_methods/apple_pay.png",
      },
    },
  },
};
