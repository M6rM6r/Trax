export const getData = () => {
  const data = new Array(100).fill({
    id: 1,
    name: "محمد الشريف",
    appointmentDate: {
      date: "29/11/2023",
      time: "12:35 ص",
    },
    appointmentStart: {
      date: "29/11/2023",
      time: "12:35 ص",
    },
    appointmentEnd: {
      date: "29/11/2023",
      time: "12:35 ص",
    },
    location: "22 شارع الملك فهد، الرياض",
    days: "02",
    cost: "500 ر.س",
    paymentWay: "كاش",
    paymentStatus: "تم الدفع",
    rate: "-----",
    status: "تم الالغاء من العميل",
  });
  return data;
};
