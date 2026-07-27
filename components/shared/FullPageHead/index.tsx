import React, { FC, ReactNode } from "react";

interface IProps {
  head: string;
  description: string;
  Icon: ReactNode;
  LeftSection?: ReactNode;
}

const FullPageHead: FC<IProps> = ({ head, description, Icon, LeftSection }) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-6 bg-card p-6 rounded-2xl shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground">
          {Icon}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{head}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {LeftSection && <div className="flex items-center gap-4">{LeftSection}</div>}
    </div>
  );
};

export default FullPageHead;
