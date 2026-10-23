require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
    console.log('=== 1. 백승훈 파트너 회원 조회 ===');
    const { data: user, error: userError } = await supabase
        .from('b2b_users')
        .select('*')
        .eq('phone', '01064262393')
        .single();
    
    if (userError) {
        console.error('회원 조회 실패:', userError);
    } else {
        console.log('회원 정보:', {
            id: user.id,
            owner_name: user.owner_name,
            company_name: user.company_name,
            phone: user.phone,
            status: user.status,
            alarm_all: user.alarm_all,
            alarm_deposit: user.alarm_deposit,
            alarm_deceased: user.alarm_deceased,
            alarm_notice: user.alarm_notice,
            alarm_referral: user.alarm_referral,
            alarm_reward: user.alarm_reward,
            alarm_order: user.alarm_order,
        });
    }

    if (user) {
        console.log('\n=== 2. 백승훈 파트너 알림함(b2b_notifications) 조회 ===');
        const { data: notifications, error: notiError } = await supabase
            .from('b2b_notifications')
            .select('*')
            .eq('partner_id', user.id);
        
        if (notiError) {
            console.error('알림함 조회 실패:', notiError);
        } else {
            console.log(`알림 개수: ${notifications.length}개`);
            notifications.forEach((n, idx) => {
                console.log(`[${idx+1}] Title: ${n.title}, Body: ${n.body}, Type: ${n.type}, CreatedAt: ${n.created_at}`);
            });
        }

        console.log('\n=== 3. 백승훈 파트너 푸시 토큰(b2b_push_tokens) 조회 ===');
        const { data: tokens, error: tokenError } = await supabase
            .from('b2b_push_tokens')
            .select('*')
            .eq('partner_id', user.id);

        if (tokenError) {
            console.error('푸시 토큰 조회 실패:', tokenError);
        } else {
            console.log(`푸시 토큰 개수: ${tokens.length}개`);
            tokens.forEach((t, idx) => {
                console.log(`[${idx+1}] Token: ${t.token}, OS: ${t.os}, UpdatedAt: ${t.updated_at}`);
            });
        }
    }

    console.log('\n=== 4. 알림 템플릿(b2b_notification_templates) 조회 ===');
    const { data: templates, error: templateError } = await supabase
        .from('b2b_notification_templates')
        .select('*');
    
    if (templateError) {
        console.error('알림 템플릿 조회 실패:', templateError);
    } else {
        console.log(`템플릿 개수: ${templates.length}개`);
        templates.forEach((t) => {
            console.log(`- EventType: ${t.event_type}, Title: ${t.title}, Channels: ${t.channels.join(',')}, Active: ${t.is_active}`);
        });
    }
}

checkDatabase();
