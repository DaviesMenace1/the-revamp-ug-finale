'use client'

import type { CSSProperties, ComponentType, SVGProps } from 'react'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'color'> & {
  size?: number | string
  color?: string
}

export type IconType = ComponentType<IconProps>
export type LucideIcon = IconType

const paths: Record<string, string> = {
  AlertCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-12v4m0 3h.01',
  AlertTriangle: 'm12 3 9 17H3L12 3Zm0 6v4m0 3h.01',
  Archive: 'M4 7h16v12H4V7Zm-1 0h18M8 11h8',
  Armchair: 'M5 12V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4M4 12h16v5H4v-5Zm2 5v3m12-3v3',
  ArrowLeft: 'M19 12H5m6-6-6 6 6 6',
  ArrowRight: 'M5 12h14m-6-6 6 6-6 6',
  ArrowUpRight: 'M5 19 19 5m-9 0h9v9',
  BarChart3: 'M5 20V10m7 10V4m7 16v-7',
  Bell: 'M6 16h12l-1.4-2.2V10a4.6 4.6 0 0 0-9.2 0v3.8L6 16Zm3.5 3h5',
  BookOpen: 'M4 5.5A3.5 3.5 0 0 1 7.5 2H20v16H7.5A3.5 3.5 0 0 0 4 21V5.5Zm0 0A3.5 3.5 0 0 1 7.5 9H20',
  Box: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9',
  Boxes: 'm7 3 4 2.2v4.6L7 12.1 3 9.8V5.2L7 3Zm10 8 4 2.2v4.6l-4 2.3-4-2.3v-4.6l4-2.2ZM7 12v5m10-6v5',
  Briefcase: 'M4 7h16v12H4V7Zm4 0V5h8v2M4 12h16',
  BriefcaseBusiness: 'M4 7h16v12H4V7Zm4 0V5h8v2M4 12h16m-6 0v2',
  Building2: 'M4 21V4h11v17M15 9h5v12M8 8h3m-3 4h3m-3 4h3',
  Calendar: 'M5 4v3m14-3v3M4 8h16v12H4V8Zm4 4h.01m4 0h.01m4 0h.01m-8 4h.01m4 0h.01',
  CalendarDays: 'M5 4v3m14-3v3M4 8h16v12H4V8Zm4 4h.01m4 0h.01m4 0h.01m-8 4h.01m4 0h.01m4 0h.01',
  Check: 'm5 12 4 4L19 6',
  CheckCheck: 'm3 12 4 4 8-8m-3 8 2 2 7-7',
  CheckCircle: 'm7 12 3 3 7-7M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  CheckCircle2: 'm7 12 3 3 7-7M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  CheckSquare: 'm7 12 3 3 7-7M5 3h14v18H5V3Z',
  ChevronDown: 'm6 9 6 6 6-6',
  ChevronDownIcon: 'm6 9 6 6 6-6',
  ChevronLeft: 'm15 6-6 6 6 6',
  ChevronRight: 'm9 6 6 6-6 6',
  ChevronUpIcon: 'm6 15 6-6 6 6',
  ClipboardCheck: 'M7 4h10v17H7V4Zm3-2h4v4h-4V2Zm-1 10 2 2 4-4',
  ClipboardList: 'M7 4h10v17H7V4Zm3-2h4v4h-4V2Zm0 9h4m-4 4h4',
  Clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  Clock3: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5h4',
  Cookie: 'M20 13a5 5 0 0 1-6 6 8 8 0 1 1-9-9 5 5 0 0 1 6 6 5 5 0 0 0 9-3Zm-9-4h.01m-4 5h.01m5 4h.01',
  Copy: 'M8 8h11v12H8V8ZM5 16H4V4h12v1',
  CreditCard: 'M3 6h18v12H3V6Zm0 4h18M7 15h4',
  Crown: 'm3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z',
  DollarSign: 'M12 3v18m4-15c-1-2-6-2-7 1-1 3 7 1 7 4s-6 4-7 1',
  Download: 'M12 3v12m-5-5 5 5 5-5M4 21h16',
  Edit: 'm4 16 0 4 4 0L19 9l-4-4L4 16Zm9-8 4 4',
  Expand: 'm8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  ExternalLink: 'M14 4h6v6m-1-5L10 14M19 14v6H4V5h6',
  Eye: 'M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  EyeOff: 'm3 3 18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.7M6.3 6.3C3.6 8 2.5 12 2.5 12S6 18 12 18c1.4 0 2.7-.3 3.8-.8',
  FileCog: 'M5 3h10l4 4v14H5V3Zm10 0v5h4m-7 5v5m-2.2-2.5h4.4M10 10l1.2 1.2M14 10l-1.2 1.2',
  FileText: 'M5 3h10l4 4v14H5V3Zm10 0v5h4M8 12h8m-8 4h6',
  FolderKanban: 'M3 6h7l2 2h9v11H3V6Zm5 5h8m-8 3h5',
  FolderOpen: 'M3 6h7l2 2h9l-2 10H3L3 6Z',
  Gift: 'M3 8h18v13H3V8Zm9 0v13M2 8h20M5 8a3 3 0 1 1 3-3h4v3H5Zm14 0a3 3 0 1 0-3-3h-4v3h7Z',
  Globe2: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18c2 2.4 3 5.4 3 9s-1 6.6-3 9c-2-2.4-3-5.4-3-9s1-6.6 3-9ZM3 12h18',
  Grid3x3: 'M4 4h5v5H4V4Zm11 0h5v5h-5V4ZM4 15h5v5H4v-5Zm11 0h5v5h-5v-5ZM9 9h6v6H9V9Z',
  Heart: 'M20.5 8.5c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 2.5Z',
  HelpCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.2-10a2.2 2.2 0 1 1 3.9 1.4c-.8.8-1.7 1.1-1.7 2.6m0 3h.01',
  Home: 'm3 10 9-7 9 7v10H5V10m4 10v-6h6v6',
  ImageIcon: 'M4 4h16v16H4V4Zm2 12 3-3 2 2 3-4 4 5M8 9h.01',
  Image: 'M4 4h16v16H4V4Zm2 12 3-3 2 2 3-4 4 5M8 9h.01',
  Inbox: 'M4 5h16v14H4V5Zm0 9h5l1 2h4l1-2h5',
  Info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v5m0-8h.01',
  Laptop: 'M4 5h16v11H4V5Zm-2 14h20M9 19h6',
  Layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5m-18 5 9 5 9-5',
  LifeBuoy: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.4-7.4 2.8 2.8m8.2-2.8-2.8 2.8m-5.4 2.8-2.8 2.8m11-2.8-2.8 2.8',
  Lightbulb: 'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z',
  Link2: 'm9 15 6-6m-3-3 1-1a4 4 0 0 1 6 6l-3 3a4 4 0 0 1-6 0m-1 1-1 1a4 4 0 0 1-6-6l3-3a4 4 0 0 1 6 0',
  Loader2: 'M12 3a9 9 0 1 1-6.4 2.6',
  LocateFixed: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2',
  Lock: 'M5 10h14v11H5V10Zm3 0V7a4 4 0 0 1 8 0v3',
  LogOut: 'M10 17l5-5-5-5m5 5H3m9-9V3h9v18h-9v-3',
  Mail: 'M3 5h18v14H3V5Zm0 1 9 7 9-7',
  MapPin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  Megaphone: 'm4 11 14-5v12L4 13v-2Zm14-1 3-1v6l-3-1M7 14l1 5',
  Menu: 'M3 6h18M3 12h18M3 18h18',
  MessageCircle: 'M20 11.5a8 8 0 0 1-8 8 9 9 0 0 1-3.7-.8L4 20l1.3-4.3a8 8 0 1 1 14.7-4.2Z',
  MessageSquare: 'M4 4h16v12H8l-4 4V4Z',
  Minus: 'M5 12h14',
  Moon: 'M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z',
  Newspaper: 'M4 4h16v16H4V4Zm4 4h8m-8 4h8m-8 4h5',
  Package: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5',
  PackageCheck: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5m5 5 2 2 4-4',
  PackageOpen: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5m8 4.5v9',
  Palette: 'M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h5a4 4 0 0 0 0-8h-5ZM7 10h.01m2-3h.01m5 0h.01m3 3h.01',
  PanelLeftClose: 'M4 4h16v16H4V4Zm5 0v16m4-10-2 2 2 2',
  PanelLeftOpen: 'M4 4h16v16H4V4Zm5 0v16m4-10 2 2-2 2',
  Paperclip: 'm8 12 5-5a3 3 0 0 1 4 4l-6 6a5 5 0 0 1-7-7l6-6',
  Pause: 'M8 5v14m8-14v14',
  Pencil: 'm4 16 0 4 4 0L19 9l-4-4L4 16Z',
  Percent: 'M19 5 5 19M7 7h.01M17 17h.01',
  Phone: 'M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4c-9 1-15-7-15-15Z',
  Play: 'm9 5 10 7-10 7V5Z',
  Plus: 'M12 5v14M5 12h14',
  Printer: 'M6 9V4h12v5M6 17H4V9h16v8h-2M6 14h12v7H6v-7Z',
  Receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6',
  RefreshCw: 'M20 11a8 8 0 0 0-14-4L3 10m0-5v5h5m-4 3a8 8 0 0 0 14 4l3-3m0 5v-5h-5',
  RotateCcw: 'M4 12a8 8 0 1 0 2-5m-2 0V3m0 4h4',
  Ruler: 'm4 16 12-12 4 4L8 20H4v-4Zm5-5 4 4m-1-7 4 4',
  Save: 'M5 3h12l2 2v16H5V3Zm3 0v6h7V3m-7 14h8',
  Search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm5-1 5 5',
  Settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M3 12h2m14 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  SlidersHorizontal: 'M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4m-5 6v4',
  Send: 'm3 4 18 8-18 8 4-8-4-8Zm4 8h14',
  Share2: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 10.5l6.8-3.5M8.6 13.5l6.8 3.5',
  Shield: 'M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z',
  ShieldCheck: 'M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Zm-4 9 3 3 5-5',
  ShoppingBag: 'M4 8h16v12H4V8Zm4 0a4 4 0 0 1 8 0',
  ShoppingCart: 'M3 4h2l2 12h11l2-8H6m4 13h.01m7 0h.01',
  Smartphone: 'M7 2h10v20H7V2Zm4 17h2',
  Sofa: 'M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M4 12h16v6H4v-6Zm2 6v3m12-3v3',
  Sparkle: 'm12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Zm7 13 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z',
  Sparkles: 'm12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Zm7 13 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z',
  Square: 'M4 4h16v16H4V4Z',
  Star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',
  Store: 'M4 10h16v11H4V10Zm-1 0 2-6h14l2 6M9 14h6v7H9',
  Sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m14.4-5.6 1.4-1.4M4.2 19.8l1.4-1.4m0-12.8L4.2 4.2m15.6 15.6-1.4-1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  Tag: 'm4 4 9 0 7 7-9 9-7-7V4Zm4 4h.01',
  Ticket: 'M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Zm8 0v2m0 8v2',
  Trash2: 'M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3',
  Truck: 'M3 6h12v11H3V6Zm12 4h4l2 3v4h-6M7 20h.01m10 0h.01',
  Upload: 'M12 16V3m-5 5 5-5 5 5M4 21h16',
  User: 'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  UserRound: 'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  Users: 'M16 21a6 6 0 0 0-12 0m6-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-5a3 3 0 1 0 0-6m2 19a6 6 0 0 0-3.5-5.5',
  UsersRound: 'M16 21a6 6 0 0 0-12 0m6-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-5a3 3 0 1 0 0-6m2 19a6 6 0 0 0-3.5-5.5',
  Video: 'M4 6h11v12H4V6Zm11 4 5-3v10l-5-3',
  Wallet: 'M4 6h16v14H4V6Zm0 0V4h13v2m5 6h-5v4h5',
  X: 'M5 5l14 14M19 5 5 19',
  XCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3-6 6-6m0 6-6-6',
  XIcon: 'M5 5l14 14M19 5 5 19',
  Zap: 'm13 2-9 12h7l-1 8 9-12h-7l1-8Z',
  FaInstagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5-2h.01',
  FaLinkedinIn: 'M5 8v11M5 5v.01M9 19v-6a4 4 0 0 1 8 0v6m-8-7V8',
  FaSnapchatGhost: 'M12 4a5 5 0 0 1 5 5v3l2 2-3 1c-.5 2-2 3-4 3s-3.5-1-4-3l-3-1 2-2V9a5 5 0 0 1 5-5Z',
  FaTiktok: 'M14 4v10a4 4 0 1 1-3-3m3-7c1 2 2 3 5 3',
  SiGoogle: 'M21 12a9 9 0 1 1-2.6-6.3L16 8.2A5.5 5.5 0 1 0 17.1 12H12v-3h9v3Z',
  SiTiktok: 'M14 4v10a4 4 0 1 1-3-3m3-7c1 2 2 3 5 3',
}

