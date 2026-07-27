/**
 * Brevo Folder & Contact List Configuration
 * This file defines all email marketing folders, contact lists, and attributes
 * that will be synced from the application to Brevo
 */

export const BREVO_FOLDERS = {
  WEBSITE_LEADS: {
    name: 'Website Leads',
    description: 'Capture all new website enquiries before they become clients',
    isDefault: true,
  },
  CLIENTS: {
    name: 'Clients',
    description: 'Manage active and past clients',
    isDefault: true,
  },
  TRADE_PROGRAMME: {
    name: 'Trade Programme',
    description: 'Future Trade Programme members',
    isEnabled: false,
  },
  MEMBERSHIP: {
    name: 'Membership',
    description: 'Luxury membership programme',
    isEnabled: false,
  },
  NEWSLETTER: {
    name: 'Newsletter',
    description: 'Content marketing',
    isDefault: true,
  },
  PRODUCTS_COLLECTIONS: {
    name: 'Products & Collections',
    description: 'Future eCommerce communication',
    isDefault: true,
  },
  PROCUREMENT_SOURCING: {
    name: 'Procurement & Sourcing',
    description: 'Source With Revamp communications',
    isDefault: true,
  },
  PROJECTS: {
    name: 'Projects',
    description: 'Project lifecycle communication',
    isDefault: true,
  },
  SUPPLIER_NETWORK: {
    name: 'Supplier Network',
    description: 'Future supplier communication',
    isEnabled: false,
  },
  INTERNAL_TEAM: {
    name: 'Internal Team',
    description: 'Internal operational emails',
    isDefault: true,
  },
  EVENTS: {
    name: 'Events',
    description: 'Future luxury experiences',
    isEnabled: false,
  },
  AUTOMATION: {
    name: 'Automation',
    description: 'Used by application workflows',
    isSystem: true,
  },
} as const;

