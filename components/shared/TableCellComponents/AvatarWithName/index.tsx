import { Rating } from "@/public/SVG";
import Image, { StaticImageData } from "next/image";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { getFirstTwoWords } from "@/lib/utils";

const Index = ({
  image,
  name,
  gender,
  online,
  rating,
  isActive,
  displayOnlineStatus,
}: {
  image: string | StaticImageData;
  name: string;
  gender: string;
  online?: boolean;
  rating?: number;
  isActive?: boolean;
  displayOnlineStatus?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2 relative min-w-[150px]">
      {image ? (
        <Image
          src={image}
          alt="avatar"
          width={40}
          height={40}
          className=" rounded-full w-10 h-10"
        />
      ) : (
        <span className=" block w-10 h-10 rounded-full bg-gray300"></span>
      )}
      {displayOnlineStatus && online && (
        <span className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-success rounded-full border-[2px] border-white"></span>
      )}

      <div>
        <p className="text-16 text-gray900 font-[600]">
          {name?.split(" ").length > 2 ? getFirstTwoWords(name) : name}
        </p>
        <div className="flex items-center justify-between gap-5">
          <p className="text-12 text-textSubText font-[600]">{gender}</p>
          {displayOnlineStatus && (
            <StatusCell
              text={online ? "متصل" : "غير متصل"}
              green={online || false}
            />
          )}
          {rating && (
            <div className="flex items-center gap-2">
              <Rating />
              <span className="text-12 text-textMain">{rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
