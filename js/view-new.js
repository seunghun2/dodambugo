// ========================================
// 부고장 보기 페이지 - 토스 스타일
// ========================================

let bugoData = null;

// 페이지 로드
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== 부고장 보기 페이지 로드 시작 ===');
    console.log('현재 URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const bugoId = urlParams.get('id');
    const isPreview = urlParams.get('preview') === 'true';
    
    console.log('URL에서 추출한 부고 ID:', bugoId);
    console.log('미리보기 모드:', isPreview);
    
    // 미리보기 모드
    if (isPreview) {
        const previewData = sessionStorage.getItem('preview_data');
        if (previewData) {
            try {
                const data = JSON.parse(previewData);
                console.log('미리보기 데이터:', data);
                displayBugoPreview(data);
                
                // 근조화환 버튼 숨기기
                const flowerButton = document.querySelector('.fixed-flower-button');
                if (flowerButton) {
                    flowerButton.style.display = 'none';
                }
                
                // 하단 액션 버튼도 숨기기
                const actions = document.querySelector('.bugo-actions');
                if (actions) {
                    actions.style.display = 'none';
                }
                
                return;
            } catch (error) {
                console.error('미리보기 데이터 파싱 오류:', error);
                showError();
                return;
            }
        } else {
            console.error('미리보기 데이터가 없습니다!');
            showError();
            return;
        }
    }
    
    // 일반 모드
    if (!bugoId) {
        console.error('URL에 부고 ID가 없습니다!');
        showError();
        return;
    }
    
    await loadBugoData(bugoId);
});

// 부고 데이터 로드
async function loadBugoData(id) {
    try {
        console.log('부고 ID로 데이터 로드 시도:', id);
        const response = await fetch(`tables/bugo/${id}`);
        console.log('API 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            // 디버깅을 위한 응답 본문 출력
            const errorText = await response.text();
            console.error('API 오류 응답:', errorText);
            throw new Error('부고장을 찾을 수 없습니다.');
        }
        
        bugoData = await response.json();
        console.log('부고 데이터 로드 성공:', bugoData);
        displayBugo(bugoData);
        
    } catch (error) {
        console.error('부고 데이터 로드 오류:', error);
        showError();
    }
}

