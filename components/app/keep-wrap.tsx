// import Link from 'next/link';
import KeepList from '@/components/app/keep-list';
import KeepMock from '@/components/app/keep-mock';
import KeepNumber from '@/components/app/keep-number';
import KeepSearch from '@/components/app/keep-search';
import KeepPagination from '@/components/app/keep-pagination';

import type { Session } from 'next-auth';
import { SessionProvider } from "next-auth/react";
import { Suspense } from 'react';
import { prisma } from '@/prisma';

export default async function KeepWrap(props: {
  session?: Session | null;
  username?: string | null;
  query?: string | null;
  page?: number | null;
  itemsCount?: number | null;
  pagesCount?: number | null;
}) {
  const session = props.session;
  const username = props.username;
  const usermine = username ? { username: `${username}` } : {};
  const query = props.query ?? '';
  const page = props.page || 1;
  const itemsCount = props.itemsCount || 12;
  const pagesCount = props.pagesCount || 2;

  // don't await the data fetching function
  const totalItems = prisma.keep.count({
    where: {
      AND: [
        {
          user: usermine,
        },
      ],
      OR: [
        {
          title: {
            contains: `${query}`,
          },
        },
        {
          description: {
            contains: `${query}`,
          },
        },
        {
          url: {
            contains: `${query}`,
          },
        }
      ],
    },
  });

  // don't await the data fetching function
  const keeps = prisma.keep.findMany({
    skip: (page - 1) * itemsCount,
    take: itemsCount,
    include: {
      user: {
        select: {
          nick: true,
          photo: true,
          username: username ? false : true,
        },
      },
    },
    where: {
      AND: [
        {
          user: usermine,
        },
      ],
      OR: [
        {
          title: {
            contains: `${query}`,
          },
        },
        {
          description: {
            contains: `${query}`,
          },
        },
        {
          url: {
            contains: `${query}`,
          },
        }
      ],
    },
    orderBy: [
      {
        id: 'desc',
      },
    ],
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2">
          <Suspense key={query + page} fallback={<></>}>
            <KeepNumber totalItems={totalItems} />
          </Suspense>
        </div>
        <div className="">
          <KeepSearch placeholder="Search..." />
        </div>
      </div>
      <div>
        <SessionProvider>
          <Suspense key={query + page} fallback={<KeepMock count={itemsCount} />}>
            <KeepList keeps={keeps} session={session} />
          </Suspense>
        </SessionProvider>
      </div>
      <div className="my-2">
        <Suspense key={query + page} fallback={<></>}>
          <KeepPagination totalItems={totalItems} itemsCount={itemsCount} pagesCount={pagesCount} />
        </Suspense>
      </div>
    </div>
  );
}
