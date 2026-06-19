import React, { FC } from "react";

interface IProps {
  head: string;
  description: string;
}

const HeadAndDescription: FC<IProps> = ({ head, description }) => {
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
        {head}
      </h1>
      <p className="mt-2 text-gray-500 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default HeadAndDescription;
