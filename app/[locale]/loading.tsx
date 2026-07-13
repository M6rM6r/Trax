import DashboardSkeleton from "@/components/shared/Skeletons/DashboardSkeleton";

const Loading = () => {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto pt-16 md:pt-20">
        <DashboardSkeleton />
      </div>
    </div>
  );
};

export default Loading;
