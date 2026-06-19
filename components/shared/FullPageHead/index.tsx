import React, { FC, ReactNode } from "react";
import HeadAndDescription from "../HeadAndDescription";

interface IProps {
  head: string;
  description: string;
  Icon: ReactNode;
  LeftSection?: ReactNode;
}

const FullPageHead: FC<IProps> = ({ head, description, Icon, LeftSection }) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-6 bg-white p-6 rounded-2xl shadow-lg">
      {/* Left Section: Icon + Head */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl shadow-blue-300/40 transition-transform duration-200 hover:scale-105">
          {Icon}
        </div>

        <HeadAndDescription head={head} description={description} />
      </div>

      {/* Right Section */}
      {LeftSection && (
        <div className="flex items-center gap-4">{LeftSection}</div>
      )}
    </div>
  );
};

export default FullPageHead;