// 부고장 표시
function displayBugo(data) {
    console.log('부고장 표시 시작, 데이터:', data);
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('bugoView').style.display = 'block';
    
    const floatingBtn = document.getElementById('floatingBtn');
    if (floatingBtn) floatingBtn.style.display = 'block';
    
    // 템플릿 헤더 렌더링 (애도 문구도 함께 생성됨)
    renderTemplateHeader(data);
    
    // 영정 사진 표시
    if (data.photo_url) {
        const photoSection = document.getElementById('photoSection');
        const deceasedPhoto = document.getElementById('deceasedPhoto');
        
        if (photoSection && deceasedPhoto) {
            photoSection.style.display = 'block';
            deceasedPhoto.src = data.photo_url;
            deceasedPhoto.alt = `故 ${data.deceased_name}님 영정 사진`;
        }
    }
    
    // 고인 정보 섹션
    const deceasedNameInfo = document.getElementById('deceasedNameInfo');
    if (deceasedNameInfo) {
        deceasedNameInfo.textContent = `故 ${data.deceased_name}`;
    }
    
    // 향년
    if (data.age) {
        document.getElementById('age').textContent = `${data.age}세`;
    } else {
        document.getElementById('ageRow').style.display = 'none';
    }
    
    // 성별
    if (data.gender) {
        document.getElementById('gender').textContent = data.gender;
    } else {
        document.getElementById('genderRow').style.display = 'none';
    }
    
    // 종교
    if (data.religion) {
        document.getElementById('religion').textContent = data.religion;
    } else {
        document.getElementById('religionRow').style.display = 'none';
    }
    
    // 별세 정보
    if (data.death_date) {
        const deathDate = new Date(data.death_date);
        const deathTime = data.death_time || '';
        const deathDateTime = formatDateTimeFromParts(deathDate, deathTime);
        document.getElementById('deathDatetime').textContent = deathDateTime;
    }
    
    if (data.encoffin_date) {
        const encoffinDate = new Date(data.encoffin_date);
        const encoffinTime = data.encoffin_time || '';
        const encoffinDateTime = formatDateTimeFromParts(encoffinDate, encoffinTime);
        document.getElementById('encoffinDatetime').textContent = encoffinDateTime;
    } else {
        document.getElementById('encoffinRow').style.display = 'none';
    }
    
    // 발인 정보
    if (data.funeral_date) {
        const funeralDate = new Date(data.funeral_date);
        const funeralTime = data.funeral_time || '';
        const funeralDateTime = formatDateTimeFromParts(funeralDate, funeralTime);
        document.getElementById('funeralDatetime').textContent = funeralDateTime;
    }
    
    if (data.funeral_type) {
        document.getElementById('funeralType').textContent = data.funeral_type;
    } else {
        document.getElementById('funeralTypeRow').style.display = 'none';
    }
    
    if (data.burial_place) {
        document.getElementById('burialPlace').textContent = data.burial_place;
    } else {
        document.getElementById('burialPlaceRow').style.display = 'none';
    }
    
    // 빈소 정보
    document.getElementById('funeralHome').textContent = data.funeral_home || '-';
    
    if (data.room_number) {
        document.getElementById('roomNumber').textContent = data.room_number;
    } else {
        document.getElementById('roomRow').style.display = 'none';
    }
    
    if (data.funeral_home_tel) {
        const telLink = document.getElementById('funeralTelLink');
        telLink.href = `tel:${data.funeral_home_tel}`;
        telLink.textContent = data.funeral_home_tel;
    } else {
        document.getElementById('funeralTelRow').style.display = 'none';
    }
    
    if (data.address) {
        document.getElementById('address').textContent = data.address;
        // 카카오맵 초기화
        if (typeof kakao !== 'undefined') {
            initKakaoMap(data.address);
        }
    } else {
        document.getElementById('addressRow').style.display = 'none';
        document.getElementById('mapSection').style.display = 'none';
    }
    
    // 상주 정보 (아들, 딸, 사위, 며느리 순서로 정렬)
    if (data.family_list) {
        // family_list가 있으면 사용 (여러 상주)
        displayMournersSorted(data.family_list);
    } else if (data.mourner_name && data.relationship && data.contact) {
        // 개별 필드가 있으면 사용 (단일 상주)
        displaySingleMourner(data.relationship, data.mourner_name, data.contact);
    }
    
    // 안내 메시지
    if (data.message) {
        document.getElementById('message').textContent = data.message;
        document.getElementById('messageSection').style.display = 'block';
    }
    
    // 계좌 정보
    if (data.account_info) {
        displayAccounts(data.account_info);
        document.getElementById('accountSection').style.display = 'block';
    }
    
    // 페이지 타이틀
    document.title = `${data.deceased_name} - 부고장 - 도담부고`;
}

