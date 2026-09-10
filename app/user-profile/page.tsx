import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { CustomProfileSettings } from '@/components/account/custom-profile-settings'
import { AccountShell } from '@/components/account/account-shell'
import { SavedAddresses } from '@/components/account/saved-addresses'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Profile | The Revamp UG', description: 'Manage your personal details, profile picture, active devices, and saved delivery addresses.' }

export default async function ProfilePage() { const user = await currentUser(); if (!user) redirect('/sign-in?redirect_url=/user-profile'); return <AccountShell><div className="mx-auto max-w-[960px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12"><div id="settings" className="rounded-lg border border-border bg-card p-5 sm:p-8"><div className="mb-8"><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Account</p><h1 className="mt-2 font-serif text-4xl">Personal information</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Manage the details connected to your Revamp account, your profile image, and your active devices.</p></div><CustomProfileSettings /></div><div id="addresses"><SavedAddresses /></div></div></AccountShell> }
