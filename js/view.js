// ========================================
// 부고장 보기 페이지 JavaScript
// ========================================

let bugoData = null;

// 페이지 로드 시 부고 데이터 불러오기
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bugoId = urlParams.get('id');
    
    if (!bugoId) {
        showError();
        return;
    }
    
    await loadBugoData(bugoId);
});

// 부고 데이터 로드
async function loadBugoData(id) {
    try {
        const response = await fetch(`tables/bugo/${id}`);
        
        if (!response.ok) {
            throw new Error('부고장을 찾을 수 없습니다.');
        }
        
        bugoData = await response.json();
        displayBugo(bugoData);
        
    } catch (error) {
        console.error('부고 데이터 로드 오류:', error);
        showError();
    }
}

// 부고장 표시
function displayBugo(data) {
    // 로딩 숨기기
    document.getElementById('loading').style.display = 'none';
    document.getElementById('bugoView').style.display = 'block';
    
    // 템플릿 배지
    const templateNames = {
        basic: '기본형',
        ribbon: '검은리본',
        border: '검은띠',
        flower: '국화'
    };
    document.getElementById('templateBadge').textContent = templateNames[data.template] || '기본형';
    
    // 고인 정보
    document.getElementById('deceasedName').textContent = data.deceased_name;
    document.getElementById('relationship').textContent = `${data.relationship} 상(喪)`;
    
    // 향년
    if (data.age) {
        document.getElementById('age').textContent = `${data.age}세`;
    } else {
        document.getElementById('ageSection').style.display = 'none';
    }
    
    // 별세일
    if (data.death_date) {
        const deathDate = new Date(data.death_date);
        document.getElementById('deathDate').textContent = formatDate(deathDate);
    } else {
        document.getElementById('deathDateSection').style.display = 'none';
    }
    
    // 빈소
    if (data.funeral_home) {
        let funeralHomeText = data.funeral_home;
        if (data.room_number) {
            funeralHomeText += ` ${data.room_number}`;
        }
        document.getElementById('funeralHome').textContent = funeralHomeText;
    } else {
        document.getElementById('funeralHomeSection').style.display = 'none';
    }
    
    // 발인일시
    if (data.funeral_datetime) {
        const funeralDatetime = new Date(data.funeral_datetime);
        document.getElementById('funeralDatetime').textContent = formatDateTime(funeralDatetime);
    } else {
        document.getElementById('funeralDatetimeSection').style.display = 'none';
    }
    
    // 장지
    if (data.burial_place) {
        document.getElementById('burialPlace').textContent = data.burial_place;
    } else {
        document.getElementById('burialPlaceSection').style.display = 'none';
    }
    
    // 주소
    if (data.address) {
        document.getElementById('address').textContent = data.address;
    } else {
        document.getElementById('addressSection').style.display = 'none';
    }
    
    // 상주 정보
    document.getElementById('mournerName').textContent = data.mourner_name;
    document.getElementById('contact').textContent = data.contact;
    
    // 추가 메시지
    if (data.message) {
        document.getElementById('message').textContent = data.message;
        document.getElementById('messageSection').style.display = 'block';
    }
    
    // 페이지 타이틀 업데이트
    document.title = `${data.deceased_name} - 부고장 - 도담부고`;
}

// 에러 표시
function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'flex';
}

// 날짜 포맷팅
function formatDate(date) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 날짜+시간 포맷팅
function formatDateTime(date) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 공유하기
function shareBugo() {
    const shareData = {
        title: `${bugoData.deceased_name} - 부고장`,
        text: `${bugoData.deceased_name} ${bugoData.relationship} 상(喪)`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('공유 완료'))
            .catch(err => console.log('공유 취소:', err));
    } else {
        // 폴백: 링크 복사
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                showNotification('링크가 클립보드에 복사되었습니다!', 'success');
            })
            .catch(() => {
                showNotification('링크 복사에 실패했습니다.', 'error');
            });
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const colors = {
        success: '#00C853',
        error: '#FF6B6B',
        warning: '#FFA726',
        info: '#3182F6'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 15px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 애니메이션 스타일
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 네비게이션 토글
document.getElementById('navToggle')?.addEventListener('click', function() {
    document.getElementById('navMenu')?.classList.toggle('active');
});

console.log('✅ 부고장 보기 페이지 로드 완료');
