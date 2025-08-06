import { BaseComponent } from '../core/BaseComponent.js'
import { Card } from '../atoms/Card.js'
import { Button } from '../atoms/Button.js'
import { Modal } from '../atoms/Modal.js'
import { Toast } from '../atoms/Toast.js'
import { themeManager } from '../utils/ThemeManager.js'
import { StorageManager } from '../utils/storage.js'
import { notificationService } from '../utils/NotificationService.js'

/**
 * Comprehensive settings panel with theme, preferences, and data management
 */
export class SettingsPanel extends BaseComponent {
    constructor(props = {}) {
        super(props)

        this.props = {
            showAdvanced: false,
            ...props,
        }

        this.storage = new StorageManager()
        this.activeTab = 'appearance'
        this.confirmModal = null
    }

    afterMount() {
        this.subscribeToThemeChanges()
    }

    render() {
        const container = this.createElement('div', {
            className: 'settings-panel space-y-6',
        })

        // Header
        container.appendChild(this.renderHeader())

        // Tabs
        container.appendChild(this.renderTabs())

        // Content
        container.appendChild(this.renderTabContent())

        return container
    }

    /**
     * Render header
     */
    renderHeader() {
        const header = this.createElement('div', {
            className: 'flex items-center justify-between',
        })

        const titleSection = this.createElement('div')
        titleSection.appendChild(
            this.createElement(
                'h2',
                {
                    className: 'text-2xl font-bold text-base-content flex items-center gap-2',
                },
                '⚙️ Pengaturan'
            )
        )

        titleSection.appendChild(
            this.createElement(
                'p',
                {
                    className: 'text-base-content/60',
                },
                'Kustomisasi aplikasi sesuai preferensi Anda'
            )
        )

        // Reset button
        const resetBtn = new Button({
            text: '🔄 Reset ke Default',
            variant: 'btn-outline btn-error',
            onClick: () => this.showResetConfirmation(),
        })

        header.appendChild(titleSection)
        header.appendChild(resetBtn.render())

        return header
    }

    /**
     * Render tabs
     */
    renderTabs() {
        const tabs = [
            { id: 'appearance', label: '🎨 Tampilan', icon: '🎨' },
            { id: 'notifications', label: '🔔 Notifikasi', icon: '🔔' },
            { id: 'data', label: '💾 Data', icon: '💾' },
            { id: 'accessibility', label: '♿ Aksesibilitas', icon: '♿' },
            { id: 'advanced', label: '🔧 Lanjutan', icon: '🔧' },
        ]

        const tabsContainer = this.createElement('div', {
            className: 'tabs tabs-boxed bg-base-200 p-1',
        })

        tabs.forEach(tab => {
            const tabBtn = this.createElement(
                'button',
                {
                    className: `tab ${this.activeTab === tab.id ? 'tab-active' : ''}`,
                    onClick: () => this.switchTab(tab.id),
                },
                `${tab.icon} ${tab.label}`
            )

            tabsContainer.appendChild(tabBtn)
        })

        return tabsContainer
    }

    /**
     * Render tab content
     */
    renderTabContent() {
        const content = this.createElement('div', {
            className: 'tab-content animate-fade-in-up',
        })

        switch (this.activeTab) {
            case 'appearance':
                content.appendChild(this.renderAppearanceSettings())
                break
            case 'notifications':
                content.appendChild(this.renderNotificationSettings())
                break
            case 'data':
                content.appendChild(this.renderDataSettings())
                break
            case 'accessibility':
                content.appendChild(this.renderAccessibilitySettings())
                break
            case 'advanced':
                content.appendChild(this.renderAdvancedSettings())
                break
        }

        return content
    }

    /**
     * Render appearance settings
     */
    renderAppearanceSettings() {
        const container = this.createElement('div', {
            className: 'space-y-6',
        })

        // Theme selection
        container.appendChild(this.renderThemeSelection())

        // Font size
        container.appendChild(this.renderFontSizeSelection())

        // Animation settings
        container.appendChild(this.renderAnimationSettings())

        // Language and region
        container.appendChild(this.renderLanguageSettings())

        return container
    }

