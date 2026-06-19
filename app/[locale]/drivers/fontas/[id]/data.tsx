export const getData = () => {
  const data = new Array(100).fill({
    id: 1,
    name: "محمد الشريف",
    appointmentDate: {
      date: "29/11/2023",
      time: "12:35 ص",
    },
    amount: 15,
    locationStart: "22 شارع الملك فهد، الرياض",
    locationEnd: "22 شارع الملك فهد، الرياض",
    cost: "500 ر.س",
    paymentWay: "كاش",
    paymentStatus: "تم الدفع",
    rate: "-----",
    status: "تم الالغاء من العميل",
  });
  return data;
};
