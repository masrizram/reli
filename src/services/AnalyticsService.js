/**
 * Analytics Service
 * Handles data analysis and statistics for RELI application
 */

import { databaseService } from './DatabaseService.js'

export class AnalyticsService {
    
    /**
     * Get analytics data from storage
     */
    async getAnalyticsData(days = 30) {
        try {
            let data = {}
            
            // Try to get data from database first
            if (window.useDatabase && window.isOnline) {
                const dbResult = await databaseService.getAllDailyRecords(days)
                if (dbResult.success) {
                    // Convert database format to analytics format
                    dbResult.data.forEach(record => {
                        data[record.date] = {
                            platforms: record.platforms,
                            fuel: record.fuel,
                            additionalCosts: record.additional_costs,
                            results: record.results,
                            timestamp: record.created_at
                        }
                    })
                }
            }
            
            // Fallback to localStorage if no database data
            if (Object.keys(data).length === 0) {
                data = JSON.parse(localStorage.getItem('reli-data') || '{}')
            }
            
            return { success: true, data }
            
        } catch (error) {
            console.error('Error getting analytics data:', error)
            return { success: false, error: error.message }
        }
    }
    
    /**
     * Calculate daily statistics
     */
    async getDailyStats(days = 7) {
        const result = await this.getAnalyticsData(days)
        if (!result.success) return result
        
        const data = result.data
        const dates = Object.keys(data).sort().slice(-days)
        
        const stats = {
            dates: [],
            totalKotor: [],
            biayaBBM: [],
            biayaTambahan: [],
            pendapatanBersih: [],
            platforms: {
                grab: [],
                maxim: [],
                gojek: [],
                indrive: []
            }
        }
        
        dates.forEach(date => {
            const dayData = data[date]
            if (dayData && dayData.results) {
                stats.dates.push(new Date(date).toLocaleDateString('id-ID', { 
                    day: '2-digit', 
                    month: 'short' 
                }))
                stats.totalKotor.push(dayData.results.totalKotor || 0)
                stats.biayaBBM.push(dayData.results.biayaBBM || 0)
                stats.biayaTambahan.push(dayData.results.totalAdditionalCosts || 0)
                stats.pendapatanBersih.push(dayData.results.pendapatanBersih || 0)
                
                // Platform breakdown
                if (dayData.platforms) {
                    stats.platforms.grab.push(dayData.platforms.grab?.kotor || 0)
                    stats.platforms.maxim.push(dayData.platforms.maxim?.kotor || 0)
                    stats.platforms.gojek.push(dayData.platforms.gojek?.kotor || 0)
                    stats.platforms.indrive.push(dayData.platforms.indrive?.kotor || 0)
                }
            }
        })
        
        return { success: true, data: stats }
    }
    
    /**
     * Calculate summary statistics
     */
    async getSummaryStats(days = 30) {
        const result = await this.getAnalyticsData(days)
        if (!result.success) return result
        
        const data = result.data
        const entries = Object.entries(data)
            .filter(([date, dayData]) => dayData.results)
            .slice(-days)
        
        if (entries.length === 0) {
            return { 
                success: true, 
                data: {
                    totalDays: 0,
                    totalEarnings: 0,
                    totalExpenses: 0,
                    averageEarnings: 0,
                    averageExpenses: 0,
                    bestDay: null,
                    worstDay: null,
                    totalDistance: 0,
                    totalFuel: 0,
                    averageFuelConsumption: 0,
                    platformBreakdown: {
                        grab: 0,
                        maxim: 0,
                        gojek: 0,
                        indrive: 0
                    }
                }
            }
        }
        
        const earnings = entries.map(([date, data]) => ({
            date,
            earnings: data.results.pendapatanBersih || 0,
            expenses: (data.results.biayaBBM || 0) + (data.results.totalAdditionalCosts || 0),
            distance: data.fuel?.jarak || 0,
            fuel: data.fuel?.literTerpakai || 0
        }))
        
        const totalEarnings = earnings.reduce((sum, day) => sum + day.earnings, 0)
        const totalExpenses = earnings.reduce((sum, day) => sum + day.expenses, 0)
        const totalDistance = earnings.reduce((sum, day) => sum + day.distance, 0)
        const totalFuel = earnings.reduce((sum, day) => sum + day.fuel, 0)
        
        const sortedByEarnings = earnings.sort((a, b) => b.earnings - a.earnings)
        
        // Platform breakdown
        const platformTotals = { grab: 0, maxim: 0, gojek: 0, indrive: 0 }
        entries.forEach(([date, dayData]) => {
            if (dayData.platforms) {
                Object.keys(platformTotals).forEach(platform => {
                    platformTotals[platform] += dayData.platforms[platform]?.kotor || 0
                })
            }
        })
        
        const stats = {
            totalDays: entries.length,
            totalEarnings,
            totalExpenses,
            averageEarnings: totalEarnings / entries.length,
            averageExpenses: totalExpenses / entries.length,
            bestDay: sortedByEarnings[0],
            worstDay: sortedByEarnings[sortedByEarnings.length - 1],
            totalDistance,
            totalFuel,
            averageFuelConsumption: totalDistance > 0 ? totalDistance / totalFuel : 0,
            platformBreakdown: platformTotals
        }
        
        return { success: true, data: stats }
    }
    
    /**
     * Get trend analysis
     */
    async getTrendAnalysis(days = 14) {
        const result = await this.getDailyStats(days)
        if (!result.success) return result
        
        const stats = result.data
        const earnings = stats.pendapatanBersih
        
        if (earnings.length < 2) {
            return { 
                success: true, 
                data: { trend: 'insufficient_data', change: 0, message: 'Data tidak cukup untuk analisis trend' }
            }
        }
        
        // Calculate trend using simple linear regression
        const n = earnings.length
        const x = Array.from({ length: n }, (_, i) => i)
        const y = earnings
        
        const sumX = x.reduce((a, b) => a + b, 0)
        const sumY = y.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n
        
        // Calculate percentage change from first to last
        const firstWeek = earnings.slice(0, Math.floor(n/2))
        const lastWeek = earnings.slice(Math.floor(n/2))
        
        const firstAvg = firstWeek.reduce((a, b) => a + b, 0) / firstWeek.length
        const lastAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length
        
        const percentChange = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0
        
        let trend = 'stable'
        let message = 'Pendapatan relatif stabil'
        
        if (percentChange > 10) {
            trend = 'increasing'
            message = `Pendapatan meningkat ${percentChange.toFixed(1)}% dalam periode ini`
        } else if (percentChange < -10) {
            trend = 'decreasing'
            message = `Pendapatan menurun ${Math.abs(percentChange).toFixed(1)}% dalam periode ini`
        }
        
        return {
            success: true,
            data: {
                trend,
                change: percentChange,
                message,
                slope,
                intercept
            }
        }
    }
}

// Create singleton instance
export const analyticsService = new AnalyticsService()