import { redirect } from "next/navigation";

const Page = ({ params }: { params: { locale: string } }) => {
  redirect(`/${params.locale}/services/outages/fuel/settings`);
  return <></>;
};

export default Page;
