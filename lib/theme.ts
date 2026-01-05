/**
 * 마음부고 통합 디자인 시스템
 * globals.css와 동기화된 Mantine 테마
 * 
 * Single Source of Truth: globals.css의 CSS 변수
 * 이 파일은 Mantine 컴포넌트가 동일한 디자인 토큰을 사용하도록 연결합니다.
 */

import { createTheme, CSSVariablesResolver, MantineColorsTuple } from '@mantine/core';

// globals.css의 --primary (#2C3E50) 기반 네이비 팔레트
const navy: MantineColorsTuple = [
    '#F4F6F7',  // 0 - lightest (--gray-100)
    '#ECF0F1',  // 1 (--gray-200)
    '#D5DBDB',  // 2 (--gray-300)
    '#BDC3C7',  // 3 (--gray-400)
    '#95A5A6',  // 4 (--gray-500)
    '#7F8C8D',  // 5 (--gray-600)
    '#5D6D7E',  // 6 (--gray-700)
    '#34495E',  // 7 (--primary-light)
    '#2C3E50',  // 8 (--primary) ⭐ 메인
    '#1a252f',  // 9 (--primary-dark)
];

// globals.css의 --accent (#3498DB) 기반 블루 팔레트
const accent: MantineColorsTuple = [
    '#EBF5FB',  // 0 (--accent-light)
    '#D6EAF8',  // 1
    '#AED6F1',  // 2
    '#85C1E9',  // 3
    '#5DADE2',  // 4
    '#3498DB',  // 5 (--accent) ⭐ 메인
    '#2E86C1',  // 6
    '#2874A6',  // 7
    '#21618C',  // 8
    '#1B4F72',  // 9
];

// 마음부고 통합 테마
export const dodamTheme = createTheme({
    // 기본 색상 설정
    primaryColor: 'navy',
    primaryShade: 8,

    // 커스텀 색상 팔레트
    colors: {
        navy,
        accent,
    },

    // 폰트 (globals.css와 동일)
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headings: {
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    },

    // 간격 (globals.css --spacing-* 와 동일)
    spacing: {
        xs: '4px',   // --spacing-xs
        sm: '8px',   // --spacing-sm
        md: '16px',  // --spacing-md
        lg: '24px',  // --spacing-lg
        xl: '40px',  // --spacing-xl
    },

    // 반경 (globals.css --radius-* 와 동일)
    radius: {
        xs: '4px',
        sm: '6px',   // --radius-sm
        md: '10px',  // --radius-md
        lg: '14px',  // --radius-lg
        xl: '20px',  // --radius-xl
    },
    defaultRadius: 'md',

    // 그림자 (globals.css --shadow-* 와 동일)
    shadows: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.04)',  // --shadow-sm
        md: '0 4px 12px rgba(0, 0, 0, 0.06)', // --shadow-md
        lg: '0 8px 24px rgba(0, 0, 0, 0.08)', // --shadow-lg
        xl: '0 16px 32px rgba(0, 0, 0, 0.1)', // --shadow-xl
    },

    // 컴포넌트 기본값 통일
    components: {
        Button: {
            defaultProps: {
                radius: 'md',
            },
            styles: {
                root: {
                    fontWeight: 600,
                },
            },
        },
        TextInput: {
            defaultProps: {
                radius: 'md',
            },
        },
        Select: {
            defaultProps: {
                radius: 'md',
            },
        },
        Card: {
            defaultProps: {
                radius: 'lg',
                shadow: 'sm',
            },
        },
        Paper: {
            defaultProps: {
                radius: 'lg',
            },
        },
    },
});

// CSS 변수 리졸버: Mantine 변수를 globals.css 변수와 연결
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
    variables: {
        // globals.css 변수를 Mantine에서도 사용할 수 있게 매핑
        '--dodam-primary': 'var(--primary)',
        '--dodam-primary-dark': 'var(--primary-dark)',
        '--dodam-accent': 'var(--accent)',
        '--dodam-bg-gray': 'var(--bg-gray)',
        '--dodam-shadow-sm': 'var(--shadow-sm)',
        '--dodam-shadow-md': 'var(--shadow-md)',
    },
    light: {
        // 라이트 모드 전용 변수
        '--mantine-color-body': '#FFFFFF',
    },
    dark: {
        // 다크 모드 전용 변수 (필요시 추가)
        '--mantine-color-body': '#1a1a1a',
    },
});
