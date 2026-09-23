'use client';

import Link from 'next/link';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LucideImageOff,
  LucideEarth,
  LucideTrash2,
  LucideSquarePen,
  LucideFlag,
  LucideThumbsUp,
  LucideThumbsDown,
  LucideEllipsisVertical,
} from "lucide-react";

import type { Session } from 'next-auth';
import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';

export default function KeepItem({
  session,
  keep,
  each,
}: {
  session?: Session | null;
  keep?: {
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
  };
  each?: boolean | null;
}) {
  // const router = useRouter();
  const isManager = session?.user?.role === 'admin';
  const isCreator = keep?.userId === session?.user?.id;
  // Counted from the click, not a redirect hop, so the link can carry the real
  // destination and a crawler that never clicks stays out of the tally.
  // sendBeacon is not cancelled when the page goes away; the id rides in the path
  // so there is no body and no content-type to negotiate.
  const countView = () => {
    if (keep?.id) navigator.sendBeacon(`/api/keep/${keep.id}/view`);
  };
  const [isDeleted, setIsDeleted] = useState(false);
  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [openDialogReport, setOpenDialogReport] = useState(false);

  useEffect(() => {
  }, []);

  async function onDelete(id: number) {
    try {
      const res = await fetch("/api/keep", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setIsDeleted(true);
      } else {
        toast.error("Failed to delete Keep.", {
          description: `[${res.status}][${res.statusText}] ${result.error}`,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function onReport(id: number) {
    try {
      if (false) {
        console.log(id);
      } else {
        toast.error("Failed to report Keep.", {
          description: `Sorry, still in development.`,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  return(
    <Card className={`group gap-3 hover:bg-(--card)/50 transition-all duration-500 ease-in-out ${each === undefined && 'h-full'} ${isDeleted && 'opacity-25 grayscale pointer-events-none'}`}>
      <CardHeader className="pt-0">
        <div className="relative aspect-video overflow-hidden rounded-md flex flex-col justify-center items-center bg-zinc-200 dark:bg-zinc-950">
          <div className={`absolute top-0 right-0 bottom-0 left-0 bg-no-repeat bg-cover bg-center transition-transform ease-in-out duration-250 group-hover:scale-125`} style={{ backgroundImage: `url(${keep?.image ?? ''})` }}></div>
          <LucideImageOff className="text-muted-foreground/25" />
        </div>
      </CardHeader>
      <CardHeader>
        <CardTitle className="overflow-hidden">
          <div className="text-base/5 line-clamp-3">
            {keep?.url ? (
              <a 
                href={keep.url} 
                target="_blank" 
                rel="noreferrer" 
                onClick={countView} 
                onAuxClick={countView} 
                className="hover:text-blue-500 hover:underline" 
              >
                {keep?.title ?? ''}
              </a>
            ) : (
              <span>{keep?.title ?? ''}</span>
            )}
          </div>
        </CardTitle>
        <CardDescription className="overflow-hidden">
          <div className="flex justify-start items-center gap-2">
            <div className="flex-none relative size-5 overflow-hidden flex flex-col justify-center items-center">
              <div className={`absolute top-0 right-0 bottom-0 left-0 bg-no-repeat bg-cover bg-center`} style={{ backgroundImage: `url(https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=${encodeURIComponent(keep?.url ?? '')})` }}></div>
              <LucideEarth size={20} className="opacity-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate">
                {keep?.url ? (
                  <a 
                    href={keep.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={countView} 
                    onAuxClick={countView} 
                    className="hover:underline" 
                  >
                    {keep.url}
                  </a>
                ) : (
                  <span>{keep?.url ?? ''}</span>
                )}
              </div>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm/4 text-muted-foreground line-clamp-5">
          {keep?.description ?? ''}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <hr className="w-full my-2" />
      </CardFooter>
      <CardFooter>
        <div className="w-full flex items-center justify-start gap-3 truncate">
          <div className="avatar" style={{ backgroundImage: `url(${keep?.user?.photo ?? '/pfimg.svg'})` }}></div>
          <div className="flex flex-col gap-1 truncate w-full">
            <div className="text-sm/3 font-medium text-zinc-600 dark:text-zinc-400 flex gap-2 items-center">
              {keep?.user?.username ? (
                <Link href={keep?.user?.username ? `/user/${keep?.user?.username}` : ``}>
                  <span className="hover:underline hover:text-green-600 dark:hover:text-green-400">{keep?.user?.nick ?? 'noname'}</span>
                </Link>
              ) : (
                <span>{keep?.user?.nick ?? 'noname'}</span>
              )}
            </div>
            <div className="text-xs/3 text-zinc-600 dark:text-zinc-400 truncate">
              {new Date(keep?.createdAt ?? '').toUTCString()}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="link"
                size="icon"
                className="focus-visible:ring-0 focus-visible:bg-muted/50"
              >
                <LucideEllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end">
              <DropdownMenuItem
                disabled={isDeleted || isCreator || !session || true}
                className="cursor-pointer"
              >
                <LucideThumbsUp />
                Like
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isDeleted || isCreator || !session || true}
                className="cursor-pointer"
              >
                <LucideThumbsDown />
                Hate
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={() => onReport(keep?.id ?? 0)}
                onClick={() => setOpenDialogReport(true)}
                disabled={isDeleted || isCreator || !session || true}
                className="cursor-pointer"
              >
                <LucideFlag />
                Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isDeleted || !(isCreator) || true}
                className="cursor-pointer"
              >
                <LucideSquarePen />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={() => onDelete(keep?.id ?? 0)}
                onClick={() => setOpenDialogDelete(true)}
                disabled={isDeleted || !(isCreator || isManager)}
                className="cursor-pointer"
              >
                <LucideTrash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog open={openDialogDelete} onOpenChange={setOpenDialogDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. 
                  This will permanently delete your account 
                  and remove your data from our servers. 
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(keep?.id ?? 0)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog open={openDialogReport} onOpenChange={setOpenDialogReport}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Thanks for looking out for our 
                  by reporting things that break the rules. 
                  Let us know what&apos;s happening, 
                  and we&apos;ll look into it. 
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onReport(keep?.id ?? 0)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