// 템플릿 헤더 렌더링 (텍스트 오버레이 버전)
function renderTemplateHeader(data) {
    console.log('🎨 텍스트 오버레이 렌더링 시작');
    
    const bugoView = document.getElementById('bugoView');
    const header = document.getElementById('bugoHeader');
    const templateImage = document.getElementById('templateImage');
    const overlayDeceasedName = document.getElementById('overlayDeceasedName');
    const overlayDeathInfo = document.getElementById('overlayDeathInfo');
    const overlayCondolence = document.getElementById('overlayCondolence');
    
    if (!header || !templateImage || !overlayDeceasedName) {
        console.error('❌ 필수 요소를 찾을 수 없습니다:', {
            header: !!header,
            templateImage: !!templateImage,
            overlayDeceasedName: !!overlayDeceasedName
        });
        return;
    }
    
    // 템플릿별 이미지 매핑 (PNG 고해상도)
    const templateImages = {
        basic: 'images/template-basic.png',      // 기본형 - 訃告 + 나뭇가지
        ribbon: 'images/template-ribbon.png',    // 정중형 - 검은리본 + 부고
        border: 'images/template-border.png',    // 안내형 - 대리석 + 謹弔
        flower: 'images/template-flower.png'     // 고급형 - 검정 + 국화
    };
    
    // 템플릿별 이름
    const templateNames = {
        basic: '기본형',
        ribbon: '정중형',
        border: '안내형',
        flower: '고급형'
    };
    
    // 템플릿 선택
    const template = data.template || 'basic';
    
    // bugoView 전체에 템플릿 클래스 추가
    bugoView.className = `bugo-view template-${template}`;
    header.className = `bugo-header template-${template}`;
    
    // 이미지 설정
    const imageUrl = templateImages[template] || templateImages.basic;
    templateImage.src = imageUrl;
    templateImage.alt = `부고장 템플릿 - ${templateNames[template]}`;
    
    console.log('🎨 템플릿:', template, `(${templateNames[template]})`);
    console.log('🖼️ 이미지 URL:', imageUrl);
    
    // 텍스트 오버레이 생성 함수
    const deathDate = data.death_date ? new Date(data.death_date) : null;
    const overlayFullMessage = document.getElementById('overlayFullMessage');
    
    function applyTextOverlay() {
        console.log('🎨 텍스트 오버레이 적용 시작...', 'template:', template);
        
        // 날짜 파싱
        let month = '0';
        let day = '0';
        
        if (deathDate) {
            month = deathDate.getMonth() + 1;
            day = deathDate.getDate();
        }
        
        // 모든 템플릿 하드코딩 방식으로 통일
        // 전체 메시지 생성
        overlayFullMessage.innerHTML = `故${data.deceased_name}님께서 ${month}월 ${day}일<br>별세하셨기에 삼가 알려드립니다.<br>마음으로 따뜻한 위로 부탁드리며<br>고인의 명복을 빌어주시길 바랍니다.`;
        
        // 텍스트 색상 (템플릿별)
        let textColor = '#1a1a1a'; // 기본: 검은색
        let textShadow = 'none';
        
        if (template === 'flower') {
            // 고급형: 흰색 + 그림자
            textColor = '#FFFFFF';
            textShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
        }
        
        // 위치 (템플릿별)
        let paddingTop = '110%'; // 기본값
        
        switch(template) {
            case 'ribbon':
                paddingTop = '110%';
                break;
            case 'basic':
                paddingTop = '105%';
                break;
            case 'flower':
                paddingTop = '50%';
                break;
            case 'border':
                paddingTop = '95%';
                break;
        }
        
        // 인라인 스타일로 강제 적용
        overlayFullMessage.style.cssText = `
            display: block !important;
            font-family: 'Noto Serif KR', serif !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            color: ${textColor} !important;
            line-height: 1.8 !important;
            text-align: center !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            box-sizing: border-box !important;
            left: 0 !important;
            right: 0 !important;
            text-shadow: ${textShadow} !important;
        `;
        
        // text-overlay 컨테이너도 강제 스타일
        const textOverlay = overlayFullMessage.parentElement;
        textOverlay.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding-top: ${paddingTop} !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            text-align: center !important;
            pointer-events: none !important;
            z-index: 2 !important;
        `;
        
        console.log(`✅ ${templateNames[template]} 템플릿 텍스트 적용:`, `${data.deceased_name}, ${month}월 ${day}일`);
        console.log('✅ 스타일 적용 확인:', {
            template: template,
            paddingTop: paddingTop,
            textColor: textColor,
            fontSize: overlayFullMessage.style.fontSize,
            fontWeight: overlayFullMessage.style.fontWeight,
            textAlign: overlayFullMessage.style.textAlign
        });
        
        // 개별 요소 숨김
        overlayDeceasedName.style.display = 'none';
        overlayDeathInfo.style.display = 'none';
        overlayCondolence.style.display = 'none';
    }
    
    // 이미지 로드 완료 후 텍스트 오버레이 적용
    templateImage.onload = function() {
        console.log('✅ 이미지 로드 성공');
        // 이미지 로드 완료 후 텍스트 적용
        applyTextOverlay();
    };
    
    templateImage.onerror = function() {
        console.error('❌ 이미지 로드 실패:', imageUrl);
    };
    
    // 이미지가 이미 로드된 경우 즉시 적용
    if (templateImage.complete) {
        console.log('✅ 이미지 이미 로드됨');
        applyTextOverlay();
    }
    
    console.log('✅ 텍스트 오버레이 렌더링 완료');
}

// 단일 상주 표시
function displaySingleMourner(relationship, name, contact) {
    const container = document.getElementById('mournersInfo');
    container.innerHTML = `
        <div class="mourner-card">
            <div class="mourner-main">
                <span class="mourner-relation">${relationship}</span>
                <span class="mourner-name">${name}</span>
            </div>
            <div class="mourner-contact">
                <a href="tel:${contact}">${contact}</a>
            </div>
        </div>
    `;
}

// 여러 상주 표시 (정렬)
function displayMournersSorted(familyList) {
    if (!familyList) return;
    
    const container = document.getElementById('mournersInfo');
    const mourners = familyList.split('\n').filter(line => line.trim());
    
    // 관계 순서 정의: 아들 → 딸 → 사위 → 며느리 → 기타
    const relationOrder = {
        '아들': 1,
        '장남': 1,
        '차남': 1,
        '삼남': 1,
        '딸': 2,
        '장녀': 2,
        '차녀': 2,
        '삼녀': 2,
        '사위': 3,
        '며느리': 4
    };
    
    // 파싱 및 정렬
    const parsedMourners = mourners.map(mourner => {
        const match = mourner.match(/(.+?)\s+(.+?)\s+\((.+?)\)/);
        if (match) {
            const [, relation, name, contact] = match;
            const order = relationOrder[relation] || 999;
            return { relation, name, contact, order };
        }
        return null;
    }).filter(m => m !== null);
    
    // 순서대로 정렬
    parsedMourners.sort((a, b) => a.order - b.order);
    
    container.innerHTML = parsedMourners.map(mourner => `
        <div class="mourner-card">
            <div class="mourner-main">
                <span class="mourner-relation">${mourner.relation}</span>
                <span class="mourner-name">${mourner.name}</span>
            </div>
            <div class="mourner-contact">
                <a href="tel:${mourner.contact}">${mourner.contact}</a>
            </div>
        </div>
    `).join('');
}

// 계좌 정보 표시
function displayAccounts(accountInfo) {
    if (!accountInfo) return;
    
    const container = document.getElementById('accountInfo');
    let accounts = [];
    
    // JSON 배열인지 확인
    try {
        if (typeof accountInfo === 'string' && accountInfo.startsWith('[')) {
            accounts = JSON.parse(accountInfo);
        } else if (typeof accountInfo === 'string') {
            // 텍스트 형식: "은행명 계좌번호 (예금주)"
            accounts = accountInfo.split('\n').filter(line => line.trim()).map(account => {
                const match = account.match(/(.+?)\s+(.+?)\s+\((.+?)\)/);
                if (match) {
                    const [, bank, account_number, holder] = match;
                    return { bank, account_number, holder };
                }
                return null;
            }).filter(a => a !== null);
        } else {
            accounts = accountInfo;
        }
    } catch (e) {
        console.error('계좌 정보 파싱 오류:', e);
        return;
    }
    
    container.innerHTML = accounts.map(account => `
        <div class="account-card">
            <div class="account-details">
                <div class="account-bank">${account.bank}</div>
                <div class="account-number">${account.account_number}</div>
                <div class="account-holder">${account.holder}</div>
            </div>
            <button class="btn-copy-account" onclick="copyAccountNumber('${account.account_number}')">복사</button>
        </div>
    `).join('');
}

// 계좌번호 복사
function copyAccountNumber(number) {
    navigator.clipboard.writeText(number).then(() => {
        showNotification('계좌번호가 복사되었습니다.', 'success');
    }).catch(() => {
        showNotification('복사에 실패했습니다.', 'error');
    });
}

// 에러 표시
function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'flex';
}

// 미리보기 데이터로 부고장 표시
function displayBugoPreview(data) {
    console.log('미리보기 부고장 표시 시작, 데이터:', data);
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('bugoView').style.display = 'block';
    
    // 미리보기용 데이터 변환
    const bugoData = {
        template: data.template,
        deceased_name: data.deceased_name,
        gender: data.gender,
        age: data.age,
        religion: data.religion,
        relationship: data.relationship,
        funeral_home: data.funeral_home,
        room_number: data.room_number,
        funeral_home_tel: data.funeral_home_tel,
        address: data.address ? `${data.address} ${data.address_detail || ''}`.trim() : null,
        burial_place: data.burial_place,
        message: data.message,
        photo_url: data.photo_url || null
    };
    
    // 날짜/시간 조합
    if (data.death_date) {
        if (data.death_hour && data.death_minute) {
            bugoData.death_date = `${data.death_date}T${data.death_hour}:${data.death_minute}:00`;
            bugoData.death_time = `${data.death_hour}:${data.death_minute}`;
        } else {
            bugoData.death_date = data.death_date;
        }
    }
    
    if (data.encoffin_date) {
        bugoData.encoffin_date = data.encoffin_date;
        if (data.encoffin_hour && data.encoffin_minute) {
            bugoData.encoffin_time = `${data.encoffin_hour}:${data.encoffin_minute}`;
        }
    }
    
    if (data.funeral_date) {
        bugoData.funeral_date = data.funeral_date;
        if (data.funeral_hour && data.funeral_minute) {
            bugoData.funeral_time = `${data.funeral_hour}:${data.funeral_minute}`;
        }
    }
    
    // 상주 정보
    if (data.mourners && data.mourners.length > 0) {
        bugoData.family_list = data.mourners.map(m => 
            `${m.relationship} ${m.name} (${m.contact})`
        ).join('\n');
        bugoData.mourner_name = data.mourners[0].name;
        bugoData.relationship = data.mourners[0].relationship;
        bugoData.contact = data.mourners[0].contact;
    }
    
    // 계좌 정보
    if (data.accounts && data.accounts.length > 0) {
        bugoData.account_info = data.accounts.map(a => 
            `${a.bank} ${a.number} (${a.holder})`
        ).join('\n');
    }
    
    // 기존 displayBugo 함수 호출
    displayBugo(bugoData);
}

// 날짜 포맷
function formatDate(date) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 날짜+시간 포맷
function formatDateTime(date) {
    const hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, '0');
    const ampm = hour < 12 ? '오전' : '오후';
    const displayHour = hour % 12 || 12;
    
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${ampm} ${displayHour}시 ${minute}분`;
}

// 날짜와 시간 문자열로부터 포맷
function formatDateTimeFromParts(date, timeStr) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '-';
    }
    
    // 날짜 부분
    const dateStr = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    
    // 시간이 없으면 날짜만 반환
    if (!timeStr || typeof timeStr !== 'string') {
        return dateStr;
    }
    
    // 시간 파싱
    const timeParts = timeStr.split(':');
    if (timeParts.length < 2) {
        return dateStr;
    }
    
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    
    // 유효성 검사
    if (isNaN(hour) || isNaN(minute)) {
        return dateStr;
    }
    
    const ampm = hour < 12 ? '오전' : '오후';
    const displayHour = hour % 12 || 12;
    const minuteStr = String(minute).padStart(2, '0');
    
    return `${dateStr} ${ampm} ${displayHour}시 ${minuteStr}분`;
}

