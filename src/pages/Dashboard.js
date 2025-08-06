/**
 * Dashboard Page Component
 * Clean dashboard without layout wrappers
 */

import { createMobileHeader } from '../layouts/MainLayout.js'

export function renderDashboard(isOnline, useDatabase) {
    return `
        ${createMobileHeader('Dashboard', '🏠')}
        
        <!-- Main Content -->
        <div class="p-6 bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
            <!-- Header Section -->
            <div class="mb-8">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span class="text-white text-2xl">📊</span>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">Dashboard RELI</h1>
                        <p class="text-gray-600">Rangkuman Earnings Lintas-Industri untuk Driver Ojol</p>
                    </div>
                </div>
                
                <!-- Welcome Card -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                    <div class="text-center">
                        <h2 class="text-2xl lg:text-3xl font-bold mb-3">Selamat Datang di RELI</h2>
                        <p class="text-lg opacity-90 mb-6">Dashboard AI-powered untuk mengoptimalkan pendapatan driver ojol</p>
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <button class="btn btn-white btn-lg gap-2 shadow-lg hover:shadow-xl transition-all" onclick="navigateTo('input')">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Input Data Hari Ini
                            </button>
                            <button class="btn btn-outline btn-white btn-lg gap-2 hover:bg-white hover:text-blue-600 transition-all" onclick="navigateTo('analytics')">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                                Lihat Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- Total Kotor Card -->
                <div class="bg-white rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <span class="text-2xl">💰</span>
                        </div>
                        <div class="flex-1">
                            <div class="text-sm text-green-600 font-medium">Total Kotor</div>
                            <div class="text-sm text-green-500">Dari semua platform</div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="text-2xl font-bold text-green-700" id="total-kotor">Rp 563.000</div>
                    </div>
                </div>

                <!-- Biaya BBM Card -->
                <div class="bg-white rounded-2xl p-6 shadow-lg border border-yellow-100 hover:shadow-xl transition-all">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <span class="text-2xl">⛽</span>
                        </div>
                        <div class="flex-1">
                            <div class="text-sm text-yellow-600 font-medium">Biaya BBM</div>
                            <div class="text-sm text-yellow-500">24.2 liter</div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="text-2xl font-bold text-yellow-700" id="total-bbm">Rp 212.296</div>
                    </div>
                </div>

                <!-- Biaya Tambahan Card -->
                <div class="bg-white rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transition-all">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <span class="text-2xl">💸</span>
                        </div>
                        <div class="flex-1">
                            <div class="text-sm text-red-600 font-medium">Biaya Tambahan</div>
                            <div class="text-sm text-red-500">Operasional harian</div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="text-2xl font-bold text-red-700" id="total-tambahan">Rp 250.000</div>
                    </div>
                </div>

                <!-- Pendapatan Bersih Card -->
                <div class="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span class="text-2xl">💎</span>
                        </div>
                        <div class="flex-1">
                            <div class="text-sm text-blue-600 font-medium">Pendapatan Bersih</div>
                            <div class="text-sm text-blue-500">Profit hari ini</div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="text-2xl font-bold text-blue-700" id="pendapatan-bersih">Rp 100.704</div>
                    </div>
                </div>
            </div>

            <!-- Breakdown Section -->
            <div class="bg-white rounded-2xl p-6 shadow-lg">
                <div class="flex items-center gap-3 mb-6">
                    <span class="text-2xl">📊</span>
                    <h3 class="text-xl font-bold text-gray-800">Breakdown Perhitungan</h3>
                </div>
                
                <div class="bg-gray-50 rounded-xl p-6 text-center">
                    <div class="text-lg font-semibold text-gray-700 mb-4">
                        Pendapatan Bersih = Total Kotor - Biaya BBM - Biaya Tambahan
                    </div>
                    <div class="text-2xl font-bold text-gray-800">
                        <span class="text-green-600">Rp 563.000</span> - 
                        <span class="text-yellow-600">Rp 212.296</span> - 
                        <span class="text-red-600">Rp 250.000</span> = 
                        <span class="text-blue-600">Rp 100.704</span>
                    </div>
                </div>
            </div>
        </div>
    `
}
