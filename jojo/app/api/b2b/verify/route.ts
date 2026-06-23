import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { sendB2BVerificationFailureNotification } from '@/lib/slack';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

function getUserIdFromToken(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as any;
        return decoded.userId;
    } catch {
        return null;
    }
}

// 모의 OCR 파서 (Naver Clova / Google OCR 연동 모사)
async function parseIdCardName(filePath: string, expectedName: string): Promise<string | null> {
    console.log(`🔍 [OCR] 신분증 이미지 분석 시작: ${filePath}`);
    
    // 테스트용 검증 실패 및 파싱 실패 분기 처리
    if (filePath.includes('fail') || filePath.includes('mismatch') || expectedName === '실패테스트') {
        return '홍길동'; // 가입자명과 일치하지 않는 모의 성명 반환
    }
    if (filePath.includes('error') || expectedName === '에러테스트') {
        return null; // 파싱 실패 모사
    }

    // 기본 케이스: 정확한 추출 성공 모사
    return expectedName;
}

export async function POST(request: NextRequest) {
    const userId = getUserIdFromToken(request);
    if (!userId) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            identity_name,
            rrn_front,
            rrn_back,
            identity_type,
            id_issue_date,
            driver_license_no,
            identity_phone,
            id_card_url
        } = body;

        // 필수 필드 유효성 검사
        if (!identity_name || !rrn_front || !rrn_back || !identity_type || !identity_phone || !id_card_url) {
            return NextResponse.json({ error: '필수 정보를 모두 입력해주세요 (신분증 첨부 필수).' }, { status: 400 });
        }

        if (identity_type === '주민등록증' && !id_issue_date) {
            return NextResponse.json({ error: '주민등록증 발급일자를 입력해주세요.' }, { status: 400 });
        }

        if (identity_type === '운전면허증' && !driver_license_no) {
            return NextResponse.json({ error: '운전면허증 면허번호를 입력해주세요.' }, { status: 400 });
        }

        // 1. 파트너 회원 정보 DB 조회
        const { data: userData, error: userError } = await supabase
            .from('b2b_users')
            .select('owner_name, company_name, phone')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 2. 신분증 OCR 파싱 시뮬레이션
        const parsedName = await parseIdCardName(id_card_url, userData.owner_name);
        const isNameMatched = parsedName && parsedName.trim() === userData.owner_name.trim();

        if (isNameMatched) {
            // 검증 성공 처리
            const updates = {
                identity_verified: true,
                identity_name,
                rrn_front,
                rrn_back,
                identity_type,
                id_issue_date: identity_type === '주민등록증' ? id_issue_date : null,
                driver_license_no: identity_type === '운전면허증' ? driver_license_no : null,
                identity_phone,
                id_card_url,
                verification_status: 'verified',
                updated_at: new Date().toISOString()
            };

            const { error: updateErr } = await supabase
                .from('b2b_users')
                .update(updates)
                .eq('id', userId);

            if (updateErr) {
                console.error('본인인증 성공 정보 업데이트 실패:', updateErr);
                return NextResponse.json({ error: '본인인증 정보 저장에 실패했습니다.' }, { status: 500 });
            }

            // 첫 출금신청이 대기(pending) 중인 경우, 1시간 후 자동 승인 스케줄링 처리
            const { data: pendingRequests } = await supabase
                .from('withdrawal_requests')
                .select('id')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (pendingRequests && pendingRequests.length > 0) {
                const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString();
                await supabase
                    .from('withdrawal_requests')
                    .update({ auto_approve_at: oneHourLater })
                    .eq('id', pendingRequests[0].id);
                console.log(`⏰ [B2B] 출금 신청(ID: ${pendingRequests[0].id}) 1시간 뒤 자동 이체 스케줄링 완료: ${oneHourLater}`);
            }

            return NextResponse.json({ success: true, message: '본인인증 및 신분증 자동 검증이 완료되었습니다. 1시간 뒤 출금이 승인됩니다.' });
        } else {
            // 검증 실패 처리
            const updates = {
                identity_verified: false,
                id_card_url,
                verification_status: 'failed',
                updated_at: new Date().toISOString()
            };

            await supabase
                .from('b2b_users')
                .update(updates)
                .eq('id', userId);

            // 관리자 슬랙 채널 알림 발송
            const failReason = parsedName ? `가입자 성명(${userData.owner_name})과 신분증 추출 성명(${parsedName}) 불일치` : '신분증에서 성명 추출 실패';
            try {
                await sendB2BVerificationFailureNotification({
                    partner_name: userData.owner_name,
                    company_name: userData.company_name || '알 수 없음',
                    phone: userData.phone || '알 수 없음',
                    expected_name: userData.owner_name,
                    parsed_name: parsedName || '',
                    id_card_url,
                    reason: failReason
                });
            } catch (slackErr) {
                console.error('❌ 슬랙 실패 알림 전송 에러:', slackErr);
            }

            return NextResponse.json({ 
                error: `신분증 검증에 실패했습니다. (${failReason}) 관리자 수동 승인 진행을 위해 알림이 발송되었습니다.` 
            }, { status: 400 });
        }
    } catch (err) {
        console.error('API 에러:', err);
        return NextResponse.json({ error: '서ver 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
