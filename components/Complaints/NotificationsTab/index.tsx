const Index = ({ notifications }: { notifications: any[] }) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-5">
        <p className="text-16 text-textSubText font-[600]">
          <span className="text-18 text-textMain">{notifications.length}</span>{" "}
          من الإشعارات
        </p>
      </div>{" "}
    </div>
  );
};

export default Index;
