import Image from "next/image";
import Link from "next/link";

export const AuthLayout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <div className="bg-muted flex min-h-svh flex-col justify-center items-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex flex-col items-center gap-4 self-center mb-8">
          <Image
            src="/logos/full-logo.png"
            alt="iSuite"
            width={240}
            height={60}
            className="object-contain"
            priority
          />
        </Link>
        {children}
      </div>
    </div>
  );
};