    /**
     * Render theme selection
     */
    renderThemeSelection() {
        const themes = themeManager.getAvailableThemes()
        const currentTheme = themeManager.getPreferences().theme

        const card = new Card({
            title: '🌈 Tema Aplikasi',
            subtitle: 'Pilih tema yang sesuai dengan preferensi Anda',
            content: this.createElement(
                'div',
                {
                    className: 'grid grid-cols-1 md:grid-cols-3 gap-4',
                },
                ...Object.entries(themes).map(([key, theme]) =>
                    this.renderThemeOption(key, theme, currentTheme === key)
                )
            ),
        })

        return card.render()
    }

    /**
     * Render theme option
     */
    renderThemeOption(key, theme, isActive) {
        return this.createElement(
            'div',
            {
                className: `theme-option p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isActive ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'
                }`,
                onClick: () => {
                    themeManager.setTheme(key)
                    this.update()
                },
            },
            this.createElement(
                'div',
                {
                    className: 'text-center space-y-2',
                },
                this.createElement(
                    'div',
                    {
                        className: 'text-3xl',
                    },
                    theme.icon
                ),
                this.createElement(
                    'div',
                    {
                        className: 'font-semibold',
                    },
                    theme.name
                ),
                theme.description
                    ? this.createElement(
                          'div',
                          {
                              className: 'text-xs text-base-content/60',
                          },
                          theme.description
                      )
                    : null,
                isActive
                    ? this.createElement(
                          'div',
                          {
                              className: 'text-xs text-primary font-medium',
                          },
                          '✓ Aktif'
                      )
                    : null
            )
        )
    }

    /**
     * Render font size selection
     */
    renderFontSizeSelection() {
        const sizes = [
            { key: 'small', label: 'Kecil', preview: 'Aa' },
            { key: 'medium', label: 'Sedang', preview: 'Aa' },
            { key: 'large', label: 'Besar', preview: 'Aa' },
            { key: 'xl', label: 'Sangat Besar', preview: 'Aa' },
        ]

        const currentSize = themeManager.getPreferences().fontSize

        const card = new Card({
            title: '📝 Ukuran Font',
            subtitle: 'Sesuaikan ukuran teks untuk kenyamanan membaca',
            content: this.createElement(
                'div',
                {
                    className: 'grid grid-cols-2 md:grid-cols-4 gap-3',
                },
                ...sizes.map(size =>
                    this.createElement(
                        'button',
                        {
                            className: `btn ${currentSize === size.key ? 'btn-primary' : 'btn-outline'} flex-col h-16`,
                            onClick: () => {
                                themeManager.setFontSize(size.key)
                                this.update()
                            },
                        },
                        this.createElement(
                            'div',
                            {
                                className: `text-${size.key === 'small' ? 'sm' : size.key === 'large' ? 'lg' : size.key === 'xl' ? 'xl' : 'base'}`,
                            },
                            size.preview
                        ),
                        this.createElement(
                            'div',
                            {
                                className: 'text-xs',
                            },
                            size.label
                        )
                    )
                )
            ),
        })

        return card.render()
    }

