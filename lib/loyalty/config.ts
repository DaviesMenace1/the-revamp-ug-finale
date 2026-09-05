export const LOYALTY_SETTING_KEY = 'loyalty_program'

export const DEFAULT_LOYALTY_RULES = {
  enabled: true,
  pointsPerUgx: 0.001,
  pointsPerUgxDescription: '1 point per UGX 1,000 of qualifying product spend',
  welcomePoints: 100,
  dailyLoginPoints: 10,
  dailyLoginCap: 1,
  reviewPoints: 50,
  profileCompletionPoints: 100,
  consultationPoints: 100,
  referralSignupPoints: 100,
  referralRewardPoints: 500,
  referralMinimumOrderUgx: 100_000,
  redemptionUgxPerPoint: 10,
  redemptionCapPercent: 20,
  pointsValidityDays: 180,
  tiers: [
    { key: 'member', label: 'Member', lifetimePoints: 0, privileges: ['Access to the Revamp membership space', 'Member stories and studio updates'] },
    { key: 'studio', label: 'Studio', lifetimePoints: 2_500, privileges: ['Early access to selected collections', 'Member-only invitations', 'Priority response on product questions'] },
    { key: 'atelier', label: 'Atelier', lifetimePoints: 10_000, privileges: ['Early access to new releases', 'Preferred consultation scheduling', 'Selected member offers and sourcing support'] },
    { key: 'signature', label: 'Signature', lifetimePoints: 25_000, privileges: ['Private collection previews', 'Priority sourcing and studio access', 'Invitation-led experiences'] },
  ],
} as const

export type LoyaltyRules = {
  enabled: boolean
  pointsPerUgx: number
  pointsPerUgxDescription: string
  welcomePoints: number
  dailyLoginPoints: number
  dailyLoginCap: number
  reviewPoints: number
  profileCompletionPoints: number
  consultationPoints: number
  referralSignupPoints: number
  referralRewardPoints: number
  referralMinimumOrderUgx: number
  redemptionUgxPerPoint: number
  redemptionCapPercent: number
  pointsValidityDays: number
  tiers: ReadonlyArray<{ key: string; label: string; lifetimePoints: number; privileges: ReadonlyArray<string> }>
}

export function normalizeLoyaltyRules(value: Partial<LoyaltyRules> | null | undefined): LoyaltyRules {
  const source = value ?? {}
  const tiers = Array.isArray(source.tiers) && source.tiers.length > 0
    ? source.tiers
        .filter((tier): tier is { key: string; label: string; lifetimePoints: number; privileges?: unknown } => (
          !!tier && typeof tier.key === 'string' && typeof tier.label === 'string' && Number.isFinite(Number(tier.lifetimePoints))
        ))
        .map((tier) => ({
          key: tier.key.slice(0, 30),
          label: tier.label.slice(0, 60),
          lifetimePoints: Math.max(0, Math.floor(Number(tier.lifetimePoints))),
          privileges: Array.isArray(tier.privileges) ? tier.privileges.filter((value): value is string => typeof value === 'string').map((value) => value.trim().slice(0, 160)).filter(Boolean).slice(0, 12) : [],
        }))
        .sort((a, b) => a.lifetimePoints - b.lifetimePoints)
    : [...DEFAULT_LOYALTY_RULES.tiers]

  return {
    enabled: source.enabled !== false,
    pointsPerUgx: clampNumber(source.pointsPerUgx, DEFAULT_LOYALTY_RULES.pointsPerUgx, 0, 1),
    pointsPerUgxDescription: typeof source.pointsPerUgxDescription === 'string' ? source.pointsPerUgxDescription.slice(0, 120) : DEFAULT_LOYALTY_RULES.pointsPerUgxDescription,
    welcomePoints: clampInteger(source.welcomePoints, DEFAULT_LOYALTY_RULES.welcomePoints, 0, 10_000),
    dailyLoginPoints: clampInteger(source.dailyLoginPoints, DEFAULT_LOYALTY_RULES.dailyLoginPoints, 0, 1_000),
    dailyLoginCap: 1,
    reviewPoints: clampInteger(source.reviewPoints, DEFAULT_LOYALTY_RULES.reviewPoints, 0, 5_000),
    profileCompletionPoints: clampInteger(source.profileCompletionPoints, DEFAULT_LOYALTY_RULES.profileCompletionPoints, 0, 10_000),
    consultationPoints: clampInteger(source.consultationPoints, DEFAULT_LOYALTY_RULES.consultationPoints, 0, 10_000),
    referralSignupPoints: clampInteger(source.referralSignupPoints, DEFAULT_LOYALTY_RULES.referralSignupPoints, 0, 10_000),
    referralRewardPoints: clampInteger(source.referralRewardPoints, DEFAULT_LOYALTY_RULES.referralRewardPoints, 0, 25_000),
    referralMinimumOrderUgx: clampInteger(source.referralMinimumOrderUgx, DEFAULT_LOYALTY_RULES.referralMinimumOrderUgx, 0, 100_000_000),
    redemptionUgxPerPoint: clampInteger(source.redemptionUgxPerPoint, DEFAULT_LOYALTY_RULES.redemptionUgxPerPoint, 1, 1_000),
    redemptionCapPercent: clampInteger(source.redemptionCapPercent, DEFAULT_LOYALTY_RULES.redemptionCapPercent, 1, 50),
    pointsValidityDays: clampInteger(source.pointsValidityDays, DEFAULT_LOYALTY_RULES.pointsValidityDays, 0, 730),
    tiers,
  }
}

function clampInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, Math.floor(parsed))) : fallback
}

function clampNumber(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback
}

export function getLoyaltyTier(lifetimePoints: number, rules: LoyaltyRules) {
  return [...rules.tiers].reverse().find((tier) => lifetimePoints >= tier.lifetimePoints) ?? rules.tiers[0]
}