// 카카오맵 초기화
function initKakaoMap(address) {
    if (typeof kakao === 'undefined') return;
    
    const mapContainer = document.getElementById('map');
    const geocoder = new kakao.maps.services.Geocoder();
    
    geocoder.addressSearch(address, function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            
            const mapOption = {
                center: coords,
                level: 3
            };
            
            const map = new kakao.maps.Map(mapContainer, mapOption);
            
            const marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });
            
            // 지도 중심을 마커 위치로 설정
            map.setCenter(coords);
        }
    });
}

// 카카오맵 길찾기
function openKakaoMap() {
    if (!bugoData || !bugoData.address) return;
    
    const address = encodeURIComponent(bugoData.address);
    const url = `https://map.kakao.com/link/search/${address}`;
    window.open(url, '_blank');
}

// 근조화 보내기
function sendCondolenceFlower() {
    showNotification('근조화 서비스 준비 중입니다.', 'info');
}

// 공유하기
function shareBugo() {
    if (!bugoData) {
        showNotification('부고장 정보를 불러올 수 없습니다.', 'error');
        return;
    }
    
    const shareUrl = window.location.href;
    const deceasedName = bugoData.deceased_name || '고인';
    const relationship = bugoData.relationship || '상주';
    
    const shareData = {
        title: `${deceasedName}님 부고`,
        text: `故 ${deceasedName}님 ${relationship} 상(喪)\n삼가 고인의 명복을 빕니다.`,
        url: shareUrl
    };
    
    // Web Share API 지원 여부 확인
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData)
            .then(() => {
                console.log('공유 성공');
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.log('공유 오류:', err);
                    fallbackShare(shareUrl);
                }
            });
    } else {
        // 폴백: 링크 복사
        fallbackShare(shareUrl);
    }
}

