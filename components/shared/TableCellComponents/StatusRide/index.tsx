const Index = ({ text, green }: { text: string; green: boolean }) => {


  
  return (
    <div
      className={`flex items-center gap-3 py-1.5 px-5 w-fit rounded-full max-h-[26px] ${
        !green ? "bg-error50" : "bg-success50"
      }`}
    >
      <span className={`text-14 ${!green ? "text-error" : "text-success"}`}>
        {text}
      </span>
      <span
        className={`w-2 h-2 rounded-full ${!green ? "bg-error" : "bg-success"}`}
      ></span>
    </div>
  );
};

export default Index;
