import { redirect } from 'next/navigation'

export default function AdminLoginPage() {
  // Redirect to main admin login
  redirect('/auth/login')
}
