const Index = ({
  text,
  green,
  yellow,
  blue,
}: {
  text: string;
  green: boolean;
  yellow?: boolean;
  blue?: boolean;
}) => {
  return (
    <div
      className={`flex items-center gap-3 py-1.5 px-5 w-fit rounded-full max-h-[26px] ${
        green
          ? "bg-success50"
          : yellow
          ? "bg-yellow-100"
          : blue
          ? "bg-blue-100"
          : "bg-error50"
      }`}
    >
      <span
        className={`text-14 ${
          green
            ? "text-success"
            : yellow
            ? "text-yellow-700"
            : blue
            ? "text-blue-700"
            : "text-error"
        }`}
      >
        {text}
      </span>
      <span
        className={`w-2 h-2 rounded-full ${
          green
            ? "bg-success"
            : yellow
            ? "bg-yellow-700"
            : blue
            ? "bg-blue-700"
            : "bg-error"
        }`}
      ></span>
    </div>
  );
};

export default Index;
