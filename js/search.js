// ========================================
// 부고 검색 페이지 JavaScript
// ========================================

// 탭 전환
document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // 모든 탭 비활성화
        document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // 선택한 탭 활성화
        this.classList.add('active');
        const tabId = this.dataset.tab === 'name' ? 'nameSearch' : 'numberSearch';
        document.getElementById(tabId).classList.add('active');
    });
});

// 입력 필드 클리어
function clearInput(inputId) {
    document.getElementById(inputId).value = '';
    document.getElementById(inputId).focus();
}

// 이름으로 검색
function searchByName() {
    const input = document.getElementById('nameInput');
    const searchTerm = input.value.trim();
    
    if (!searchTerm) {
        showNotification('검색어를 입력해주세요.', 'warning');
        input.focus();
        return;
    }
    
    // 최근 검색어 저장
    saveRecentSearch('name', searchTerm);
    
    // 검색 실행
    performSearch('name', searchTerm);
}

// 번호로 검색
function searchByNumber() {
    const input = document.getElementById('numberInput');
    const searchTerm = input.value.trim();
    
    if (!searchTerm) {
        showNotification('부고장 번호를 입력해주세요.', 'warning');
        input.focus();
        return;
    }
    
    // 최근 검색어 저장
    saveRecentSearch('number', searchTerm);
    
    // 검색 실행
    performSearch('number', searchTerm);
}

// 검색 실행 (RESTful Table API 호출)
async function performSearch(type, term) {
    // 로딩 표시
    showNotification('검색 중...', 'info');
    
    try {
        let results = [];
        
        if (type === 'number') {
            // 부고장 번호로 검색 (bugo_number 필드 검색)
            const response = await fetch(`tables/bugo?limit=1000`);
            if (response.ok) {
                const data = await response.json();
                results = data.data.filter(item => item.bugo_number === term);
            }
        } else {
            // 이름으로 검색 (전체 데이터에서 필터링)
            const response = await fetch(`tables/bugo?limit=1000`);
            if (response.ok) {
                const data = await response.json();
                // 고인 이름 또는 상주 이름으로 검색
                results = data.data.filter(item => 
                    (item.deceased_name && item.deceased_name.includes(term)) || 
                    (item.mourner_name && item.mourner_name.includes(term))
                );
            }
        }
        
        // 발인일 기준 2개월 이내 부고만 필터링
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        
        results = results.filter(item => {
            if (!item.funeral_date) return true; // 발인일이 없으면 포함
            
            const funeralDate = new Date(item.funeral_date);
            return funeralDate >= twoMonthsAgo;
        });
        
        displayResults(results);
    } catch (error) {
        console.error('검색 오류:', error);
        showNotification('검색 중 오류가 발생했습니다.', 'error');
        displayResults([]);
    }
}

