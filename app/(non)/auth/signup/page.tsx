import { redirect } from 'next/navigation';

export default function AuthSignUp() {
  redirect('/auth/signin');
}
