export const sessionUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  updatedAt: true,
  role: true,
  nick: true,
  photo: true,
  bio: true,
  url: true,
  username: true,
} as const;

export type SafeSessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  role?: string | null;
  nick?: string | null;
  photo?: string | null;
  bio?: string | null;
  url?: string | null;
  username?: string | null;
};

export function toSessionUser(user: SafeSessionUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role,
    nick: user.nick,
    photo: user.photo,
    bio: user.bio,
    url: user.url,
    username: user.username,
  };
}