// 검색 결과 표시
function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsCount = document.getElementById('resultsCount');
    const resultsGrid = document.getElementById('resultsGrid');
    
    resultsCount.textContent = results.length;
    
    if (results.length === 0) {
        resultsGrid.innerHTML = `
            <div class="no-results">
                <span class="material-symbols-outlined no-results-icon">search_off</span>
                <p class="no-results-text">검색 결과가 없습니다</p>
                <p class="no-results-hint">다른 검색어로 다시 시도해주세요</p>
            </div>
        `;
        showNotification('검색 결과가 없습니다.', 'info');
    } else {
        resultsGrid.innerHTML = results.map(result => {
            // 고인 정보
            const deceasedName = result.deceased_name || '이름 없음';
            const age = result.age ? `${result.age}세` : '';
            const religion = result.religion || '';
            const ageReligion = [age, religion].filter(x => x).join(' / ');
            
            // 관계 정보
            const relationship = result.relationship || result.mourner_relation || '-';
            const mournerName = result.mourner_name || '';
            const relationInfo = mournerName ? `${relationship} (${mournerName})` : relationship;
            
            // 빈소 정보
            const funeralHome = result.funeral_home || '-';
            const roomNumber = result.room_number || '';
            const locationInfo = roomNumber ? `${funeralHome} ${roomNumber}호` : funeralHome;
            
            // 날짜 포맷팅 (funeral_date와 funeral_time 사용)
            let dateStr = '';
            if (result.funeral_date) {
                const funeralDate = new Date(result.funeral_date);
                if (!isNaN(funeralDate.getTime())) {
                    const year = funeralDate.getFullYear();
                    const month = String(funeralDate.getMonth() + 1).padStart(2, '0');
                    const day = String(funeralDate.getDate()).padStart(2, '0');
                    dateStr = `${year}.${month}.${day}`;
                    
                    // 시간 추가
                    if (result.funeral_time) {
                        const timeParts = result.funeral_time.split(':');
                        if (timeParts.length >= 2) {
                            const hour = timeParts[0].padStart(2, '0');
                            const minute = timeParts[1].padStart(2, '0');
                            dateStr += ` ${hour}:${minute}`;
                        }
                    }
                }
            }
            
            // 입관 정보
            let encoffinStr = '';
            if (result.encoffin_date) {
                const encoffinDate = new Date(result.encoffin_date);
                if (!isNaN(encoffinDate.getTime())) {
                    const year = encoffinDate.getFullYear();
                    const month = String(encoffinDate.getMonth() + 1).padStart(2, '0');
                    const day = String(encoffinDate.getDate()).padStart(2, '0');
                    encoffinStr = `${year}.${month}.${day}`;
                    
                    if (result.encoffin_time) {
                        const timeParts = result.encoffin_time.split(':');
                        if (timeParts.length >= 2) {
                            const hour = timeParts[0].padStart(2, '0');
                            const minute = timeParts[1].padStart(2, '0');
                            encoffinStr += ` ${hour}:${minute}`;
                        }
                    }
                }
            }
            
            // 입관/발인 정보 조합
            const scheduleInfo = [];
            if (encoffinStr) scheduleInfo.push(`입관: ${encoffinStr}`);
            if (dateStr) scheduleInfo.push(`발인: ${dateStr}`);
            const scheduleStr = scheduleInfo.length > 0 ? scheduleInfo.join(' / ') : '-';
            
            return `
                <div class="result-card" onclick="viewBugo('${result.id}')">
                    <h3 class="result-name">故 ${deceasedName}${ageReligion ? ` (${ageReligion})` : ''}</h3>
                    <div class="result-info">
                        <p>${relationInfo} 상(喪)</p>
                        <p>${locationInfo}</p>
                    </div>
                    <p class="result-date">${scheduleStr}</p>
                </div>
            `;
        }).join('');
        showNotification(`${results.length}건의 검색 결과를 찾았습니다.`, 'success');
    }
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// 부고장 상세보기
function viewBugo(id) {
    window.open(`view.html?id=${id}`, '_blank');
}

// 최근 검색어 저장
function saveRecentSearch(type, term) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    
    // 중복 제거
    recentSearches = recentSearches.filter(item => 
        !(item.type === type && item.term === term)
    );
    
    // 최신 검색어를 맨 앞에 추가
    recentSearches.unshift({
        type: type,
        term: term,
        date: new Date().toISOString()
    });
    
    // 최대 10개까지만 저장
    recentSearches = recentSearches.slice(0, 10);
    
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

// 최근 검색어 표시
function displayRecentSearches() {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const recentSection = document.getElementById('recentSearches');
    const recentList = document.getElementById('recentList');
    
    if (recentSearches.length === 0) {
        recentSection.style.display = 'none';
        return;
    }
    
    recentSection.style.display = 'block';
    recentList.innerHTML = recentSearches.map((item, index) => `
        <div class="recent-item" onclick="searchRecent('${item.type}', '${item.term}')">
            <span class="recent-item-text">${item.term}</span>
            <button class="recent-item-delete" onclick="event.stopPropagation(); deleteRecent(${index})">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 4L4 12M4 4l8 8"/>
                </svg>
            </button>
        </div>
    `).join('');
}

// 최근 검색어로 검색
function searchRecent(type, term) {
    if (type === 'name') {
        document.querySelector('[data-tab="name"]').click();
        document.getElementById('nameInput').value = term;
        searchByName();
    } else {
        document.querySelector('[data-tab="number"]').click();
        document.getElementById('numberInput').value = term;
        searchByNumber();
    }
}

// 최근 검색어 삭제
function deleteRecent(index) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    recentSearches.splice(index, 1);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

// 모든 최근 검색어 삭제
function clearAllRecent() {
    if (confirm('모든 최근 검색어를 삭제하시겠습니까?')) {
        localStorage.removeItem('recentSearches');
        displayRecentSearches();
        showNotification('최근 검색어가 삭제되었습니다.', 'success');
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

// Enter 키로 검색
document.getElementById('nameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchByName();
    }
});

document.getElementById('numberInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchByNumber();
    }
});

// 페이지 로드 시 최근 검색어 표시
document.addEventListener('DOMContentLoaded', function() {
    displayRecentSearches();
});

console.log('✅ 부고 검색 페이지 로드 완료');
