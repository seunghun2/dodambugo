'use client';

import { useState, useEffect } from 'react';
import { IconEdit, IconX, IconCheck, IconInfoCircle, IconVariable } from '@tabler/icons-react';
import styles from '../partners/partners.module.css'; // 디자인 톤앤매너 완벽 공유

interface NotificationTemplate {
    id: string;
    event_type: string;
    title: string;
    content: string;
    updated_at: string;
}

export default function NotificationTemplatesPage() {
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 수정 모달용 상태
    const [activeEditTemplate, setActiveEditTemplate] = useState<NotificationTemplate | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/b2b/admin/notification-templates');
            if (!res.ok) {
                throw new Error('템플릿 데이터를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setTemplates(data.templates);
            } else {
                setError(data.error || '에러가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleEditClick = (template: NotificationTemplate) => {
        setActiveEditTemplate(template);
        setEditTitle(template.title);
        setEditContent(template.content);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeEditTemplate) return;

        setSaving(true);
        try {
            const res = await fetch('/api/b2b/admin/notification-templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_type: activeEditTemplate.event_type,
                    title: editTitle,
                    content: editContent
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('알림 문구 템플릿이 성공적으로 저장되었습니다!');
                setActiveEditTemplate(null);
                fetchTemplates();
            } else {
                alert(data.error || '저장 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 이벤트별 발송 시점 및 가이드 텍스트 매핑
    const getEventGuide = (eventType: string) => {
        switch (eventType) {
            case 'deposit_alert':
                return {
                    name: '예치금 정산 완료 알림',
                    timing: 'B2B 파트너 정산 신청에 대해 대금 정산 완료 처리가 승인되었을 때 즉시 전송됩니다.',
                    channels: '앱 푸시(FCM) + 카카오 알림톡',
                    vars: ['#{name} (회사명/대표자명)', '#{amount} (정산 이체 대금)']
                };
            case 'deceased_alert':
                return {
                    name: '신규 부고 생성 알림',
                    timing: '파트너 화면을 통해 새로운 모바일 부고장 작성이 완료되었을 때 확인용으로 발송됩니다.',
                    channels: '앱 푸시(FCM) 전용',
                    vars: ['#{name} (회사명)', '#{deceased} (고인 이름)']
                };
            case 'notice_alert':
                return {
                    name: '신규 전체 공지 안내',
                    timing: '어드민에서 새로운 중요 파트너 공지사항을 등록하고 [푸시 공지 알림]을 실행할 때 발송됩니다.',
                    channels: '앱 푸시(FCM) + 카카오 알림톡',
                    vars: ['#{title} (공지사항 제목)']
                };
            case 'signup_approved':
                return {
                    name: '파트너 가입 승인 완료',
                    timing: '회원가입한 장례지도사 파트너에 대해 관리자가 최종 [가입 승인] 처리를 완료했을 때 발송됩니다.',
                    channels: '카카오 알림톡 + LMS 장문 문자',
                    vars: ['#{name} (회사명/대표자명)']
                };
            default:
                return {
                    name: eventType,
                    timing: '시스템 이벤트 발생 시 발송됩니다.',
                    channels: '자동 전송',
                    vars: []
                };
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>자동 알림/푸시 문구 설정</h1>
                <p className={styles.subtitle}>부고 생성, 예치금 정산, 공지사항 등록 등 특정 이벤트 발생 시 자동으로 발송되는 기본 문구를 정밀 커스텀 관리합니다.</p>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    템플릿 설정 불러오는 중...
                </div>
            ) : templates.length === 0 ? (
                <div className={styles.emptyState}>조회할 템플릿 설정이 없습니다. (schema.sql을 DB에 먼저 인서트해 주세요.)</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {templates.map((tpl) => {
                        const guide = getEventGuide(tpl.event_type);
                        return (
                            <div key={tpl.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                {/* 카드 헤더 */}
                                <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{guide.name}</h3>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{tpl.event_type}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleEditClick(tpl)} 
                                        className={styles.actionBtn}
                                        style={{ color: '#d4a84b', borderColor: '#d4a84b', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px' }}
                                    >
                                        <IconEdit size={14} />
                                        <span>문구 수정</span>
                                    </button>
                                </div>

                                {/* 카드 바디 */}
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* 발송 채널 뱃지 */}
                                    <div style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: '#475569' }}>발송 수단:</span>
                                        <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{guide.channels}</span>
                                    </div>

                                    {/* 발송 타이밍 가이드 */}
                                    <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '13px', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: '1.4' }}>
                                        <IconInfoCircle size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
                                        <div>
                                            <strong style={{ color: '#334155' }}>발송 시점: </strong>
                                            {guide.timing}
                                        </div>
                                    </div>

                                    {/* 현재 설정된 문구 내용 */}
                                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#fafafa', minHeight: '100px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                                            제목: {tpl.title}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                            {tpl.content}
                                        </div>
                                    </div>

                                    {/* 치환 변수 목록 안내 */}
                                    {guide.vars.length > 0 && (
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                                                <IconVariable size={14} style={{ color: '#d4a84b' }} />
                                                <span>사용 가능한 대치(치환) 문자 목록:</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {guide.vars.map((v) => (
                                                    <span key={v} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{v}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
                                    최종 수정일: {formatDate(tpl.updated_at)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 문구 수정 모달 팝업 */}
            {activeEditTemplate && (
                <div className={styles.modalOverlay} onClick={() => setActiveEditTemplate(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>자동 발송 알림 문구 수정</h3>
                            <button className={styles.modalClose} onClick={() => setActiveEditTemplate(null)}>
                                <IconX size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className={styles.modalForm}>
                            <div className={styles.modalBody}>
                                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#475569' }}>
                                    대상 유형: <strong>{getEventGuide(activeEditTemplate.event_type).name}</strong> ({activeEditTemplate.event_type})
                                </div>
                                
                                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                                    <label htmlFor="edit_title">기본 제목 (알림톡/문자/푸시 제목)</label>
                                    <input
                                        type="text"
                                        id="edit_title"
                                        className={styles.formInput}
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                                    <label htmlFor="edit_content">발송 문구 본문</label>
                                    <textarea
                                        id="edit_content"
                                        className={styles.formTextarea}
                                        style={{ minHeight: '150px', fontFamily: 'monospace' }}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        required
                                    />
                                </div>

                                <div style={{ padding: '12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '12px', color: '#b45309', lineHeight: '1.5' }}>
                                    <strong>⚠️ 주의사항:</strong> 대치 문자(예: <code>{"#{name}"}</code>)의 중괄호 및 철자가 틀릴 경우 수신인 정보가 치환되지 않고 그대로 발송되오니 형태에 맞춰 오타 없이 수정해 주세요.
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button 
                                    type="button" 
                                    className={styles.btnSecondary} 
                                    onClick={() => setActiveEditTemplate(null)}
                                    disabled={saving}
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles.btnPrimary}
                                    disabled={saving}
                                >
                                    {saving ? '저장 중...' : '변경사항 저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