export const BREVO_LISTS = {
  // Website Leads
  GENERAL_ENQUIRIES: {
    folder: 'WEBSITE_LEADS',
    name: 'General Enquiries',
  },
  CONSULTATION_REQUESTS: {
    folder: 'WEBSITE_LEADS',
    name: 'Consultation Requests',
  },
  QUOTE_REQUESTS: {
    folder: 'WEBSITE_LEADS',
    name: 'Quote Requests',
  },
  PRODUCT_ENQUIRIES: {
    folder: 'WEBSITE_LEADS',
    name: 'Product Enquiries',
  },
  SOURCE_WITH_REVAMP_ENQUIRIES: {
    folder: 'WEBSITE_LEADS',
    name: 'Source With Revamp Enquiries',
  },
  CONTACT_FORM_LEADS: {
    folder: 'WEBSITE_LEADS',
    name: 'Contact Form Leads',
  },

  // Clients
  PROSPECTIVE_CLIENTS: {
    folder: 'CLIENTS',
    name: 'Prospective Clients',
  },
  ACTIVE_CLIENTS: {
    folder: 'CLIENTS',
    name: 'Active Clients',
  },
  PREVIOUS_CLIENTS: {
    folder: 'CLIENTS',
    name: 'Previous Clients',
  },
  VIP_CLIENTS: {
    folder: 'CLIENTS',
    name: 'VIP Clients',
  },
  HOSPITALITY_CLIENTS: {
    folder: 'CLIENTS',
    name: 'Hospitality Clients',
  },
  COMMERCIAL_CLIENTS: {
    folder: 'CLIENTS',
    name: 'Commercial Clients',
  },
  RESIDENTIAL_CLIENTS: {
    folder: 'CLIENTS',
    name: 'Residential Clients',
  },

  // Trade Programme
  TRADE_APPLICATIONS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Trade Applications',
  },
  APPROVED_TRADE_MEMBERS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Approved Trade Members',
  },
  PENDING_APPROVAL: {
    folder: 'TRADE_PROGRAMME',
    name: 'Pending Approval',
  },
  ARCHITECTS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Architects',
  },
  INTERIOR_DESIGNERS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Interior Designers',
  },
  DEVELOPERS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Developers',
  },
  HOTELS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Hotels',
  },
  RESTAURANTS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Restaurants',
  },
  PROPERTY_INVESTORS: {
    folder: 'TRADE_PROGRAMME',
    name: 'Property Investors',
  },

  // Membership
  MEMBERSHIP_WAITING_LIST: {
    folder: 'MEMBERSHIP',
    name: 'Waiting List',
  },
  ESSENTIAL_MEMBERS: {
    folder: 'MEMBERSHIP',
    name: 'Essential Members',
  },
  COLLECTOR_MEMBERS: {
    folder: 'MEMBERSHIP',
    name: 'Collector Members',
  },
  PATRON_MEMBERS: {
    folder: 'MEMBERSHIP',
    name: 'Patron Members',
  },
  BLACK_MEMBERS: {
    folder: 'MEMBERSHIP',
    name: 'Black Members',
  },

  // Newsletter
  NEWSLETTER_SUBSCRIBERS: {
    folder: 'NEWSLETTER',
    name: 'Newsletter Subscribers',
  },
  DESIGN_GUIDE_DOWNLOADS: {
    folder: 'NEWSLETTER',
    name: 'Design Guide Downloads',
  },
  JOURNAL_SUBSCRIBERS: {
    folder: 'NEWSLETTER',
    name: 'Journal Subscribers',
  },
  WEEKLY_DIGEST: {
    folder: 'NEWSLETTER',
    name: 'Weekly Digest',
  },
  MONTHLY_EDITORIAL: {
    folder: 'NEWSLETTER',
    name: 'Monthly Editorial',
  },

  // Products & Collections
  FURNITURE_INTEREST: {
    folder: 'PRODUCTS_COLLECTIONS',
    name: 'Furniture Interest',
  },
  DECOR_INTEREST: {
    folder: 'PRODUCTS_COLLECTIONS',
    name: 'Decor Interest',
  },
  LIGHTING_INTEREST: {
    folder: 'PRODUCTS_COLLECTIONS',
    name: 'Lighting Interest',
  },
  ART_INTEREST: {
    folder: 'PRODUCTS_COLLECTIONS',
    name: 'Art Interest',
  },
  TEXTILES_INTEREST: {
    folder: 'PRODUCTS_COLLECTIONS',
    name: 'Textiles Interest',
  },
  LIMITED_EDITION_INTEREST: {
    folder: 'PRODUCTS_COLLECTIONS',
    name: 'Limited Edition Interest',
  },

  // Procurement & Sourcing
  CHINA_SOURCING_CLIENTS: {
    folder: 'PROCUREMENT_SOURCING',
    name: 'China Sourcing Clients',
  },
  PROCUREMENT_CLIENTS: {
    folder: 'PROCUREMENT_SOURCING',
    name: 'Procurement Clients',
  },
  FACTORY_VISITS: {
    folder: 'PROCUREMENT_SOURCING',
    name: 'Factory Visits',
  },
  LOGISTICS_UPDATES: {
    folder: 'PROCUREMENT_SOURCING',
    name: 'Logistics Updates',
  },
  SHIPPING_NOTIFICATIONS: {
    folder: 'PROCUREMENT_SOURCING',
    name: 'Shipping Notifications',
  },

  // Projects
  CONSULTATION_SCHEDULED: {
    folder: 'PROJECTS',
    name: 'Consultation Scheduled',
  },
  DESIGN_PHASE: {
    folder: 'PROJECTS',
    name: 'Design Phase',
  },
  PROCUREMENT_PHASE: {
    folder: 'PROJECTS',
    name: 'Procurement Phase',
  },
  INSTALLATION_PHASE: {
    folder: 'PROJECTS',
    name: 'Installation Phase',
  },
  COMPLETED_PROJECTS: {
    folder: 'PROJECTS',
    name: 'Completed Projects',
  },

  // Supplier Network
  ACTIVE_SUPPLIERS: {
    folder: 'SUPPLIER_NETWORK',
    name: 'Active Suppliers',
  },
  PENDING_SUPPLIERS: {
    folder: 'SUPPLIER_NETWORK',
    name: 'Pending Suppliers',
  },
  INTERNATIONAL_SUPPLIERS: {
    folder: 'SUPPLIER_NETWORK',
    name: 'International Suppliers',
  },
  LOCAL_SUPPLIERS: {
    folder: 'SUPPLIER_NETWORK',
    name: 'Local Suppliers',
  },
  PREFERRED_SUPPLIERS: {
    folder: 'SUPPLIER_NETWORK',
    name: 'Preferred Suppliers',
  },

  // Internal Team
  ADMINISTRATORS: {
    folder: 'INTERNAL_TEAM',
    name: 'Administrators',
  },
  DESIGNERS: {
    folder: 'INTERNAL_TEAM',
    name: 'Designers',
  },
  TEAM_ARCHITECTS: {
    folder: 'INTERNAL_TEAM',
    name: 'Architects',
  },
  PROCUREMENT_TEAM: {
    folder: 'INTERNAL_TEAM',
    name: 'Procurement Team',
  },
  INSTALLERS: {
    folder: 'INTERNAL_TEAM',
    name: 'Installers',
  },
  MARKETING: {
    folder: 'INTERNAL_TEAM',
    name: 'Marketing',
  },
  FINANCE: {
    folder: 'INTERNAL_TEAM',
    name: 'Finance',
  },
  MANAGEMENT: {
    folder: 'INTERNAL_TEAM',
    name: 'Management',
  },

  // Events
  EVENT_INVITATIONS: {
    folder: 'EVENTS',
    name: 'Event Invitations',
  },
  PRIVATE_EVENTS: {
    folder: 'EVENTS',
    name: 'Private Events',
  },
  PRODUCT_LAUNCHES: {
    folder: 'EVENTS',
    name: 'Product Launches',
  },
  DESIGN_WORKSHOPS: {
    folder: 'EVENTS',
    name: 'Design Workshops',
  },
  VIP_EXPERIENCES: {
    folder: 'EVENTS',
    name: 'VIP Experiences',
  },

  // Automation (System-managed)
  NEW_USER_WELCOME: {
    folder: 'AUTOMATION',
    name: 'New User Welcome',
  },
  CONSULTATION_CONFIRMATIONS: {
    folder: 'AUTOMATION',
    name: 'Consultation Confirmations',
  },
  QUOTE_NOTIFICATIONS: {
    folder: 'AUTOMATION',
    name: 'Quote Notifications',
  },
  PAYMENT_NOTIFICATIONS: {
    folder: 'AUTOMATION',
    name: 'Payment Notifications',
  },
  INSTALLATION_UPDATES: {
    folder: 'AUTOMATION',
    name: 'Installation Updates',
  },
  APPOINTMENT_REMINDERS: {
    folder: 'AUTOMATION',
    name: 'Appointment Reminders',
  },
  PROJECT_UPDATES: {
    folder: 'AUTOMATION',
    name: 'Project Updates',
  },
} as const;

