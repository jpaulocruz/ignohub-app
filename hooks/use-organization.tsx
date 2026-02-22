'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

interface OrganizationContextValue {
    organization: Organization | null
    role: string | null
    loading: boolean
    error: any
    isSuperadmin: boolean
    userEmail: string | null
    userName: string | null
    refresh: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextValue>({
    organization: null,
    role: null,
    loading: true,
    error: null,
    isSuperadmin: false,
    userEmail: null,
    userName: null,
    refresh: async () => { },
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)
    const [isSuperadmin, setIsSuperadmin] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)

    const supabase = createClient()

    const fetchOrganization = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setOrganization(null)
                setRole(null)
                return
            }

            setUserEmail(user.email ?? null)
            setUserName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null)

            // Parallel fetch: org data + superadmin check
            const [orgResult, profileResult] = await Promise.all([
                supabase
                    .from('organization_users')
                    .select('role, organizations(id, name, subscription_status, stripe_customer_id, plan_type, trial_ends_at, summary_schedule_time, summary_delivery_days)')
                    .eq('user_id', user.id)
                    .maybeSingle(),
                supabase
                    .from('profiles')
                    .select('is_superadmin')
                    .eq('id', user.id)
                    .single()
            ]) as any

            if (orgResult.error) throw orgResult.error

            if (orgResult.data) {
                setOrganization(orgResult.data.organizations)
                setRole(orgResult.data.role)
            }

            setIsSuperadmin(profileResult.data?.is_superadmin ?? false)
        } catch (err) {
            console.error('[OrganizationProvider] Error:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOrganization()
    }, [fetchOrganization])

    return (
        <OrganizationContext.Provider value= {{
        organization, role, loading, error,
            isSuperadmin, userEmail, userName,
            refresh: fetchOrganization
    }
}>
    { children }
    </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    return useContext(OrganizationContext)
}
