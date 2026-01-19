'use client';

import Link from 'next/link';

export default function AdminPage() {
    return (
        <div style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
        }}>
            <h1 style={{ marginBottom: '32px', color: '#333' }}>🔐 관리자 대시보드</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
            }}>
                <Link href="/admin/bugo" style={cardStyle}>
                    <span style={{ fontSize: '32px' }}>📋</span>
                    <span>부고 관리</span>
                </Link>

                <Link href="/admin/flower-orders" style={cardStyle}>
                    <span style={{ fontSize: '32px' }}>💐</span>
                    <span>화환 주문</span>
                </Link>

                <Link href="/admin/products" style={cardStyle}>
                    <span style={{ fontSize: '32px' }}>🛒</span>
                    <span>상품 관리</span>
                </Link>

                <Link href="/admin/facilities" style={cardStyle}>
                    <span style={{ fontSize: '32px' }}>🏥</span>
                    <span>장례식장</span>
                </Link>

                <Link href="/admin/inquiries" style={cardStyle}>
                    <span style={{ fontSize: '32px' }}>💬</span>
                    <span>문의사항</span>
                </Link>
            </div>

            <button
                onClick={() => {
                    sessionStorage.removeItem('admin_session');
                    window.location.reload();
                }}
                style={{
                    marginTop: '40px',
                    padding: '12px 24px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                }}
            >
                로그아웃
            </button>
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    color: '#333',
    transition: 'transform 0.2s, box-shadow 0.2s',
};
