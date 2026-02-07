export default defineAppConfig({
    ui: {
        primary: 'electric',
        gray: 'slate',

        // Card styling
        card: {
            background: 'bg-white dark:bg-gray-900/40',
            ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
            rounded: 'rounded-xl',
            shadow: 'shadow-sm',
        },

        // Input styling
        input: {
            default: {
                size: 'md',
            },
            color: {
                white: {
                    outline: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-electric-500'
                }
            },
            variant: {
                outline: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-gray-300 dark:ring-gray-700'
            }
        },

        // Button styling - standardized for both themes
        button: {
            default: {
                size: 'md',
            },
            color: {
                primary: {
                    solid: 'bg-electric-500 hover:bg-electric-600 text-white shadow-sm shadow-electric-500/20 focus-visible:ring-electric-500',
                    soft: 'bg-electric-500/10 hover:bg-electric-500/20 text-electric-600 dark:text-electric-400',
                    ghost: 'text-electric-600 dark:text-electric-400 hover:bg-electric-500/10'
                },
                gray: {
                    solid: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white',
                    soft: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
                    ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
                    outline: 'ring-1 ring-gray-300 dark:ring-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                },
                red: {
                    solid: 'bg-red-500 hover:bg-red-600 text-white',
                    soft: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400'
                },
                emerald: {
                    solid: 'bg-emerald-500 hover:bg-emerald-600 text-white',
                    soft: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }
            },
            variant: {
                solid: 'shadow-sm font-medium',
                soft: 'font-medium',
                ghost: 'font-medium',
                outline: 'font-medium'
            }
        },

        // Toggle styling
        toggle: {
            default: {
                color: 'primary',
            }
        },

        // Badge styling
        badge: {
            color: {
                primary: {
                    solid: 'bg-electric-500 text-white',
                    soft: 'bg-electric-500/10 text-electric-600 dark:text-electric-400'
                }
            }
        },

        // FormGroup styling
        formGroup: {
            label: {
                base: 'block font-medium text-gray-700 dark:text-gray-300'
            },
            hint: 'text-gray-500 dark:text-gray-400'
        },

        // Skeleton styling
        skeleton: {
            background: 'bg-gray-200 dark:bg-gray-800'
        },

        // Avatar styling
        avatar: {
            background: 'bg-gray-100 dark:bg-gray-800'
        }
    }
})
