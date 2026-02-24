import { NextRequest, NextResponse } from 'next/server'
import {
  normalizeMockDraftSettings,
  runMockDraft,
  type MockDraftSettings,
} from '@/lib/fantasy/mockDraftEngine'

const TEAM_OPTIONS = [10, 12, 14]
const ROUND_OPTIONS = [12, 15, 18]
const SCORING_OPTIONS = ['ppr', 'half_ppr', 'standard']
const STRATEGY_OPTIONS = [
  'balanced',
  'hero_rb',
  'zero_rb',
  'elite_qb',
  'upside_chaser',
]

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, unknown>
}

function maybeNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) return undefined
  return value
}

function maybeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function validatePayload(payload: Partial<MockDraftSettings>): string[] {
  const errors: string[] = []

  if (typeof payload.teams === 'number' && !TEAM_OPTIONS.includes(payload.teams)) {
    errors.push(`teams must be one of: ${TEAM_OPTIONS.join(', ')}`)
  }

  if (typeof payload.rounds === 'number' && !ROUND_OPTIONS.includes(payload.rounds)) {
    errors.push(`rounds must be one of: ${ROUND_OPTIONS.join(', ')}`)
  }

  if (
    typeof payload.draftSlot === 'number' &&
    typeof payload.teams === 'number' &&
    (payload.draftSlot < 1 || payload.draftSlot > payload.teams)
  ) {
    errors.push('draftSlot must be between 1 and teams')
  }

  if (
    typeof payload.scoring === 'string' &&
    !SCORING_OPTIONS.includes(payload.scoring)
  ) {
    errors.push(`scoring must be one of: ${SCORING_OPTIONS.join(', ')}`)
  }

  if (
    typeof payload.strategy === 'string' &&
    !STRATEGY_OPTIONS.includes(payload.strategy)
  ) {
    errors.push(`strategy must be one of: ${STRATEGY_OPTIONS.join(', ')}`)
  }

  return errors
}

export async function POST(request: NextRequest) {
  try {
    const body = asRecord(await request.json())

    const incoming: Partial<MockDraftSettings> = {
      teams: maybeNumber(body.teams),
      rounds: maybeNumber(body.rounds),
      draftSlot: maybeNumber(body.draftSlot),
      scoring: maybeString(body.scoring) as MockDraftSettings['scoring'],
      strategy: maybeString(body.strategy) as MockDraftSettings['strategy'],
      seed:
        typeof body.seed === 'number' || typeof body.seed === 'string'
          ? body.seed
          : undefined,
    }

    const validationErrors = validatePayload(incoming)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { ok: false, errors: validationErrors },
        { status: 400 }
      )
    }

    const settings = normalizeMockDraftSettings(incoming)
    const result = runMockDraft(settings)

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('mock draft simulation failed', error)
    return NextResponse.json(
      { ok: false, error: 'Unable to run mock draft simulation' },
      { status: 500 }
    )
  }
}
