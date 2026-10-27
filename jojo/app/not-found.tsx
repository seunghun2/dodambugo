import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#fff',
            padding: '40px 20px',
            textAlign: 'center',
        }}>
            <h1 style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#1a1a1a',
                margin: '0 0 24px 0',
                letterSpacing: '-1px',
            }}>
                404 ERROR
            </h1>

            <p style={{
                fontSize: '14px',
                color: '#888',
                lineHeight: '1.8',
                margin: '0 0 40px 0',
            }}>
                죄송합니다. 페이지를 찾을 수 없습니다.<br />
                존재하지 않는 주소를 입력하셨거나,<br />
                요청하신 페이지의 주소가 변경, 삭제되어 찾을 수 없습니다.
            </p>

            {/* 간단한 집 일러스트 SVG */}
            <svg
                width="160"
                height="120"
                viewBox="0 0 160 120"
                fill="none"
                stroke="#999"
                strokeWidth="1"
                style={{ marginBottom: '48px' }}
            >
                {/* 나무 */}
                <ellipse cx="40" cy="60" rx="20" ry="25" />
                <line x1="40" y1="85" x2="40" y2="100" />

                {/* 집 본체 */}
                <rect x="70" y="50" width="60" height="50" />

                {/* 지붕 */}
                <polyline points="65,50 100,25 135,50" />

                {/* 문 */}
                <rect x="90" y="70" width="15" height="30" />

                {/* 창문 */}
                <rect x="110" y="60" width="12" height="12" />
                <line x1="116" y1="60" x2="116" y2="72" />
                <line x1="110" y1="66" x2="122" y2="66" />

                {/* 굴뚝 */}
                <rect x="115" y="30" width="10" height="15" />
            </svg>

            <Link
                href="/"
                style={{
                    fontSize: '14px',
                    color: '#1a1a1a',
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px',
                }}
            >
                홈으로
            </Link>
        </div>
    );
}