function LuxuryIcon({ name, ...props }: IconProps & { name: string }) {
  const { size = 24, color, className, style, ...svgProps } = props
  const mergedStyle: CSSProperties = { ...style, color }
  return (
    <svg {...svgProps} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" className={className} style={mergedStyle} aria-hidden={svgProps['aria-label'] ? undefined : true} focusable="false">
      <path d={paths[name] || paths.Square} />
    </svg>
  )
}

function makeIcon(name: string): IconType {
  return function Icon(props: IconProps) {
    return <LuxuryIcon name={name} {...props} />
  }
}

export const ArrowLeft = makeIcon('ArrowLeft')
export const ArrowRight = makeIcon('ArrowRight')
export const ArrowUpRight = makeIcon('ArrowUpRight')
export const AlertCircle = makeIcon('AlertCircle')
export const AlertTriangle = makeIcon('AlertTriangle')
export const Archive = makeIcon('Archive')
export const Armchair = makeIcon('Armchair')
export const BarChart3 = makeIcon('BarChart3')
export const Bell = makeIcon('Bell')
export const BookOpen = makeIcon('BookOpen')
export const Box = makeIcon('Box')
export const Boxes = makeIcon('Boxes')
export const Briefcase = makeIcon('Briefcase')
export const BriefcaseBusiness = makeIcon('BriefcaseBusiness')
export const Building2 = makeIcon('Building2')
export const Calendar = makeIcon('Calendar')
export const CalendarDays = makeIcon('CalendarDays')
export const Check = makeIcon('Check')
export const CheckCheck = makeIcon('CheckCheck')
export const CheckCircle = makeIcon('CheckCircle')
export const CheckCircle2 = makeIcon('CheckCircle2')
export const CheckSquare = makeIcon('CheckSquare')
export const ChevronDown = makeIcon('ChevronDown')
export const ChevronDownIcon = makeIcon('ChevronDownIcon')
export const ChevronLeft = makeIcon('ChevronLeft')
export const ChevronRight = makeIcon('ChevronRight')
export const ChevronUpIcon = makeIcon('ChevronUpIcon')
export const ClipboardCheck = makeIcon('ClipboardCheck')
export const ClipboardList = makeIcon('ClipboardList')
export const Clock = makeIcon('Clock')
export const Clock3 = makeIcon('Clock3')
export const Cookie = makeIcon('Cookie')
export const Copy = makeIcon('Copy')
export const CreditCard = makeIcon('CreditCard')
export const Crown = makeIcon('Crown')
export const DollarSign = makeIcon('DollarSign')
export const Download = makeIcon('Download')
export const Edit = makeIcon('Edit')
export const Expand = makeIcon('Expand')
export const ExternalLink = makeIcon('ExternalLink')
export const Eye = makeIcon('Eye')
export const EyeOff = makeIcon('EyeOff')
export const FileCog = makeIcon('FileCog')
export const FileText = makeIcon('FileText')
export const FolderKanban = makeIcon('FolderKanban')
export const FolderOpen = makeIcon('FolderOpen')
export const Gift = makeIcon('Gift')
export const Globe2 = makeIcon('Globe2')
export const Grid3x3 = makeIcon('Grid3x3')
export const Heart = makeIcon('Heart')
export const HelpCircle = makeIcon('HelpCircle')
export const Home = makeIcon('Home')
export const ImageIcon = makeIcon('ImageIcon')
export const Image = makeIcon('Image')
export const Inbox = makeIcon('Inbox')
export const Info = makeIcon('Info')
export const Laptop = makeIcon('Laptop')
export const Layers = makeIcon('Layers')
export const LifeBuoy = makeIcon('LifeBuoy')
export const Lightbulb = makeIcon('Lightbulb')
export const Link2 = makeIcon('Link2')
export const Loader2 = makeIcon('Loader2')
export const LocateFixed = makeIcon('LocateFixed')
export const Lock = makeIcon('Lock')
export const LogOut = makeIcon('LogOut')
export const Mail = makeIcon('Mail')
export const MapPin = makeIcon('MapPin')
export const Megaphone = makeIcon('Megaphone')
export const Menu = makeIcon('Menu')
export const MessageCircle = makeIcon('MessageCircle')
export const MessageSquare = makeIcon('MessageSquare')
export const Minus = makeIcon('Minus')
export const Moon = makeIcon('Moon')
export const Newspaper = makeIcon('Newspaper')
export const Package = makeIcon('Package')
export const PackageCheck = makeIcon('PackageCheck')
export const PackageOpen = makeIcon('PackageOpen')
export const Palette = makeIcon('Palette')
export const PanelLeftClose = makeIcon('PanelLeftClose')
export const PanelLeftOpen = makeIcon('PanelLeftOpen')
export const Paperclip = makeIcon('Paperclip')
export const Pause = makeIcon('Pause')
export const Pencil = makeIcon('Pencil')
export const Percent = makeIcon('Percent')
export const Phone = makeIcon('Phone')
export const Play = makeIcon('Play')
export const Plus = makeIcon('Plus')
export const Printer = makeIcon('Printer')
export const Receipt = makeIcon('Receipt')
export const RefreshCw = makeIcon('RefreshCw')
export const RotateCcw = makeIcon('RotateCcw')
export const Ruler = makeIcon('Ruler')
export const Save = makeIcon('Save')
export const Search = makeIcon('Search')
export const Settings = makeIcon('Settings')
export const SlidersHorizontal = makeIcon('SlidersHorizontal')
export const Send = makeIcon('Send')
export const Share2 = makeIcon('Share2')
export const Shield = makeIcon('Shield')
export const ShieldCheck = makeIcon('ShieldCheck')
export const ShoppingBag = makeIcon('ShoppingBag')
export const ShoppingCart = makeIcon('ShoppingCart')
export const Smartphone = makeIcon('Smartphone')
export const Sofa = makeIcon('Sofa')
export const Sparkle = makeIcon('Sparkle')
export const Sparkles = makeIcon('Sparkles')
export const Square = makeIcon('Square')
export const Star = makeIcon('Star')
export const Store = makeIcon('Store')
export const Sun = makeIcon('Sun')
export const Tag = makeIcon('Tag')
export const Ticket = makeIcon('Ticket')
export const Trash2 = makeIcon('Trash2')
export const Truck = makeIcon('Truck')
export const Upload = makeIcon('Upload')
export const User = makeIcon('User')
export const UserRound = makeIcon('UserRound')
export const Users = makeIcon('Users')
export const UsersRound = makeIcon('UsersRound')
export const Video = makeIcon('Video')
export const Wallet = makeIcon('Wallet')
export const X = makeIcon('X')
export const XCircle = makeIcon('XCircle')
export const XIcon = makeIcon('XIcon')
export const Zap = makeIcon('Zap')
export const FaInstagram = makeIcon('FaInstagram')
export const FaLinkedinIn = makeIcon('FaLinkedinIn')
export const FaSnapchatGhost = makeIcon('FaSnapchatGhost')
export const FaTiktok = makeIcon('FaTiktok')
export const SiGoogle = makeIcon('SiGoogle')
export const SiTiktok = makeIcon('SiTiktok')
