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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  // DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LucideLoader2,
  LucideUserPen,
} from "lucide-react";

import Avatars from "@/components/app/avatars";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

// import { PrismaClient } from '@/prisma/client';
// const prisma = new PrismaClient();

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
  nick: z
    .string()
    .min(2)
    .max(16)
    .trim(),
  email: z
    .string()
    .email({ message: "Invalid email address." }),
  bio: z
    .string(),
  url: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  photo: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
});

export default function SettingsProfile() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // defaultValues: {
    //   nick: session?.user?.nick ?? '',
    //   email: session?.user?.email ?? '',
    //   bio: session?.user?.bio ?? '',
    //   url: session?.user?.url ?? '',
    //   photo: session?.user?.photo ?? '',
    // },
    defaultValues: async () => await fetch('/api/user/me/profile').then(res => res.json()),
  });

  const [onPending, setOnPending] = useState(false);
  const [openAvatar, setOpenAvatar] = useState(false);
  useEffect(() => {
  }, []);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setOnPending(true);
    try {
      const res = await fetch('/api/user/me/profile', {
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
        toast.error("Failed to updated profile.", {
          description: `[${res.status}][${res.statusText}] ${result.error}`,
        });
      }
    } catch (error) {
      console.log(error);
    }
    setOnPending(false);
  };

  const handleAvatarChoose = (event: React.MouseEvent<HTMLImageElement>) => {
    form.setValue('photo', event?.currentTarget?.src ?? event?.currentTarget?.dataset?.src ?? '');
    setOpenAvatar(false);
  };

  return (
    <div>
      <div className="border-b pb-3 mb-5">
        <h2 className="text-2xl">Profile</h2>
        <div className="text-sm/5 text-muted-foreground/50">
          This is your public display name.
        </div>
      </div>
      <div className="mt-5 mb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="sm:w-2/3 space-y-6">
            <FormField
              control={form.control}
              name="nick"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormDescription>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="mail@john.doe" {...field} disabled={true} />
                  </FormControl>
                  <FormDescription>
                    Email address cannot be changed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us a little bit about youself" {...field} />
                  </FormControl>
                  <FormDescription>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http:// or https://" {...field} />
                  </FormControl>
                  <FormDescription>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photo"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http:// or https://" {...field} />
                  </FormControl>
                  <FormDescription>
                    Only square images uploaded to a remote server can be registered. 
                    If you&apos;re out of ideas, just {" "}
                    <Dialog open={openAvatar} onOpenChange={setOpenAvatar}>
                      <DialogTrigger 
                        className="uppercase text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        choose
                      </DialogTrigger>  
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Avatar</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="min-h-75 max-h-[75vh] p-4 border bg-card dark:border-none rounded-lg">
                          <Avatars onClick={handleAvatarChoose} />
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    {" "} from what we have. 

                    Or, {" "}
                    <span 
                      className="uppercase text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                      data-src={session?.user?.image ?? ''}
                      onClick={handleAvatarChoose}
                    >
                      revert
                    </span> 
                    {" "} to the provider&apos;s default image 
                    or you can {" "}
                    <span 
                      className="uppercase text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      data-src=""
                      onClick={handleAvatarChoose}
                    >
                      remove
                    </span>
                    {" "} it to show anonymous image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={onPending}>
              {!onPending 
                ? <><LucideUserPen /> Update profile</>
                : <><LucideLoader2 className="animate-spin" /> Processing...</>
              }
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
