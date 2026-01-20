'use client';

// import Link from 'next/link';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LucideLoader2,
  LucideSquareUser,
  LucideSquareDashed,
  LucideWalletMinimal,
} from "lucide-react";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";

// import { PrismaClient } from '@/prisma/client';
// const prisma = new PrismaClient();

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(20, { message: "Username must be no more than 20 characters." })
    .regex(/^[A-Za-z0-9][A-Za-z0-9\-]{2,19}$/, { message: "Username should contain [ alphabets / numbers / hyphens ] and cannot start with a hyphen." })
    .optional()
    .or(z.literal('')),
});

export default function SettingsAccount() {
  const [host, setHost] = useState('');
  const router = useRouter();
  const { data: session, update } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHost(window.location.host);
    }
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // defaultValues: {
    //   username: session?.user?.username ?? '',
    // },
    defaultValues: async () => await fetch('/api/user/me/username').then(res => res.json()),
  });

  const [toSubmit, setToSubmit] = useState(false);
  const [toRemove, setToRemove] = useState(false);
  const [toDelete, setToDelete] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [checkAgain, setCheckAgain] = useState('');
  useEffect(() => {
    const { unsubscribe } = form.watch((value) => {
      setProfileUrl(value?.username ?? '');
    })
    return () => unsubscribe();
  }, [form]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setToSubmit(true);
    try {
      const res = await fetch('/api/user/me/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        await update({
          ...session,
          user: await fetch('/api/user/me').then(res => res.json()),
        });
        router.refresh();
      } else {
        form.resetField('username');
        toast.error("Failed to updated username.", {
          description: `[${res.status}][${res.statusText}] ${result.error}`,
        });
      }
    } catch (error) {
      console.log(error);
    }
    setToSubmit(false);
  };

  const onRemove = async () => {
    setToRemove(true);
    try {
      const res = await fetch('/api/user/me/remove-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        await update({
          ...session,
          user: await fetch('/api/user/me').then(res => res.json()),
        });
        router.refresh();
      } else {
        toast.error("Failed to remove username.", {
          description: `[${res.status}][${res.statusText}] ${result.error}`,
        });
      }
    } catch (error) {
      console.log(error);
    }
    setToRemove(false);
  };

  const onDelete = async () => {
    setToDelete(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setCheckAgain('');
        setOpenDialog(false);
        signOut();
      } else {
        toast.error("Failed to delete account.", {
          description: `[${res.status}][${res.statusText}] ${result.error}`,
        });
      }
    } catch (error) {
      console.log(error);
    }
    setToDelete(false);
  };

  const handleVerify = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckAgain(event?.currentTarget?.value);
  };

  return (
    <div>
      <div className="border-b pb-3 mb-5">
        <h2 className="text-2xl">Account</h2>
        <div className="text-sm/5 text-muted-foreground/50">
          You can change the username for your account on KEEP.
        </div>
      </div>
      <div className="mt-5 mb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="sm:w-2/3 space-y-6">
            <FormField
              control={form.control}
              name="username"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                    Make sure it&apos;s at least <b>3</b> characters and at most <b>20</b> characters 
                    including a number and a upper/lower case letter and a hyphen. 
                    However, do not start the first character with an hyphen. <br />
                    {profileUrl && 
                      <>
                        Your public profile address will probably look like this: {" "}
                        <span className="text-green-600 dark:text-green-400">
                          {host || 'domain'}/user/{profileUrl}
                        </span>
                      </>
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit"
              disabled={toSubmit || toRemove || toDelete}
            >
              {!toSubmit 
                ? <><LucideSquareUser /> Update username</>
                : <><LucideLoader2 className="animate-spin" /> Processing...</>
              }
            </Button>
            {(session?.user?.username && false) && 
              <>
                <span className="mx-4">or</span>
                <Button 
                  type="button"
                  variant="destructive"
                  disabled={toSubmit || toRemove || toDelete}
                  onClick={onRemove}
                >
                  {!toRemove 
                    ? <><LucideSquareDashed /> Remove username</>
                    : <><LucideLoader2 className="animate-spin" /> Processing...</>
                  }
                </Button>
              </>
            }
          </form>
        </Form>
      </div>

      <div className="border-b mb-5 pb-3 mt-8">
        <h2 className="text-2xl text-red-500">Delete account</h2>
        <div className="text-sm/5 text-muted-foreground/50">
          Once you delete your account, there is no going back. Please be certain.
        </div>
      </div>
      <div className="mt-5 mb-8">
        <div className="w-2/3 space-y-6">
          <div className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              If you delete your account, all bookmarks you have created will be automatically deleted.
            </p>
          </div>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button 
                type="button"
                className="bg-red-500 text-white hover:bg-red-500/75 hover:text-white/75"
                disabled={toSubmit || toRemove || toDelete}
              >
                {!toDelete 
                  ? <><LucideWalletMinimal /> Delete your account</>
                  : <><LucideLoader2 className="animate-spin" /> Processing...</>
                }
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Delete account</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete your account?<br />
                  This can not be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="checkAgain" className="">Type <b className="text-red-500">DELETE</b> to confirm.</Label>
                  <Input id="checkAgain" defaultValue="" placeholder="" onChange={handleVerify} />
                </div>
              </div>
              <DialogFooter className="justify-center">
                <Button 
                  type="button"
                  className="w-full"
                  disabled={toSubmit || toRemove || toDelete || checkAgain !== 'DELETE'}
                  onClick={onDelete}
                >
                  {!toDelete 
                    ? <><LucideWalletMinimal /> I want to delete my account</>
                    : <><LucideLoader2 className="animate-spin" /> Processing...</>
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
