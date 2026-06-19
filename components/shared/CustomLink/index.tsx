import { getLocale } from "next-intl/server";
import Link from "next/link";

const Index = async ({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof Link>) => {
  const locale = await getLocale();
  return (
    <Link href={`/${locale}${href}`} {...props}>
      {children}
    </Link>
  );
};

export default Index;