// 폴백 공유 (링크 복사)
function fallbackShare(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => {
                showNotification('링크가 복사되었습니다! 공유해 주세요.', 'success');
            })
            .catch(() => {
                // 클립보드 API 실패 시 수동 복사
                manualCopyFallback(url);
            });
    } else {
        // 클립보드 API 미지원 시 수동 복사
        manualCopyFallback(url);
    }
}

// 수동 복사 폴백
function manualCopyFallback(url) {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('링크가 복사되었습니다! 공유해 주세요.', 'success');
    } catch (err) {
        showNotification('링크 복사에 실패했습니다. URL을 수동으로 복사해주세요.', 'error');
    }
    
    document.body.removeChild(textarea);
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
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type]};
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// 애니메이션
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);



// ========================================
// 방명록 기능
// ========================================

let currentGuestbookPage = 1;
const guestbookLimit = 10;
let currentGuestbookId = null;
let currentAction = null;

// 탭 전환
function switchTab(tab) {
    const infoContent = document.getElementById('bugoInfoContent');
    const guestbookContent = document.getElementById('guestbookContent');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'info') {
        infoContent.style.display = 'block';
        guestbookContent.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        infoContent.style.display = 'none';
        guestbookContent.style.display = 'block';
        tabs[1].classList.add('active');
        loadGuestbook();
    }
}

