import React, { FC, ReactNode } from "react";

interface IProps {
  head: string;
  description: string;
  Icon: ReactNode;
  LeftSection?: ReactNode;
}

const FullPageHead: FC<IProps> = ({ head, description, Icon, LeftSection }) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl shadow-blue-300/40 transition-transform duration-200 hover:scale-105">
          {Icon}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{head}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      {LeftSection && <div className="flex items-center gap-4">{LeftSection}</div>}
    </div>
  );
};

export default FullPageHead;
