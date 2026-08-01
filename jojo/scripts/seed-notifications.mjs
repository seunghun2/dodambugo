import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedNotifications() {
  const { data: partners, error: partnerErr } = await supabase
    .from('b2b_users')
    .select('id, owner_name, company_name, phone')
    .order('created_at', { ascending: false });

  if (partnerErr || !partners || partners.length === 0) {
    console.error('파트너 조회 실패:', partnerErr);
    return;
  }

  const notificationTypes = [
    { type: 'condolence_earned', title: '조의금 전달 완료 수수료 적립', bodyTemplate: (i) => `고인 모바일 부고장 조의금 전달 건으로 ${2500 + (i * 100)}원이 적립되었습니다.` },
    { type: 'flower_order', title: '화환 주문 접수 알림', bodyTemplate: (i) => `서산의료원상례원 ${101 + (i % 5)}호실로 근조 3단 화환이 접수되었습니다.` },
    { type: 'flower_delivery_completed', title: '근조화환 배송 완료 안내', bodyTemplate: (i) => `[배송완료] 요청하신 근조화환 배송이 현장에 완료되었습니다.` },
    { type: 'notice', title: '부고온 파트너 서비스 시스템 공지', bodyTemplate: (i) => `정산 및 부고장 시스템 업데이트 안내 사항입니다 (#${i}).` },
    { type: 'referral_signup', title: '추천인 가입 축하 수수료 적립', bodyTemplate: (i) => `신규 지도사 파트너가 추천코드로 가입하여 2,500원 축하금이 적립되었습니다.` },
  ];

  const now = new Date();

  for (const partner of partners) {
    const notificationsToInsert = [];
    for (let i = 1; i <= 100; i++) {
      const typeObj = notificationTypes[i % notificationTypes.length];
      const createdAt = new Date(now.getTime() - (i * 1000 * 60 * 60 * 4));

      notificationsToInsert.push({
        partner_id: partner.id,
        title: `${typeObj.title} (#${101 - i})`,
        body: typeObj.bodyTemplate(i),
        type: typeObj.type,
        is_read: i > 5,
        created_at: createdAt.toISOString(),
        data: JSON.stringify({ url: '/b2b/wallet' })
      });
    }

    await supabase.from('b2b_notifications').delete().eq('partner_id', partner.id);
    await supabase.from('b2b_notifications').insert(notificationsToInsert);
    console.log(`✓ [${partner.owner_name || partner.company_name || '파트너'}] (${partner.phone}) 님 계정에 100개 알림 시딩 완료!`);
  }
}

seedNotifications();