// 방명록 제출
async function submitGuestbook(event) {
    event.preventDefault();
    
    const name = document.getElementById('guestName').value.trim();
    const password = document.getElementById('guestPassword').value;
    const message = document.getElementById('guestMessage').value.trim();
    
    // URL에서 bugo_id 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const bugoId = urlParams.get('id');
    
    if (!bugoId) {
        showNotification('부고장 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 유효성 검사
    if (!name || name.length === 0) {
        showNotification('이름을 입력하세요.', 'warning');
        return;
    }
    
    if (!password || password.length !== 4 || !/^\d{4}$/.test(password)) {
        showNotification('비밀번호 4자리 숫자를 입력하세요.', 'warning');
        return;
    }
    
    if (!message || message.length === 0) {
        showNotification('메시지를 입력하세요.', 'warning');
        return;
    }
    
    try {
        const response = await fetch('tables/guestbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bugo_id: bugoId,
                name: name,
                password: password,
                message: message
            })
        });
        
        if (response.ok) {
            showNotification('조문이 등록되었습니다.', 'success');
            
            // 폼 초기화
            document.getElementById('guestbookForm').reset();
            
            // 방명록 목록 새로고침
            currentGuestbookPage = 1;
            loadGuestbook();
        } else {
            showNotification('조문 등록에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('방명록 제출 오류:', error);
        showNotification('조문 등록 중 오류가 발생했습니다.', 'error');
    }
}

// 방명록 로드
async function loadGuestbook() {
    const urlParams = new URLSearchParams(window.location.search);
    const bugoId = urlParams.get('id');
    
    if (!bugoId) return;
    
    try {
        const response = await fetch(`tables/guestbook?limit=1000`);
        const data = await response.json();
        
        // 현재 부고장에 해당하는 방명록만 필터링
        const filtered = data.data.filter(item => item.bugo_id === bugoId);
        
        // 최신순 정렬 (created_at 기준)
        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
        
        displayGuestbook(filtered);
    } catch (error) {
        console.error('방명록 로드 오류:', error);
    }
}

// 방명록 표시
function displayGuestbook(entries) {
    const listContainer = document.getElementById('guestbookList');
    const emptyContainer = document.getElementById('guestbookEmpty');
    const countElement = document.getElementById('guestbookCount');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    countElement.textContent = entries.length;
    
    if (entries.length === 0) {
        listContainer.innerHTML = '';
        emptyContainer.style.display = 'block';
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    emptyContainer.style.display = 'none';
    
    // 페이지네이션 적용
    const displayCount = currentGuestbookPage * guestbookLimit;
    const displayEntries = entries.slice(0, displayCount);
    
    listContainer.innerHTML = displayEntries.map(entry => `
        <div class="guestbook-item">
            <div class="guestbook-item-header">
                <div class="guestbook-author">
                    <span class="guestbook-author-name">${escapeHtml(entry.name)}</span>
                    <span class="guestbook-date">${formatGuestbookDate(entry.created_at)}</span>
                </div>
                <div class="guestbook-actions">
                    <button class="btn-guestbook-action" onclick="openGuestbookActionModal('${entry.id}', 'edit')">수정</button>
                    <button class="btn-guestbook-action" onclick="openGuestbookActionModal('${entry.id}', 'delete')">삭제</button>
                </div>
            </div>
            <div class="guestbook-message">${escapeHtml(entry.message)}</div>
        </div>
    `).join('');
    
    // 더보기 버튼 표시/숨김
    if (entries.length > displayCount) {
        loadMoreBtn.style.display = 'block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// 더보기
function loadMoreGuestbook() {
    currentGuestbookPage++;
    loadGuestbook();
}

// 방명록 날짜 포맷
function formatGuestbookDate(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 1분 미만
    if (diff < 60000) {
        return '방금 전';
    }
    
    // 1시간 미만
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}분 전`;
    }
    
    // 24시간 미만
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}시간 전`;
    }
    
    // 7일 미만
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}일 전`;
    }
    
    // 그 외
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// HTML 이스케이프
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 방명록 액션 모달 열기
function openGuestbookActionModal(guestbookId, action) {
    currentGuestbookId = guestbookId;
    currentAction = action;
    
    document.getElementById('guestbookActionModal').style.display = 'flex';
    document.getElementById('guestbookPassword').value = '';
    document.getElementById('guestbookError').style.display = 'none';
    document.getElementById('guestbookPassword').focus();
}

// 방명록 액션 모달 닫기
function closeGuestbookActionModal() {
    document.getElementById('guestbookActionModal').style.display = 'none';
    currentGuestbookId = null;
    currentAction = null;
}

// 방명록 수정
async function editGuestbookEntry() {
    const password = document.getElementById('guestbookPassword').value;
    const errorDiv = document.getElementById('guestbookError');
    
    if (!password || password.length !== 4) {
        errorDiv.textContent = '비밀번호 4자리를 입력하세요.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!currentGuestbookId) {
        errorDiv.textContent = '방명록 정보를 찾을 수 없습니다.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        // 방명록 데이터 가져오기
        const response = await fetch(`tables/guestbook/${currentGuestbookId}`);
        const entry = await response.json();
        
        if (password !== entry.password) {
            errorDiv.textContent = '비밀번호가 일치하지 않습니다.';
            errorDiv.style.display = 'block';
            document.getElementById('guestbookPassword').value = '';
            document.getElementById('guestbookPassword').focus();
            return;
        }
        
        // 비밀번호 일치 - 수정 모드로 전환
        closeGuestbookActionModal();
        
        const newMessage = prompt('수정할 내용을 입력하세요:', entry.message);
        
        if (newMessage && newMessage.trim() !== '') {
            const updateResponse = await fetch(`tables/guestbook/${currentGuestbookId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage.trim() })
            });
            
            if (updateResponse.ok) {
                showNotification('방명록이 수정되었습니다.', 'success');
                loadGuestbook();
            } else {
                showNotification('방명록 수정에 실패했습니다.', 'error');
            }
        }
        
    } catch (error) {
        console.error('방명록 수정 오류:', error);
        errorDiv.textContent = '오류가 발생했습니다.';
        errorDiv.style.display = 'block';
    }
}

