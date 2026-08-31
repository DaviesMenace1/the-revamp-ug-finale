'use client'

import {
  BarChart3 as BarChart3Icon,
  Bell as BellIcon,
  Briefcase as BriefcaseIcon,
  CalendarDays as CalendarDaysIcon,
  ChevronDown as ChevronDownIcon,
  FileCog as FileCogIcon,
  FileText as FileTextIcon,
  FolderKanban as FolderKanbanIcon,
  FolderOpen as FolderOpenIcon,
  Gift as GiftIcon,
  Heart as HeartIcon,
  Grid3x3 as Grid3x3Icon,
  HelpCircle as HelpCircleIcon,
  LifeBuoy as LifeBuoyIcon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  Megaphone as MegaphoneIcon,
  MessageSquare as MessageSquareIcon,
  Moon as MoonIcon,
  PanelLeftClose as PanelLeftCloseIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
  Package as PackageIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart as ShoppingCartIcon,
  Sun as SunIcon,
  Truck as TruckIcon,
  User as UserIcon,
  Users as UsersIcon,
  X as XIcon,
} from 'lucide-react'
import type { LucideIcon, LucideProps } from 'lucide-react'

/**
 * A restrained, editorial icon treatment for navigation and utility chrome.
 * The source icons remain inline SVGs, while this wrapper keeps stroke weight,
 * caps, and joins consistent across the site, portals, and admin workspace.
 */
function luxury(Icon: LucideIcon) {
  return function LuxuryIcon(props: LucideProps) {
    return <Icon {...props} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
  }
}

export const LuxuryBarChart3 = luxury(BarChart3Icon)
export const LuxuryBell = luxury(BellIcon)
export const LuxuryBriefcase = luxury(BriefcaseIcon)
export const LuxuryCalendarDays = luxury(CalendarDaysIcon)
export const LuxuryChevronDown = luxury(ChevronDownIcon)
export const LuxuryFileCog = luxury(FileCogIcon)
export const LuxuryFileText = luxury(FileTextIcon)
export const LuxuryFolderKanban = luxury(FolderKanbanIcon)
export const LuxuryFolderOpen = luxury(FolderOpenIcon)
export const LuxuryGift = luxury(GiftIcon)
export const LuxuryHeart = luxury(HeartIcon)
export const LuxuryGrid3x3 = luxury(Grid3x3Icon)
export const LuxuryHelpCircle = luxury(HelpCircleIcon)
export const LuxuryLifeBuoy = luxury(LifeBuoyIcon)
export const LuxuryLogOut = luxury(LogOutIcon)
export const LuxuryMenu = luxury(MenuIcon)
export const LuxuryMegaphone = luxury(MegaphoneIcon)
export const LuxuryMessageSquare = luxury(MessageSquareIcon)
export const LuxuryMoon = luxury(MoonIcon)
export const LuxuryPanelLeftClose = luxury(PanelLeftCloseIcon)
export const LuxuryPanelLeftOpen = luxury(PanelLeftOpenIcon)
export const LuxuryPackage = luxury(PackageIcon)
export const LuxuryReceipt = luxury(ReceiptIcon)
export const LuxurySearch = luxury(SearchIcon)
export const LuxurySettings = luxury(SettingsIcon)
export const LuxuryShoppingBag = luxury(ShoppingBagIcon)
export const LuxuryShoppingCart = luxury(ShoppingCartIcon)
export const LuxurySun = luxury(SunIcon)
export const LuxuryTruck = luxury(TruckIcon)
export const LuxuryUser = luxury(UserIcon)
export const LuxuryUsers = luxury(UsersIcon)
export const LuxuryX = luxury(XIcon)
