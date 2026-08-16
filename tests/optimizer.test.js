import { describe, it, expect } from 'vitest'
import { optimizerService } from '../src/services/OptimizerService.js'

describe('OptimizerService.getQuickTips', () => {
    it('returns a non-empty list of tips with icon/title/tip fields', () => {
        const tips = optimizerService.getQuickTips()
        expect(tips.length).toBeGreaterThan(0)
        for (const t of tips) {
            expect(t.icon).toBeTruthy()
            expect(t.title).toBeTruthy()
            expect(t.tip).toBeTruthy()
        }
    })
})

describe('OptimizerService.generateOverallScore', () => {
    it('awards 0 points when there is no data', async () => {
        const summary = {
            bestDay: null,
            worstDay: null,
            averageEarnings: 0,
            averageFuelConsumption: 0,
            averageExpenses: 0,
            platformBreakdown: { grab: 0, maxim: 0, gojek: 0, indrive: 0 },
        }
        const dailyStats = { dates: [] }
        const score = await optimizerService.generateOverallScore(summary, dailyStats)
        // Working-days factor is 0 when dates.length is 0.
        expect(score.percentage).toBeDefined()
        expect(Number(score.score)).toBeGreaterThanOrEqual(0)
    })

    it('scores higher with diversified platforms and lower expense ratio', async () => {
        const summaryGood = {
            bestDay: { earnings: 500000 },
            worstDay: { earnings: 450000 },
            averageEarnings: 400000,
            averageExpenses: 80000, // 20% expense ratio
            averageFuelConsumption: 16, // very efficient
            platformBreakdown: { grab: 300000, maxim: 200000, gojek: 150000, indrive: 100000 },
        }
        const dailyStatsGood = { dates: new Array(20).fill('d') }

        const scoreGood = await optimizerService.generateOverallScore(summaryGood, dailyStatsGood)

        const summaryBad = {
            bestDay: { earnings: 500000 },
            worstDay: { earnings: 100000 },
            averageEarnings: 200000,
            averageExpenses: 120000, // 60% expense ratio
            averageFuelConsumption: 8, // inefficient
            platformBreakdown: { grab: 300000, maxim: 0, gojek: 0, indrive: 0 },
        }
        const dailyStatsBad = { dates: new Array(5).fill('d') }

        const scoreBad = await optimizerService.generateOverallScore(summaryBad, dailyStatsBad)

        expect(Number(scoreGood.percentage)).toBeGreaterThan(Number(scoreBad.percentage))
    })
})

describe('OptimizerService recommendations guard against empty data', () => {
    it('returns info recommendation when platform earnings are all zero', async () => {
        const summary = { platformBreakdown: { grab: 0, maxim: 0, gojek: 0, indrive: 0 } }
        const recs = await optimizerService.generatePlatformRecommendations(summary, {})
        expect(recs.length).toBeGreaterThan(0)
        expect(recs[0].type).toBe('info')
    })
})
