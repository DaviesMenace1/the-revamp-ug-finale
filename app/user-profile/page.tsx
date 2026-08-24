import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { AccountNavigation } from '@/components/account/account-navigation'
import { CustomProfileSettings } from '@/components/account/custom-profile-settings'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: 'Profile | The Revamp UG', description: 'Manage your personal details, profile picture, and active devices.' }

export default async function ProfilePage() { const user = await currentUser(); if (!user) redirect('/sign-in?redirect_url=/user-profile'); return <><SiteHeader /><main className="min-h-screen bg-background"><div className="mx-auto flex w-full max-w-7xl gap-12 px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-16 lg:px-12"><AccountNavigation /><div className="min-w-0 flex-1"><CustomProfileSettings /></div></div></main></> }
