import { StarFill } from "@/public/SVG";
import Image, { StaticImageData } from "next/image";
import Avatar from "@/public/images/placeholder.png";
const Index = ({
  image,
  name,
  rating,
  gender,
}: {
  image: string | StaticImageData | null;
  name: string;
  rating: number;
  gender: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={image || Avatar}
        alt="avatar"
        width={46}
        height={46}
        className=" object-cover rounded-[4px]"
      />
      <div className="flex flex-col gap-1">
        <div className="flex gap-1 items-center">
          <span className="text-16 text-textMain font-[600]">{name}</span>
          <StarFill />
          <span className="text-14 text-textMain">{rating}</span>
        </div>
        <span className="text-14 text-textSubTextDarker">{gender}</span>
      </div>
    </div>
  );
};

export default Index;
