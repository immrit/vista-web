import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        console.log('=== DELETE USER AUTH API ===')
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Check if service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
            return NextResponse.json(
                { error: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file' },
                { status: 500 }
            )
        }

        // Log service role key info (without exposing the actual key)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        console.log('Service role key info:', {
            exists: !!serviceRoleKey,
            length: serviceRoleKey?.length,
            startsWith: serviceRoleKey?.substring(0, 10) + '...',
            endsWith: '...' + serviceRoleKey?.substring(serviceRoleKey.length - 10)
        })

        // Create admin client with service role key
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        console.log('Attempting to delete user from auth.users...')
        console.log('User ID:', userId)
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

        const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId)

        if (authDeleteError) {
            console.error('Error deleting user from auth.users:', authDeleteError)
            console.error('Error details:', {
                message: authDeleteError.message,
                status: authDeleteError.status,
                code: authDeleteError.code,
                name: authDeleteError.name
            })

            // Provide helpful error message
            if (authDeleteError.code === 'not_admin') {
                return NextResponse.json(
                    {
                        error: 'Service role key does not have admin privileges',
                        details: 'Please check your SUPABASE_SERVICE_ROLE_KEY in .env.local file. Make sure you copied the correct service_role key from Supabase Dashboard > Settings > API',
                        solution: '1. Go to Supabase Dashboard > Settings > API\n2. Copy the service_role key (not anon key)\n3. Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY\n4. Restart your development server'
                    },
                    { status: 500 }
                )
            }

            return NextResponse.json(
                { error: 'Failed to delete user from auth.users', details: authDeleteError.message },
                { status: 500 }
            )
        }

        console.log('User deleted from auth.users successfully')
        return NextResponse.json(
            { message: 'User deleted from auth.users successfully' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in delete user auth:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 