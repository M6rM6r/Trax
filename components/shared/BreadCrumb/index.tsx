import { ArrowLeft, Home2 } from "@/public/SVG";

const Index = ({
  labels,
}: {
  labels: { icon: React.ReactElement; label: string }[];
}) => {
  return (
    <div className="flex items-center gap-2 overflow-auto hideScrollbar">
      <Home2 className="w-5 text-iconColor shrink-0" />
      <ArrowLeft className="w-5 text-iconColor shrink-0" />
      {labels.map((label, index) => (
        <div key={index} className="flex items-center gap-2">
          {label.icon}
          <span
            className={`text-16 ${
              index == labels.length - 1
                ? "text-textSubTextDarker"
                : "text-iconColor"
            } text-nowrap`}
          >
            {label.label}
          </span>
          {index !== labels.length - 1 && (
            <ArrowLeft className="w-5 text-iconColor" />
          )}
        </div>
      ))}
    </div>
  );
};

export default Index;
