const Index = ({
  title,
  subTitle,
}: {
  title: string;
  subTitle: string | number | null;
}) => {
  return (
    <div className="max-w-full overflow-hidden">
      <p className="text-gray600 text-16 font-[600] mb-2">{title}</p>
      <div dangerouslySetInnerHTML={{ __html: subTitle || "" }}></div>
    </div>
  );
};

export default Index;
