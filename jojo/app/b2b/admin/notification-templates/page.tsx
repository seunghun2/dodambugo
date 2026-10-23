'use client';

import { useState, useEffect } from 'react';
import { IconEdit, IconX, IconInfoCircle, IconVariable, IconBell, IconBellOff } from '@tabler/icons-react';
import styles from '../partners/partners.module.css';

interface NotificationTemplate {
    id: string;
    event_type: string;
    title: string;
    body: string;
    channels: string[];
    is_active: boolean;
    variables: string[];
    updated_at: string;
}

const CHANNEL_LABELS: Record<string, string> = {
    push: '📱 앱 푸시',
    lms: '💬 LMS 문자',
    sms: '💬 SMS',
    alimtalk: '💛 알림톡',
};

export default function NotificationTemplatesPage() {
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 수정 모달용 상태
    const [activeEditTemplate, setActiveEditTemplate] = useState<NotificationTemplate | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');
    const [editChannels, setEditChannels] = useState<string[]>([]);
    const [editActive, setEditActive] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/b2b/admin/notification-templates');
            if (!res.ok) throw new Error('템플릿 데이터를 가져오는데 실패했습니다.');
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

    useEffect(() => { fetchTemplates(); }, []);

    const handleEditClick = (template: NotificationTemplate) => {
        setActiveEditTemplate(template);
        setEditTitle(template.title);
        setEditBody(template.body);
        setEditChannels(template.channels || ['push']);
        setEditActive(template.is_active);
    };

    const toggleChannel = (ch: string) => {
        setEditChannels(prev =>
            prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
        );
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
                    body: editBody,
                    channels: editChannels,
                    is_active: editActive,
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('알림 템플릿이 저장되었습니다!');
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

    // 이벤트별 가이드
    const getEventGuide = (eventType: string) => {
        const guides: Record<string, { name: string; timing: string; icon: string }> = {
            signup_approved: {
                name: '파트너 가입 승인 완료',
                timing: '관리자가 파트너 가입을 승인하면 자동 발송됩니다.',
                icon: '🤝',
            },
            new_funeral: {
                name: '신규 부고 등록 알림',
                timing: '파트너의 고객이 새 부고장을 생성하면 자동 발송됩니다.',
                icon: '📋',
            },
            condolence_earned: {
                name: '조의금 수당 적립 알림',
                timing: '조문객이 부의금을 결제하면 파트너 수당과 함께 자동 발송됩니다.',
                icon: '💰',
            },
            delivery_complete: {
                name: '화환 배송 완료 알림',
                timing: '화환 배송이 완료되면 자동 발송됩니다.',
                icon: '🌸',
            },
            flower_delivery_completed: {
                name: '화환 배송 완료 알림',
                timing: '화환 배송이 완료되면 자동 발송됩니다.',
                icon: '🌸',
            },
            settlement: {
                name: '정산 완료 안내',
                timing: '월별 정산금이 계좌로 입금되면 자동 발송됩니다.',
                icon: '💳',
            },
            notice: {
                name: '공지사항 안내',
                timing: '관리자가 공지사항을 작성하면 전체 파트너에게 발송됩니다.',
                icon: '📢',
            },
            referral_signup: {
                name: '추천인 가입 알림',
                timing: '내 추천 코드로 새 파트너가 가입하면 자동 발송됩니다.',
                icon: '🎉',
            },
            funeral_reminder: {
                name: '발인 임박 리마인더',
                timing: '발인 3시간 전에 파트너에게 자동 발송됩니다. (매시간 크론)',
                icon: '⏰',
            },
        };
        return guides[eventType] || { name: eventType, timing: '시스템 이벤트 발생 시 발송', icon: '🔔' };
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>자동 알림/푸시 설정</h1>
                <p className={styles.subtitle}>이벤트 발생 시 파트너에게 자동으로 발송되는 알림의 문구, 발송 채널, ON/OFF를 관리합니다.</p>
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
                <div className={styles.emptyState}>조회할 템플릿 설정이 없습니다.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {templates.map((tpl) => {
                        const guide = getEventGuide(tpl.event_type);
                        return (
                            <div key={tpl.id} style={{
                                backgroundColor: tpl.is_active ? '#ffffff' : '#f8fafc',
                                borderRadius: '12px',
                                border: `1px solid ${tpl.is_active ? '#e2e8f0' : '#f1f5f9'}`,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: tpl.is_active ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                                opacity: tpl.is_active ? 1 : 0.6,
                            }}>
                                {/* 카드 헤더 */}
                                <div style={{ padding: '14px 18px', backgroundColor: tpl.is_active ? '#f8fafc' : '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>{guide.icon}</span>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{guide.name}</h3>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{tpl.event_type}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {tpl.is_active ? (
                                            <span style={{ fontSize: '11px', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>활성</span>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>비활성</span>
                                        )}
                                        <button
                                            onClick={() => handleEditClick(tpl)}
                                            className={styles.actionBtn}
                                            style={{ color: '#d4a84b', borderColor: '#d4a84b', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', fontSize: '12px' }}
                                        >
                                            <IconEdit size={13} />
                                            <span>수정</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 카드 바디 */}
                                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* 채널 뱃지 */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {(tpl.channels || ['push']).map(ch => (
                                            <span key={ch} style={{
                                                backgroundColor: ch === 'push' ? '#eff6ff' : ch === 'lms' || ch === 'sms' ? '#f0fdf4' : '#fefce8',
                                                color: ch === 'push' ? '#1e40af' : ch === 'lms' || ch === 'sms' ? '#166534' : '#a16207',
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                                            }}>
                                                {CHANNEL_LABELS[ch] || ch}
                                            </span>
                                        ))}
                                    </div>

                                    {/* 발송 시점 */}
                                    <div style={{ padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '12px', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: '1.4' }}>
                                        <IconInfoCircle size={16} style={{ color: '#0284c7', flexShrink: 0, marginTop: '1px' }} />
                                        <span>{guide.timing}</span>
                                    </div>

                                    {/* 문구 미리보기 */}
                                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa', minHeight: '70px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#64748b', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>
                                            📌 {tpl.title}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                            {tpl.body}
                                        </div>
                                    </div>

                                    {/* 변수 목록 */}
                                    {tpl.variables && tpl.variables.length > 0 && (
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                                                <IconVariable size={13} style={{ color: '#d4a84b' }} />
                                                <span>치환 변수:</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {tpl.variables.map((v) => (
                                                    <span key={v} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
                                                        {'{{' + v + '}}'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
                                    수정일: {formatDate(tpl.updated_at)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 수정 모달 */}
            {activeEditTemplate && (
                <div className={styles.modalOverlay} onClick={() => setActiveEditTemplate(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                {getEventGuide(activeEditTemplate.event_type).icon} 알림 설정 수정
                            </h3>
                            <button className={styles.modalClose} onClick={() => setActiveEditTemplate(null)}>
                                <IconX size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className={styles.modalForm}>
                            <div className={styles.modalBody}>
                                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#475569' }}>
                                    대상: <strong>{getEventGuide(activeEditTemplate.event_type).name}</strong>
                                </div>

                                {/* ON/OFF 토글 */}
                                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>자동 발송:</span>
                                    <button
                                        type="button"
                                        onClick={() => setEditActive(!editActive)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                            backgroundColor: editActive ? '#f0fdf4' : '#fef2f2',
                                            color: editActive ? '#16a34a' : '#ef4444',
                                            fontWeight: '600', fontSize: '13px',
                                        }}
                                    >
                                        {editActive ? <><IconBell size={14} /> ON</> : <><IconBellOff size={14} /> OFF</>}
                                    </button>
                                </div>

                                {/* 채널 선택 */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>발송 채널</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => toggleChannel(key)}
                                                style={{
                                                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
                                                    border: '1px solid',
                                                    cursor: 'pointer',
                                                    backgroundColor: editChannels.includes(key) ? '#eff6ff' : '#ffffff',
                                                    borderColor: editChannels.includes(key) ? '#3b82f6' : '#e2e8f0',
                                                    color: editChannels.includes(key) ? '#1e40af' : '#94a3b8',
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 제목 */}
                                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                                    <label htmlFor="edit_title">알림 제목</label>
                                    <input
                                        type="text"
                                        id="edit_title"
                                        className={styles.formInput}
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* 본문 */}
                                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                                    <label htmlFor="edit_body">알림 본문</label>
                                    <textarea
                                        id="edit_body"
                                        className={styles.formTextarea}
                                        style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '13px' }}
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* 변수 안내 */}
                                {activeEditTemplate.variables && activeEditTemplate.variables.length > 0 && (
                                    <div style={{ padding: '12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '12px', color: '#b45309', lineHeight: '1.5' }}>
                                        <strong>💡 사용 가능한 변수:</strong>{' '}
                                        {activeEditTemplate.variables.map(v => `{{${v}}}`).join(', ')}
                                        <br />
                                        <span style={{ color: '#92400e' }}>본문에 위 변수를 넣으면 발송 시 실제 값으로 자동 치환됩니다.</span>
                                    </div>
                                )}
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
                                    {saving ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
