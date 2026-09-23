'use client';

// import Link from 'next/link';
import { use } from 'react';
import type { Session } from 'next-auth';

import KeepItem from '@/components/app/keep-item';

export default function KeepList({
  session,
  keeps,
}: {
  session?: Session | null;
  keeps: Promise<{
    id?: number,
    userId?: string | null,
    title?: string | null,
    description?: string | null,
    url?: string | null,
    image?: string | null,
    views?: number | null,
    createdAt?: Date | null,
    updatedAt?: Date | null,
    user?: {
      nick?: string | null,
      photo?: string | null,
      username?: string | null,
    },
  }[]>;
}) {
  const data = use(keeps);

  return (
    Array.isArray(data) && (
      data.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((keep) => {
            return (
              <div key={keep.id}>
                <KeepItem session={session} keep={keep} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center border rounded-xl h-80">
          <div className="flex flex-col gap-4 justify-center items-center">
            <div className="text-8xl animate-pulse">🛸</div>
            <div className="text-3xl underline underline-offset-10 decoration-2 decoration-wavy">Oops!</div>
            <div className="text-lg underline underline-offset-10 decoration-2 decoration-wavy">There&apos;s nothing here!</div>
          </div>
        </div>
      )
    )
  );
}
