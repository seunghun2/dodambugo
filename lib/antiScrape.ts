// 경쟁사 의심 행동 감지 & IP 플래그
// view 페이지에서 사용

const STORAGE_KEY = 'mb_activity';

interface ActivityLog {
    screenshots: number;
    devtools: number;
    pageViews: string[]; // 부고번호 목록
    lastReport: number;
}

function getActivity(): ActivityLog {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch { }
    return { screenshots: 0, devtools: 0, pageViews: [], lastReport: 0 };
}

function saveActivity(activity: ActivityLog) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
    } catch { }
}

// 서버에 의심 행동 리포트
async function reportSuspicious(type: string, detail: string) {
    try {
        await fetch('/api/suspicious-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, detail })
        });
    } catch { }
}

// 1. 스크린샷 감지 (PrintScreen, Cmd+Shift+3/4)
export function detectScreenshot() {
    const activity = getActivity();

    const handler = (e: KeyboardEvent) => {
        const isScreenshot =
            e.key === 'PrintScreen' ||
            (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
            (e.ctrlKey && e.key === 'PrintScreen');

        if (isScreenshot) {
            activity.screenshots++;
            saveActivity(activity);

            if (activity.screenshots >= 3) {
                reportSuspicious('screenshot', `${activity.screenshots}회 캡처`);
            }
        }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
}

// 2. 개발자도구 감지
export function detectDevTools() {
    const activity = getActivity();
    let isOpen = false;

    const check = () => {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;

        if (widthDiff || heightDiff) {
            if (!isOpen) {
                isOpen = true;
                activity.devtools++;
                saveActivity(activity);

                if (activity.devtools >= 2) {
                    reportSuspicious('devtools', `${activity.devtools}회 개발자도구`);
                }
            }
        } else {
            isOpen = false;
        }
    };

    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
}

// 3. 다량 조회 감지 (부고 3개 이상 조회)
export function trackPageView(bugoNumber: string) {
    const activity = getActivity();

    if (!activity.pageViews.includes(bugoNumber)) {
        activity.pageViews.push(bugoNumber);
        saveActivity(activity);

        if (activity.pageViews.length >= 5) {
            reportSuspicious('mass_view', `${activity.pageViews.length}개 부고 조회: ${activity.pageViews.join(',')}`);
        }
    }
}

// 4. 우클릭 감지
export function detectRightClick() {
    const handler = (e: MouseEvent) => {
        // 우클릭 자체는 막지 않되 로그만
        const activity = getActivity();

        // 5초 내 신고는 무시 (중복 방지)
        const now = Date.now();
        if (now - activity.lastReport < 5000) return;
        activity.lastReport = now;
        saveActivity(activity);
    };

    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
}