export const BREVO_EMAIL_TEMPLATE_FOLDERS = [
  'Authentication',
  'Welcome Emails',
  'Consultation',
  'Quotations',
  'Projects',
  'Procurement',
  'Orders',
  'Payments',
  'Installations',
  'Newsletter',
  'Journal',
  'Trade Programme',
  'Membership',
  'Supplier Portal',
  'AI Concierge',
  'Marketing',
  'Internal Notifications',
] as const;

export const BREVO_CONTACT_ATTRIBUTES = {
  firstName: { type: 'text', required: true },
  lastName: { type: 'text', required: true },
  phone: { type: 'text', required: false },
  country: { type: 'text', required: false },
  city: { type: 'text', required: false },
  company: { type: 'text', required: false },
  clientType: {
    type: 'select',
    options: [
      'Residential',
      'Commercial',
      'Hospitality',
      'Individual',
      'Corporate',
    ],
    required: false,
  },
  leadSource: {
    type: 'select',
    options: [
      'Website',
      'Referral',
      'Social Media',
      'Trade Programme',
      'Event',
      'Direct',
    ],
    required: false,
  },
  serviceInterest: {
    type: 'select-multiple',
    options: [
      'Interior Design',
      'Architecture',
      'Sourcing',
      'Furniture',
      'Lighting',
      'Consultation',
    ],
    required: false,
  },
  projectType: {
    type: 'select',
    options: [
      'Residential',
      'Commercial',
      'Hospitality',
      'Mixed',
      'Consultation Only',
    ],
    required: false,
  },
  membershipLevel: {
    type: 'select',
    options: [
      'Essential',
      'Collector',
      'Patron',
      'Black',
      'None',
    ],
    required: false,
  },
  tradeStatus: {
    type: 'select',
    options: [
      'Not Applied',
      'Pending',
      'Approved',
      'Active',
      'Inactive',
    ],
    required: false,
  },
  supplierStatus: {
    type: 'select',
    options: [
      'Not Supplier',
      'Pending',
      'Active',
      'Preferred',
      'Inactive',
    ],
    required: false,
  },
  preferredCommunication: {
    type: 'select',
    options: ['Email', 'Phone', 'WhatsApp', 'SMS'],
    required: false,
  },
  marketingConsent: { type: 'boolean', required: true },
  preferredLanguage: {
    type: 'select',
    options: ['English', 'Swahili', 'French'],
    required: false,
  },
  dateJoined: { type: 'date', required: false },
  lastInteraction: { type: 'date', required: false },
  assignedStaffMember: { type: 'text', required: false },
} as const;

/**
 * Helper to get contact list by key
 */
export function getContactListByKey(key: keyof typeof BREVO_LISTS) {
  return BREVO_LISTS[key];
}

/**
 * Helper to get all lists for a folder
 */
export function getListsByFolder(folderKey: keyof typeof BREVO_FOLDERS) {
  return Object.entries(BREVO_LISTS).filter(
    ([, list]) => list.folder === folderKey
  );
}
