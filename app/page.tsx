// import Link from 'next/link';
import Header from '@/components/app/header';
import Footer from '@/components/app/footer';
import KeepDash from "@/components/app/keep-dash";
import KeepForm from "@/components/app/keep-form";
import KeepWrap from "@/components/app/keep-wrap";

import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
// import { PrismaClient } from '@/prisma/client';
// const prisma = new PrismaClient();

export default async function Home(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const search = await props.searchParams;
  const query = (search?.query || '').slice(0, 200);
  const requestedPage = Number(search?.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  return (
    <>
      <Header />
      <main>
        <div className="section">
          <div className="my-5">
            {!session ? (
              <KeepDash />
            ) : (
              <KeepForm />
            )}
          </div>

          <div className="my-5">
            <SessionProvider>
              <KeepWrap 
                session={session}
                query={query}
                page={page}
                itemsCount={12}
                pagesCount={2}
              />
            </SessionProvider>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
