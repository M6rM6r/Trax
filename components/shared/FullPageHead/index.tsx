import React, { FC, ReactNode } from "react";

interface IProps {
  head: string;
  description: string;
  Icon: ReactNode;
  LeftSection?: ReactNode;
}

const FullPageHead: FC<IProps> = ({ head, description, Icon, LeftSection }) => {
  return (
    <div className="surface-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 sm:h-12 sm:w-12">
          {Icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{head}</h1>
          <p className="mt-0.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      {LeftSection && (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">{LeftSection}</div>
      )}
    </div>
  );
};

export default FullPageHead;
