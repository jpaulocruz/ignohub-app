export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    created_at?: string
                    subscription_status?: string | null
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    plan_type?: string | null
                    trial_ends_at?: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                    subscription_status?: string | null
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    plan_type?: string | null
                    trial_ends_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                    subscription_status?: string | null
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    plan_type?: string | null
                    trial_ends_at?: string | null
                }
            }
            organization_users: {
                Row: {
                    id: string
                    organization_id: string
                    user_id: string
                    role: string
                    created_at?: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    user_id: string
                    role: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    user_id?: string
                    role?: string
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
            }
            plans: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    price_monthly: number
                    features: string[]
                    limits: Json
                    created_at?: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    price_monthly: number
                    features?: string[]
                    limits?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    price_monthly?: number
                    features?: string[]
                    limits?: Json
                    created_at?: string
                }
            }
            notification_endpoints: {
                Row: {
                    id: string
                    organization_id: string
                    type: string
                    target: string
                    is_active: boolean
                    created_at?: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    type: string
                    target: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    type?: string
                    target?: string
                    is_active?: boolean
                    created_at?: string
                }
            }
            groups: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    platform: string
                    preset_id?: string | null
                    is_active: boolean
                    created_at?: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    platform: string
                    preset_id?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    platform?: string
                    preset_id?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            agent_presets: {
                Row: {
                    id: string
                    name: string
                    description?: string | null
                    icon?: string | null
                    contact_info?: string | null
                    created_at?: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    icon?: string | null
                    contact_info?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    icon?: string | null
                    contact_info?: string | null
                    created_at?: string
                }
            }
            alerts: {
                Row: {
                    id: string
                    organization_id: string
                    group_id?: string | null
                    title: string
                    summary: string
                    severity: 'low' | 'medium' | 'high' | 'critical'
                    status: 'open' | 'resolved' | 'dismissed'
                    created_at: string
                    is_read?: boolean
                    evidence_excerpt?: string | null
                }
                Insert: {
                    id?: string
                    organization_id: string
                    group_id?: string | null
                    title: string
                    summary: string
                    severity: 'low' | 'medium' | 'high' | 'critical'
                    created_at?: string
                    is_read?: boolean
                    evidence_excerpt?: string | null
                }
                Update: {
                    id?: string
                    organization_id?: string
                    group_id?: string | null
                    title?: string
                    summary?: string
                    severity?: 'low' | 'medium' | 'high' | 'critical'
                    created_at?: string
                    is_read?: boolean
                    evidence_excerpt?: string | null
                }
            }
            messages: {
                Row: {
                    id: string
                    organization_id: string
                    group_id: string
                    content_text: string
                    author_hash: string
                    message_ts: string
                    batch_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    group_id: string
                    content_text: string
                    author_hash: string
                    message_ts: string
                    batch_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    group_id?: string
                    content_text?: string
                    author_hash?: string
                    message_ts?: string
                    batch_id?: string | null
                    created_at?: string
                }
            }
            message_batches: {
                Row: {
                    id: string
                    group_id: string
                    organization_id: string
                    start_ts: string
                    end_ts: string
                    message_count: number
                    author_count: number
                    priority: string
                    high_signal_flags: Json | null
                    excerpt: string | null
                    status: string
                    locked_by: string | null
                    locked_at: string | null
                    error: string | null
                    created_at: string
                    processed_at: string | null
                }
                Insert: {
                    id?: string
                    group_id: string
                    organization_id: string
                    start_ts: string
                    end_ts: string
                    message_count: number
                    author_count: number
                    priority: string
                    high_signal_flags?: Json | null
                    excerpt?: string | null
                    status: string
                    locked_by?: string | null
                    locked_at?: string | null
                    error?: string | null
                    created_at?: string
                    processed_at?: string | null
                }
                Update: {
                    id?: string
                    group_id?: string
                    organization_id?: string
                    start_ts?: string
                    end_ts?: string
                    message_count?: number
                    author_count?: number
                    priority?: string
                    high_signal_flags?: Json | null
                    excerpt?: string | null
                    status?: string
                    locked_by?: string | null
                    locked_at?: string | null
                    error?: string | null
                    created_at?: string
                    processed_at?: string | null
                }
            }
            group_analytics: {
                Row: {
                    id: string
                    organization_id: string
                    group_id: string
                    sentiment_score: number
                    alert_count_total: number
                    message_count: number
                    period_start: string
                    period_end: string
                    created_at?: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    group_id: string
                    sentiment_score: number
                    alert_count_total: number
                    period_start: string
                    period_end: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    group_id?: string
                    sentiment_score?: number
                    alert_count_total?: number
                    period_start?: string
                    period_end?: string
                    created_at?: string
                }
            }
            summaries: {
                Row: {
                    id: string
                    organization_id: string
                    group_id: string
                    summary_text: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    group_id: string
                    summary_text: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    group_id?: string
                    summary_text?: string
                    created_at?: string
                }
            }
            member_insights: {
                Row: {
                    id: string
                    organization_id: string
                    group_id: string
                    author_hash: string
                    role: string
                    insight_text: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    group_id: string
                    author_hash: string
                    role: string
                    insight_text: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    group_id?: string
                    author_hash?: string
                    role?: string
                    insight_text?: string
                    created_at?: string
                }
            }
        }
        Views: {
            inbox_feed: {
                Row: {
                    id: string
                    organization_id: string
                    type: 'summary' | 'alert' | 'insight'
                    title: string
                    description: string
                    group_name: string
                    group_platform: 'whatsapp' | 'telegram'
                    severity: 'low' | 'medium' | 'high' | 'critical' | null
                    is_read: boolean
                    created_at: string
                }
            }
        }
    }
}
