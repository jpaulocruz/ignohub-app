'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

export function useOrganization() {
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    const supabase = createClient()

    useEffect(() => {
        async function fetchOrganization() {
            try {
                setLoading(true)
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setOrganization(null)
                    setRole(null)
                    return
                }

                // Fetch the active/main organization for the user
                const { data, error: orgError } = await supabase
                    .from('organization_users')
                    .select('role, organizations(id, name, subscription_status, stripe_customer_id, plan_type, trial_ends_at, summary_schedule_time, summary_delivery_days)')
                    .eq('user_id', user.id)
                    .maybeSingle() as any

                if (orgError) throw orgError

                if (data) {
                    setOrganization(data.organizations)
                    setRole(data.role)
                }
            } catch (err) {
                console.error('[useOrganization] Error:', err)
                setError(err)
            } finally {
                setLoading(false)
            }
        }

        fetchOrganization()
    }, [])

    return {
        organization,
        role,
        loading,
        error,
        refresh: () => {
            setLoading(true)
            // Manual trigger could be added here
        }
    }
}
