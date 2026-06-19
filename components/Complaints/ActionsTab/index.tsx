import { Action } from "@/lib/types/responseTypes";

const Index = ({ actions }: { actions: Action[] }) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-5">
        <p className="text-16 text-textSubText font-[600]">
          <span className="text-18 text-textMain">{actions.length}</span> إجراء
          مُتخذ
        </p>
      </div>
      <div className="flex flex-col gap-5">
        {actions?.map((action, index) => (
          <div
            key={action.id}
            className=" border border-gray200 rounded-6 p-3 flex flex-col gap-3"
          >
            <p className="text-16 text-textSubTextDarker font-[600]">
              {action?.customerable_type === "Driver" ? "الراكب" : "السائق"}:{" "}
              <span></span>
            </p>
            <div className=" flex flex-wrap justify-between gap-5">
              <p className="text-16 text-primaryColor font-[600]">
                الإجراء({index + 1}):{" "}
                <span className="text-textMain">
                  {action?.disciplinary_action.name_ar}{" "}
                </span>
              </p>
              {action?.disciplinary_action.slug ===
                "add-compensation-to-wallet" && (
                <p className="text-16 text-gray600 font-[600]">
                  {" "}
                  المبلغ المضاف :{" "}
                  <span className="text-textMain">{action?.amount}</span>
                </p>
              )}
              {action?.disciplinary_action.slug === "suspend-withdrawals" && (
                <p className="text-16 text-gray600 font-[600]">
                  {" "}
                  مدة التعليق :{" "}
                  <span className="text-textMain">{action?.amount}</span>
                </p>
              )}
              {action?.disciplinary_action.slug ===
                "deduct-money-from-wallet" && (
                <p className="text-16 text-gray600 font-[600]">
                  {" "}
                  المبلغ المراد خصمه :{" "}
                  <span className="text-textMain">{action?.amount}</span>
                </p>
              )}
              {action?.disciplinary_action.slug === "suspend-account" && (
                <p className="text-16 text-gray600 font-[600]">
                  {" "}
                  مدة التعليق :{" "}
                  <span className="text-textMain">{action?.amount}</span>
                </p>
              )}
              {action?.disciplinary_action.slug === "ban-account" && (
                <p className="text-16 text-gray600 font-[600]">
                  {" "}
                  نوع الحظر :{" "}
                  <span className="text-textMain">{action?.amount}</span>
                </p>
              )}
              {action?.disciplinary_action.slug === "add-warning" && (
                <p className="text-16 text-gray600 font-[600]">
                  {" "}
                  نص التحذير :{" "}
                  <span className="text-textMain">{action?.reason}</span>
                </p>
              )}
              {action?.disciplinary_action.slug === "mark-for-legal-action" && (
                <p className="text-16 text-gray600 font-[600]">
                  {" "}
                  السبب القانوني :{" "}
                  <span className="text-textMain">{action?.reason}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col ">
              <p className="text-16 text-gray600 font-[600]">
                وجهة النظر فى الإجراء:
              </p>
              <p className="text-16 text-textMain font-[600]">{action?.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;
