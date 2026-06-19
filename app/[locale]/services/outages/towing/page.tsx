import { redirect } from "next/navigation";

const Page = ({ params }: { params: { locale: string } }) => {
  redirect(`/${params.locale}/services/outages/towing/settings`);
  return <></>;
};

export default Page;
