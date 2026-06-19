const Index = ({
  title,
  subTitle,
}: {
  title: string;
  subTitle: string | number | null;
}) => {
  return (
    <div>
      <p className="text-gray600 text-16 font-[600] mb-2">{title}</p>
      <p className="text-18 text-textMain font-[600] overflow-hidden text-ellipsis ">
        {subTitle}
      </p>
    </div>
  );
};

export default Index;
