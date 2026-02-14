'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

import { revalidatePath } from 'next/cache'

export async function signUpAction(formData: FormData) {
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const organizationName = formData.get('organizationName') as string

    const supabase = await createClient()

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (authError || !authData.user) {
        return { error: authError?.message || 'Erro ao criar usuário.' }
    }

    const userId = authData.user.id
    const adminSupabase = createAdminClient() as any

    // 2. Create Organization and link user
    // We use admin client because RLS might block creation before user is fully confirmed or if we want it atomic
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    try {
        // Create Organization
        const { data: org, error: orgError } = await adminSupabase
            .from('organizations')
            .insert({
                name: organizationName,
                trial_ends_at: sevenDaysFromNow.toISOString(),
                plan_type: 'trial',
                subscription_status: 'trialing'
            })
            .select()
            .single()

        if (orgError) throw orgError

        // Link User to Organization as owner
        const { error: linkError } = await adminSupabase
            .from('organization_users')
            .insert({
                organization_id: org.id,
                user_id: userId,
                role: 'owner'
            })

        if (linkError) throw linkError

        // Note: public.profiles creation is handled by DB Trigger handle_new_user() confirmed via SQL check earlier
    } catch (err: any) {
        console.error('[Signup Action] Error creating organization:', err)
        return { error: 'Usuário criado, mas erro ao configurar organização. Contate o suporte.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signOutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
