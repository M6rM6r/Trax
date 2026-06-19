import { parse, format, set, isValid } from "date-fns";

export function DateFormat(dateString?: string) {
  if (!dateString) return { time: "", dayMonthYear: "" };

  // Validate input format (e.g., "2025-09-28 08:51 PM")
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} (AM|PM)$/;
  if (!regex.test(dateString)) {
    throw new Error("Invalid date string format. Expected 'YYYY-MM-DD HH:MM AM/PM'");
  }

  // Split date and time
  const [datePart, timePart, meridian] = dateString?.split(" ");
  const [year, month, day] = datePart?.split("-").map(Number);
  const [hourStr, minute] = timePart?.split(":").map(Number);

  // Validate numbers
  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    isNaN(hourStr) ||
    isNaN(minute) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hourStr < 1 ||
    hourStr > 12 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("Invalid date or time components");
  }

  // Convert to 24-hour format
  let hour = hourStr;
  if (meridian === "PM" && hour < 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;

  // Create Date object and validate
  const date = new Date(year, month - 1, day, hour, minute);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  // Format time with Arabic numerals
  let time = date.toLocaleTimeString("en-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  time = time.replace("PM", "ص").replace("AM", "م");

  // Format date as DD/MM/YYYY
  const dayMonthYear = date.toLocaleDateString("en-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return { time, dayMonthYear };
}

export const convertDateFormat = (
  dateString: string,
  targetDate?: { year: number; month: number; day: number }
): string => {
  try {
    if (!dateString) {
      return "";
    }

    let parsedDate: Date;

    // Try parsing with time format first (e.g., "2023-05-01 12:00 AM")
    parsedDate = parse(dateString, "yyyy-MM-dd h:mm a", new Date());

    // If parsing failed (invalid date), try parsing without time (e.g., "2023-05-01")
    if (!isValid(parsedDate)) {
      parsedDate = parse(dateString, "yyyy-MM-dd", new Date());
    }

    // If both parsing attempts failed, return original string
    if (!isValid(parsedDate)) {
      return dateString;
    }

    // Step 2: Transform the date if targetDate is provided
    const finalDate = targetDate
      ? set(parsedDate, {
          year: targetDate.year,
          month: targetDate.month - 1, // date-fns uses 0-based months
          date: targetDate.day,
        })
      : parsedDate;

    // Step 3: Format the date into DD/MM/YYYY
    return format(finalDate, "dd/MM/yyyy");
  } catch (error) {
    console.error("Error converting date:", error);
    return dateString; // Return the original string as a fallback
  }
};

export function groupByGroupToArray(array: Array<any>) {
  const groupsMap = array.reduce((acc, item) => {
    const group = item.group_en;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});
  return Object.entries(groupsMap).map(([groupName, items]: any) => ({
    group_en: groupName,
    group_ar: items[0].group_ar,
    items,
  }));
}

export function getServiceSettingsValue(
  data: Array<{ key: string; value: string | number; service_subtype?: string | null | number }>,
  key: string,
  service_subtype?: string | null | number
): string | number {
  // First try to find item with matching key and subtype (if subtype is provided)
  if (service_subtype) {
    const itemWithSubtype = data.find(
      (item) => item.key === key && item.service_subtype === service_subtype
    );
    if (itemWithSubtype) {
      return itemWithSubtype.value;
    }
    // If no match with subtype, fallback to general value (service_subtype == null)
    const fallbackItem = data.find((item) => item.key === key && item.service_subtype === null);
    return fallbackItem ? fallbackItem.value : 0;
  }

  // If no subtype provided, look for item with just matching key
  const item = data.find((item) => item.key === key && item.service_subtype === null);

  return item ? item.value : 0;
}

export const ChangeTimeFormate = (time: string) => {
  // Check if the time includes seconds (HH:mm:ss format)
  const formatString = time.length > 5 ? "HH:mm:ss" : "HH:mm";

  // Parse the time string into a Date object
  // We'll use an arbitrary date (like today) since we only care about the time
  const date = parse(time, formatString, new Date());

  // Format the time in 12-hour format with AM/PM
  const formattedTime = format(date, "h:mm a");
  return formattedTime;
};

export function formatArabicTime(startTime: string, endTime: string) {
  // Function to convert single time to Arabic format
  const convertToArabicTime = (time: any) => {
    if (!time) return "";

    const [hours, minutes] = time?.split(":").map(Number);
    const period = hours < 12 ? "صباحاً" : "مساءً";

    // Convert to 12-hour format
    let arabicHours = hours % 12;
    arabicHours = arabicHours === 0 ? 12 : arabicHours;

    // Format hours and minutes with leading zero if needed
    const formattedHours = arabicHours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const arabicStart = convertToArabicTime(startTime);
  const arabicEnd = convertToArabicTime(endTime);

  return `من ${arabicStart} الى ${arabicEnd}`;
}