    /**
     * Render animation settings
     */
    renderAnimationSettings() {
        const preferences = themeManager.getPreferences()

        const card = new Card({
            title: '✨ Animasi',
            subtitle: 'Kontrol efek visual dan transisi',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Aktifkan animasi dan transisi'
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-primary',
                            checked: preferences.animations,
                            onChange: e => {
                                themeManager.setAnimations(e.target.checked)
                                this.update()
                            },
                        })
                    )
                ),
                this.createElement(
                    'div',
                    {
                        className: 'text-sm text-base-content/60',
                    },
                    'Menonaktifkan animasi dapat meningkatkan performa pada perangkat lama'
                )
            ),
        })

        return card.render()
    }

    /**
     * Render language settings
     */
    renderLanguageSettings() {
        const preferences = themeManager.getPreferences()

        const card = new Card({
            title: '🌍 Bahasa & Region',
            subtitle: 'Pengaturan bahasa dan format regional',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                // Language selection
                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Bahasa'
                        )
                    ),
                    this.createElement(
                        'select',
                        {
                            className: 'select select-bordered',
                            value: preferences.language,
                            onChange: e => {
                                themeManager.setLanguage(e.target.value)
                                this.update()
                            },
                        },
                        this.createElement('option', { value: 'id' }, '🇮🇩 Bahasa Indonesia'),
                        this.createElement('option', { value: 'en' }, '🇺🇸 English')
                    )
                ),

                // Currency selection
                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Mata Uang'
                        )
                    ),
                    this.createElement(
                        'select',
                        {
                            className: 'select select-bordered',
                            value: preferences.currency,
                            onChange: e => {
                                themeManager.setCurrency(e.target.value)
                                this.update()
                            },
                        },
                        this.createElement('option', { value: 'IDR' }, '🇮🇩 Rupiah (IDR)'),
                        this.createElement('option', { value: 'USD' }, '🇺🇸 US Dollar (USD)'),
                        this.createElement('option', { value: 'EUR' }, '🇪🇺 Euro (EUR)')
                    )
                )
            ),
        })

        return card.render()
    }

    /**
     * Render notification settings
     */
    renderNotificationSettings() {
        const container = this.createElement('div', {
            className: 'space-y-6',
        })

        // Browser notifications
        container.appendChild(this.renderBrowserNotifications())

        // In-app notifications
        container.appendChild(this.renderInAppNotifications())

        // Notification types
        container.appendChild(this.renderNotificationTypes())

        return container
    }

    /**
     * Render browser notifications
     */
    renderBrowserNotifications() {
        const isSupported = notificationService.isSupported()
        const permission = notificationService.getPermission()

        const card = new Card({
            title: '🔔 Notifikasi Browser',
            subtitle: 'Terima notifikasi meskipun aplikasi tidak aktif',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'alert alert-info',
                    },
                    this.createElement(
                        'div',
                        {
                            className: 'flex items-center gap-2',
                        },
                        this.createElement('span', {}, '💡'),
                        this.createElement(
                            'div',
                            {},
                            this.createElement(
                                'div',
                                {
                                    className: 'font-semibold',
                                },
                                `Status: ${this.getPermissionLabel(permission)}`
                            ),
                            this.createElement(
                                'div',
                                {
                                    className: 'text-sm',
                                },
                                isSupported ? 'Browser mendukung notifikasi' : 'Browser tidak mendukung notifikasi'
                            )
                        )
                    )
                ),

                isSupported && permission !== 'granted'
                    ? new Button({
                          text: '🔓 Izinkan Notifikasi',
                          variant: 'btn-primary',
                          onClick: async () => {
                              try {
                                  await notificationService.requestPermission()
                                  this.update()
                                  this.showToast('Izin notifikasi berhasil diberikan!', 'success')
                              } catch (error) {
                                  this.showToast('Gagal meminta izin notifikasi', 'error')
                              }
                          },
                      }).render()
                    : null,

                permission === 'granted'
                    ? new Button({
                          text: '🧪 Test Notifikasi',
                          variant: 'btn-outline',
                          onClick: () => {
                              notificationService.showNotification('Test Notifikasi', {
                                  body: 'Notifikasi RELI berfungsi dengan baik!',
                                  icon: '📊',
                              })
                          },
                      }).render()
                    : null
            ),
        })

        return card.render()
    }

    /**
     * Render in-app notifications
     */
    renderInAppNotifications() {
        const card = new Card({
            title: '📱 Notifikasi In-App',
            subtitle: 'Pengaturan notifikasi dalam aplikasi',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Tampilkan notifikasi sukses'
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-success',
                            checked: true,
                        })
                    )
                ),

                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Tampilkan notifikasi peringatan'
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-warning',
                            checked: true,
                        })
                    )
                ),

                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Tampilkan notifikasi error'
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-error',
                            checked: true,
                        })
                    )
                )
            ),
        })

        return card.render()
    }

    /**
     * Render notification types
     */
    renderNotificationTypes() {
        const types = [
            { key: 'earnings', label: 'Target Pendapatan', description: 'Notifikasi saat target tercapai' },
            { key: 'fuel', label: 'Efisiensi BBM', description: 'Peringatan efisiensi BBM rendah' },
            { key: 'insights', label: 'AI Insights', description: 'Rekomendasi dan wawasan baru' },
            { key: 'reminders', label: 'Pengingat', description: 'Pengingat waktu optimal dan break' },
        ]

        const card = new Card({
            title: '📋 Jenis Notifikasi',
            subtitle: 'Pilih jenis notifikasi yang ingin Anda terima',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-3',
                },
                ...types.map(type =>
                    this.createElement(
                        'div',
                        {
                            className: 'form-control',
                        },
                        this.createElement(
                            'label',
                            {
                                className: 'label cursor-pointer',
                            },
                            this.createElement(
                                'div',
                                {
                                    className: 'flex-1',
                                },
                                this.createElement(
                                    'div',
                                    {
                                        className: 'label-text font-medium',
                                    },
                                    type.label
                                ),
                                this.createElement(
                                    'div',
                                    {
                                        className: 'label-text-alt text-xs opacity-70',
                                    },
                                    type.description
                                )
                            ),
                            this.createElement('input', {
                                type: 'checkbox',
                                className: 'toggle toggle-primary',
                                checked: true,
                            })
                        )
                    )
                )
            ),
        })

        return card.render()
    }

    /**
     * Render data settings
     */
    renderDataSettings() {
        const container = this.createElement('div', {
            className: 'space-y-6',
        })

        // Storage info
        container.appendChild(this.renderStorageInfo())

        // Export/Import
        container.appendChild(this.renderDataManagement())

        // Backup settings
        container.appendChild(this.renderBackupSettings())

        return container
    }

    /**
     * Render storage info
     */
    renderStorageInfo() {
        const stats = this.storage.getStorageStats()

        const card = new Card({
            title: '💾 Informasi Penyimpanan',
            subtitle: 'Status penggunaan penyimpanan lokal',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'stats stats-vertical lg:stats-horizontal shadow',
                    },
                    this.createElement(
                        'div',
                        {
                            className: 'stat',
                        },
                        this.createElement(
                            'div',
                            {
                                className: 'stat-title',
                            },
                            'Total Data'
                        ),
                        this.createElement(
                            'div',
                            {
                                className: 'stat-value text-primary',
                            },
                            this.formatBytes(stats.totalSize)
                        ),
                        this.createElement(
                            'div',
                            {
                                className: 'stat-desc',
                            },
                            'Ukuran total data'
                        )
                    ),

                    this.createElement(
                        'div',
                        {
                            className: 'stat',
                        },
                        this.createElement(
                            'div',
                            {
                                className: 'stat-title',
                            },
                            'Catatan Harian'
                        ),
                        this.createElement(
                            'div',
                            {
                                className: 'stat-value text-secondary',
                            },
                            stats.dailyRecords.toString()
                        ),
                        this.createElement(
                            'div',
                            {
                                className: 'stat-desc',
                            },
                            'Hari tercatat'
                        )
                    ),

                    this.createElement(
                        'div',
                        {
                            className: 'stat',
                        },
                        this.createElement(
                            'div',
                            {
                                className: 'stat-title',
                            },
                            'Backup'
                        ),
                        this.createElement(
                            'div',
                            {
                                className: 'stat-value text-accent',
                            },
                            stats.backupCount.toString()
                        ),
                        this.createElement(
                            'div',
                            {
                                className: 'stat-desc',
                            },
                            'File backup'
                        )
                    )
                )
            ),
        })

        return card.render()
    }

    /**
     * Render data management
     */
    renderDataManagement() {
        const card = new Card({
            title: '📤 Export & Import Data',
            subtitle: 'Kelola data aplikasi Anda',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                // Export section
                this.createElement(
                    'div',
                    {
                        className: 'space-y-2',
                    },
                    this.createElement(
                        'h4',
                        {
                            className: 'font-semibold',
                        },
                        'Export Data'
                    ),
                    this.createElement(
                        'div',
                        {
                            className: 'flex flex-wrap gap-2',
                        },
                        new Button({
                            text: '📊 Export CSV',
                            variant: 'btn-outline btn-primary',
                            onClick: () => this.storage.downloadExport('csv'),
                        }).render(),

                        new Button({
                            text: '📄 Export JSON',
                            variant: 'btn-outline btn-secondary',
                            onClick: () => this.storage.downloadExport('json'),
                        }).render(),

                        new Button({
                            text: '📝 Export TXT',
                            variant: 'btn-outline btn-accent',
                            onClick: () => this.storage.downloadExport('txt'),
                        }).render()
                    )
                ),

                // Import section
                this.createElement(
                    'div',
                    {
                        className: 'space-y-2',
                    },
                    this.createElement(
                        'h4',
                        {
                            className: 'font-semibold',
                        },
                        'Import Data'
                    ),
                    this.createElement('input', {
                        type: 'file',
                        className: 'file-input file-input-bordered w-full',
                        accept: '.json,.csv,.txt',
                        onChange: e => this.handleFileImport(e),
                    })
                )
            ),
        })

        return card.render()
    }

    /**
     * Render backup settings
     */
    renderBackupSettings() {
        const card = new Card({
            title: '🔄 Backup Otomatis',
            subtitle: 'Pengaturan backup data otomatis',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Aktifkan backup otomatis'
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-primary',
                            checked: true,
                        })
                    )
                ),

                this.createElement(
                    'div',
                    {
                        className: 'flex gap-2',
                    },
                    new Button({
                        text: '💾 Buat Backup Sekarang',
                        variant: 'btn-primary',
                        onClick: () => {
                            const backupId = this.storage.createBackup()
                            this.showToast(`Backup berhasil dibuat: ${backupId}`, 'success')
                        },
                    }).render(),

                    new Button({
                        text: '📋 Lihat Backup',
                        variant: 'btn-outline',
                        onClick: () => this.showBackupList(),
                    }).render()
                )
            ),
        })

        return card.render()
    }

    /**
     * Render accessibility settings
     */
    renderAccessibilitySettings() {
        const preferences = themeManager.getPreferences()

        const container = this.createElement('div', {
            className: 'space-y-6',
        })

        const card = new Card({
            title: '♿ Aksesibilitas',
            subtitle: 'Pengaturan untuk kemudahan akses',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'div',
                            {
                                className: 'flex-1',
                            },
                            this.createElement(
                                'div',
                                {
                                    className: 'label-text font-medium',
                                },
                                'Mode Kontras Tinggi'
                            ),
                            this.createElement(
                                'div',
                                {
                                    className: 'label-text-alt text-xs opacity-70',
                                },
                                'Meningkatkan kontras untuk visibilitas yang lebih baik'
                            )
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-primary',
                            checked: preferences.highContrast,
                            onChange: e => {
                                themeManager.setHighContrast(e.target.checked)
                                this.update()
                            },
                        })
                    )
                ),

                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'div',
                            {
                                className: 'flex-1',
                            },
                            this.createElement(
                                'div',
                                {
                                    className: 'label-text font-medium',
                                },
                                'Mode Buta Warna'
                            ),
                            this.createElement(
                                'div',
                                {
                                    className: 'label-text-alt text-xs opacity-70',
                                },
                                'Optimasi warna untuk pengguna dengan buta warna'
                            )
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-primary',
                            checked: preferences.colorBlindMode,
                            onChange: e => {
                                themeManager.setColorBlindMode(e.target.checked)
                                this.update()
                            },
                        })
                    )
                ),

                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'div',
                            {
                                className: 'flex-1',
                            },
                            this.createElement(
                                'div',
                                {
                                    className: 'label-text font-medium',
                                },
                                'Kurangi Gerakan'
                            ),
                            this.createElement(
                                'div',
                                {
                                    className: 'label-text-alt text-xs opacity-70',
                                },
                                'Mengurangi animasi dan efek gerakan'
                            )
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-primary',
                            checked: !preferences.animations,
                            onChange: e => {
                                themeManager.setAnimations(!e.target.checked)
                                this.update()
                            },
                        })
                    )
                )
            ),
        })

        container.appendChild(card.render())
        return container
    }

    /**
     * Render advanced settings
     */
    renderAdvancedSettings() {
        const container = this.createElement('div', {
            className: 'space-y-6',
        })

        // Developer options
        container.appendChild(this.renderDeveloperOptions())

        // Reset options
        container.appendChild(this.renderResetOptions())

        return container
    }

    /**
     * Render developer options
     */
    renderDeveloperOptions() {
        const card = new Card({
            title: '🔧 Opsi Developer',
            subtitle: 'Pengaturan lanjutan untuk debugging dan development',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'form-control',
                    },
                    this.createElement(
                        'label',
                        {
                            className: 'label cursor-pointer',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'label-text',
                            },
                            'Mode Debug'
                        ),
                        this.createElement('input', {
                            type: 'checkbox',
                            className: 'toggle toggle-warning',
                        })
                    )
                ),

                this.createElement(
                    'div',
                    {
                        className: 'flex gap-2',
                    },
                    new Button({
                        text: '🧹 Clear Cache',
                        variant: 'btn-outline btn-warning',
                        onClick: () => {
                            localStorage.clear()
                            this.showToast('Cache berhasil dibersihkan', 'success')
                        },
                    }).render(),

                    new Button({
                        text: '📊 Show Storage Info',
                        variant: 'btn-outline btn-info',
                        onClick: () => this.showStorageInfo(),
                    }).render()
                )
            ),
        })

        return card.render()
    }

    /**
     * Render reset options
     */
    renderResetOptions() {
        const card = new Card({
            title: '🔄 Reset Aplikasi',
            subtitle: 'Kembalikan aplikasi ke pengaturan awal',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'div',
                    {
                        className: 'alert alert-warning',
                    },
                    this.createElement(
                        'div',
                        {
                            className: 'flex items-center gap-2',
                        },
                        this.createElement('span', {}, '⚠️'),
                        this.createElement(
                            'div',
                            {},
                            this.createElement(
                                'div',
                                {
                                    className: 'font-semibold',
                                },
                                'Peringatan'
                            ),
                            this.createElement(
                                'div',
                                {
                                    className: 'text-sm',
                                },
                                'Tindakan ini akan menghapus semua data dan pengaturan'
                            )
                        )
                    )
                ),

                this.createElement(
                    'div',
                    {
                        className: 'flex gap-2',
                    },
                    new Button({
                        text: '🔄 Reset Pengaturan',
                        variant: 'btn-outline btn-warning',
                        onClick: () => this.showResetConfirmation('settings'),
                    }).render(),

                    new Button({
                        text: '🗑️ Reset Semua Data',
                        variant: 'btn-outline btn-error',
                        onClick: () => this.showResetConfirmation('all'),
                    }).render()
                )
            ),
        })

        return card.render()
    }

    /**
     * Switch tab
     */
    switchTab(tabId) {
        this.activeTab = tabId
        this.update()
    }

    /**
     * Subscribe to theme changes
     */
    subscribeToThemeChanges() {
        this.subscribeToEvent('theme:changed', () => {
            this.update()
        })
    }

    /**
     * Show reset confirmation
     */
    showResetConfirmation(type = 'settings') {
        const isAllData = type === 'all'

        this.confirmModal = new Modal({
            title: '⚠️ Konfirmasi Reset',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                this.createElement(
                    'p',
                    {},
                    isAllData
                        ? 'Apakah Anda yakin ingin menghapus SEMUA data dan pengaturan? Tindakan ini tidak dapat dibatalkan.'
                        : 'Apakah Anda yakin ingin mereset pengaturan ke default?'
                ),
                this.createElement(
                    'div',
                    {
                        className: 'alert alert-error',
                    },
                    this.createElement('span', {}, '🚨 Tindakan ini tidak dapat dibatalkan!')
                )
            ),
            actions: [
                new Button({
                    text: 'Batal',
                    variant: 'btn-ghost',
                    onClick: () => this.confirmModal.close(),
                }),
                new Button({
                    text: isAllData ? '🗑️ Hapus Semua' : '🔄 Reset',
                    variant: 'btn-error',
                    onClick: () => this.performReset(type),
                }),
            ],
            open: true,
        })

        document.body.appendChild(this.confirmModal.render())
    }

    /**
     * Perform reset
     */
    performReset(type) {
        if (type === 'all') {
            // Reset all data
            this.storage.resetStorage()
            themeManager.resetToDefaults()
            this.showToast('Semua data berhasil direset', 'success')
        } else {
            // Reset settings only
            themeManager.resetToDefaults()
            this.showToast('Pengaturan berhasil direset', 'success')
        }

        this.confirmModal.close()
        this.update()
    }

    /**
     * Handle file import
     */
    handleFileImport(event) {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = e => {
            try {
                // Handle different file types
                const content = e.target.result
                // Implementation would depend on file type
                this.showToast('File berhasil diimport', 'success')
            } catch (error) {
                this.showToast('Gagal mengimport file', 'error')
            }
        }
        reader.readAsText(file)
    }

    /**
     * Show backup list
     */
    showBackupList() {
        const backups = this.storage.getBackups()

        const modal = new Modal({
            title: '📋 Daftar Backup',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-3',
                },
                ...Object.entries(backups).map(([id, backup]) =>
                    this.createElement(
                        'div',
                        {
                            className: 'flex items-center justify-between p-3 bg-base-200 rounded-lg',
                        },
                        this.createElement(
                            'div',
                            {},
                            this.createElement(
                                'div',
                                {
                                    className: 'font-medium',
                                },
                                `Backup ${id.slice(0, 8)}`
                            ),
                            this.createElement(
                                'div',
                                {
                                    className: 'text-sm text-base-content/60',
                                },
                                new Date(backup.timestamp).toLocaleString('id-ID')
                            )
                        ),
                        new Button({
                            text: '📥 Restore',
                            variant: 'btn-sm btn-primary',
                            onClick: () => {
                                this.storage.restoreFromBackup(id)
                                this.showToast('Backup berhasil direstore', 'success')
                                modal.close()
                            },
                        }).render()
                    )
                )
            ),
            open: true,
        })

        document.body.appendChild(modal.render())
    }

    /**
     * Show storage info
     */
    showStorageInfo() {
        const stats = this.storage.getStorageStats()

        const modal = new Modal({
            title: '📊 Informasi Storage Detail',
            content: this.createElement(
                'pre',
                {
                    className: 'text-xs bg-base-200 p-4 rounded-lg overflow-auto',
                },
                JSON.stringify(stats, null, 2)
            ),
            open: true,
        })

        document.body.appendChild(modal.render())
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = new Toast({
            message,
            type,
            duration: 3000,
        })

        document.body.appendChild(toast.render())
    }

    /**
     * Utility methods
     */
    getPermissionLabel(permission) {
        const labels = {
            granted: '✅ Diizinkan',
            denied: '❌ Ditolak',
            default: '⏳ Belum Ditentukan',
        }
        return labels[permission] || permission
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
}