// 방명록 삭제
async function deleteGuestbookEntry() {
    const password = document.getElementById('guestbookPassword').value;
    const errorDiv = document.getElementById('guestbookError');
    
    if (!password || password.length !== 4) {
        errorDiv.textContent = '비밀번호 4자리를 입력하세요.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!currentGuestbookId) {
        errorDiv.textContent = '방명록 정보를 찾을 수 없습니다.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        // 방명록 데이터 가져오기
        const response = await fetch(`tables/guestbook/${currentGuestbookId}`);
        const entry = await response.json();
        
        if (password !== entry.password) {
            errorDiv.textContent = '비밀번호가 일치하지 않습니다.';
            errorDiv.style.display = 'block';
            document.getElementById('guestbookPassword').value = '';
            document.getElementById('guestbookPassword').focus();
            return;
        }
        
        // 비밀번호 일치 - 삭제 확인
        if (confirm('정말 삭제하시겠습니까?')) {
            const deleteResponse = await fetch(`tables/guestbook/${currentGuestbookId}`, {
                method: 'DELETE'
            });
            
            if (deleteResponse.ok) {
                showNotification('방명록이 삭제되었습니다.', 'success');
                closeGuestbookActionModal();
                loadGuestbook();
            } else {
                showNotification('방명록 삭제에 실패했습니다.', 'error');
            }
        }
        
    } catch (error) {
        console.error('방명록 삭제 오류:', error);
        errorDiv.textContent = '오류가 발생했습니다.';
        errorDiv.style.display = 'block';
    }
}

// Enter 키로 비밀번호 확인
document.addEventListener('DOMContentLoaded', function() {
    const guestbookPasswordInput = document.getElementById('guestbookPassword');
    if (guestbookPasswordInput) {
        guestbookPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (currentAction === 'edit') {
                    editGuestbookEntry();
                } else if (currentAction === 'delete') {
                    deleteGuestbookEntry();
                }
            }
        });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeGuestbookActionModal();
        }
    });
});

console.log('✅ 부고장 보기 페이지 로드 완료');
