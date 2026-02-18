
import { POST } from '@/app/api/intelligence/process-batch/route';
import { createClient } from '@/lib/supabase/client'; // Use client for public or admin for service role if needed
import { NextRequest } from 'next/server';

// Mock Request
const req = new NextRequest('http://localhost:3000/api/intelligence/process-batch', {
    method: 'POST',
    body: JSON.stringify({
        batchId: 'direct_sim_' + Date.now(),
        groupId: '69be71e9-6273-4972-a051-1c413ac705a5',
        organizationId: '4545be6b-ed21-428c-911d-8915588b3270',
        simulate: true
    })
});

async function runDirect() {
    console.log('🚀 Running route.ts POST directly...');
    try {
        const response = await POST(req);
        const data = await response.json();
        console.log('✅ Result:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

runDirect();
