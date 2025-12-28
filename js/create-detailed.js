// ========================================
// 부고장 상세 작성 페이지 JavaScript
// ========================================

let selectedTemplate = null;
let mournerCount = 1;
let currentStep = 1;
let isEditMode = false;
let editBugoId = null;

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initTemplateSelection();
    initFormValidation();
    initFormSubmit();
    initDateTimeSelects();
    initPhoneAutoFormat();
    initDateInputs();
    
    // 수정 모드 확인
    checkEditMode();
    
    // URL 파라미터에서 템플릿 확인 (메인에서 제작하기 버튼으로 온 경우)
    checkTemplateParam();
    
    // 임시저장 확인
    checkDraftExists();
    
    console.log('✅ 부고장 상세 작성 페이지 초기화 완료');
});

// 임시저장 존재 여부 확인
function checkDraftExists() {
    const draftId = localStorage.getItem('bugo_draft_id');
    if (draftId) {
        showDraftButton();
    }
}

// 날짜 입력 초기화
function initDateInputs() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    // 각 날짜 필드에 기본값 설정
    const deathDateInput = document.querySelector('input[name="death_date"]');
    const encoffinDateInput = document.querySelector('input[name="encoffin_date"]');
    const funeralDateInput = document.querySelector('input[name="funeral_date"]');
    
    // 임종일시: 오늘 날짜
    if (deathDateInput && !deathDateInput.value) {
        deathDateInput.value = todayStr;
    }
    
    // 입관일시: 오늘 + 1일
    if (encoffinDateInput && !encoffinDateInput.value) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        encoffinDateInput.value = tomorrowStr;
    }
    
    // 발인일시: 오늘 + 2일
    if (funeralDateInput && !funeralDateInput.value) {
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const dayAfterTomorrowStr = `${dayAfterTomorrow.getFullYear()}-${String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0')}-${String(dayAfterTomorrow.getDate()).padStart(2, '0')}`;
        funeralDateInput.value = dayAfterTomorrowStr;
    }
}

// 스텝 이동
function goToStep(step) {
    console.log('goToStep 호출됨, step:', step, 'selectedTemplate:', selectedTemplate);
    
    if (step === 2 && !selectedTemplate) {
        console.log('템플릿 미선택 - 경고 표시');
        showNotification('템플릿을 먼저 선택해주세요.', 'warning');
        return;
    }

    console.log('스텝 이동 시작');

    // 현재 스텝 숨기기
    const sections = document.querySelectorAll('.step-section');
    console.log('찾은 섹션 수:', sections.length);
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // 프로그레스 업데이트
    const progressSteps = document.querySelectorAll('.progress-step');
    console.log('찾은 프로그레스 스텝 수:', progressSteps.length);
    progressSteps.forEach(progressStep => {
        const stepNum = parseInt(progressStep.dataset.step);
        if (stepNum === step) {
            progressStep.classList.add('active');
        } else {
            progressStep.classList.remove('active');
        }
    });

    // 새 스텝 표시
    const targetStep = document.getElementById(`step${step}`);
    console.log('타겟 스텝:', targetStep);
    if (targetStep) {
        targetStep.classList.add('active');
        console.log('스텝', step, '활성화됨');
    } else {
        console.error('스텝', step, '을(를) 찾을 수 없습니다!');
    }
    
    currentStep = step;

    // 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('스텝 이동 완료');
}

// 템플릿 선택 초기화
function initTemplateSelection() {
    // 템플릿 선택은 버튼으로만 처리
}

// 현재 미리보기 중인 템플릿
let currentPreviewTemplate = null;

// 템플릿 미리보기
function previewTemplate(template) {
    currentPreviewTemplate = template;
    
    const templateMap = {
        basic: 'templates/basic.html',
        ribbon: 'templates/ribbon.html',
        border: 'templates/border.html',
        flower: 'templates/flower.html'
    };
    
    const templateNames = {
        basic: '기본형 부고장',
        ribbon: '정중형 부고장',
        border: '안내형 부고장',
        flower: '고급형 부고장'
    };
    
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewModalFrame');
    const title = document.getElementById('previewModalTitle');
    
    if (modal && iframe && title) {
        iframe.src = templateMap[template] || templateMap.basic;
        title.textContent = templateNames[template] || '템플릿 미리보기';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// 미리보기 모달 닫기
function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewModalFrame');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // iframe 초기화
        if (iframe) {
            iframe.src = '';
        }
        currentPreviewTemplate = null;
    }
}

// 미리보기에서 템플릿 선택
function selectTemplateFromPreview() {
    if (currentPreviewTemplate) {
        closePreviewModal();
        selectTemplate(currentPreviewTemplate);
    }
}

// 템플릿 선택기 표시 (미리보기에서)
function showTemplateSelector() {
    closePreviewModal();
    goToStep(1);
}

// URL 파라미터에서 템플릿 확인
function checkTemplateParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const template = urlParams.get('template');
    const shouldLoadDraft = urlParams.get('loadDraft');
    
    // 임시저장 불러오기 우선 처리
    if (shouldLoadDraft === 'true') {
        setTimeout(() => {
            loadDraft();
        }, 500);
        return;
    }
    
    if (template && ['basic', 'ribbon', 'border', 'flower'].includes(template)) {
        console.log('URL에서 템플릿 감지:', template);
        selectedTemplate = template;
        
        const templateInput = document.getElementById('template');
        if (templateInput) {
            templateInput.value = template;
        }
        
        // 바로 step 2로 이동
        setTimeout(() => {
            goToStep(2);
        }, 300);
    }
}

// 템플릿 선택
function selectTemplate(template) {
    console.log('템플릿 선택:', template);
    selectedTemplate = template;
    
    const templateInput = document.getElementById('template');
    if (templateInput) {
        templateInput.value = template;
        console.log('템플릿 input 값 설정됨:', templateInput.value);
    } else {
        console.error('template input을 찾을 수 없습니다!');
    }
    
    showNotification('템플릿이 선택되었습니다!', 'success');
    
    setTimeout(() => {
        console.log('스텝 2로 이동 시도');
        goToStep(2);
    }, 500);
}

// 날짜/시간 선택 박스 초기화
function initDateTimeSelects() {
    // 시 (0-23)
    const hourSelects = document.querySelectorAll('[name="death_hour"], [name="encoffin_hour"], [name="funeral_hour"]');
    hourSelects.forEach(select => {
        for (let hour = 0; hour <= 23; hour++) {
            const option = document.createElement('option');
            option.value = String(hour).padStart(2, '0');
            option.textContent = `${hour}시`;
            select.appendChild(option);
        }
    });
    
    // 분 (5분 단위: 5, 10, 15, ..., 55) - 00분은 HTML에 이미 기본값으로 설정됨
    const minuteSelects = document.querySelectorAll('[name="death_minute"], [name="encoffin_minute"], [name="funeral_minute"]');
    minuteSelects.forEach(select => {
        for (let minute = 5; minute < 60; minute += 5) {
            const option = document.createElement('option');
            option.value = String(minute).padStart(2, '0');
            option.textContent = `${String(minute).padStart(2, '0')}분`;
            select.appendChild(option);
        }
    });
}

// 전화번호 자동 포맷
function initPhoneAutoFormat() {
    // tel 타입과 no-phone-format 클래스가 없는 input에만 적용
    document.querySelectorAll('input[type="tel"]:not(.no-phone-format)').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            let formatted = '';
            
            if (value.length <= 3) {
                formatted = value;
            } else if (value.length <= 7) {
                formatted = value.slice(0, 3) + '-' + value.slice(3);
            } else if (value.length <= 11) {
                formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
            } else {
                formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
            }
            
            e.target.value = formatted;
        });
    });
    
    // 동적으로 추가되는 상주 연락처에도 적용
    document.addEventListener('input', function(e) {
        if (e.target.matches('input[type="tel"]:not(.no-phone-format)') && e.target.name && e.target.name.includes('mourners')) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            let formatted = '';
            
            if (value.length <= 3) {
                formatted = value;
            } else if (value.length <= 7) {
                formatted = value.slice(0, 3) + '-' + value.slice(3);
            } else if (value.length <= 11) {
                formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
            } else {
                formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
            }
            
            e.target.value = formatted;
        }
    });
}

// 종교 입력 토글
function toggleReligionInput() {
    const select = document.getElementById('religionSelect');
    const inputGroup = document.getElementById('religionInputGroup');
    
    if (select.value === '기타') {
        inputGroup.style.display = 'block';
    } else {
        inputGroup.style.display = 'none';
    }
}

// 상주 추가
function addMourner() {
    const mournersList = document.getElementById('mournersList');
    mournerCount++;
    
    const mournerHTML = `
        <div class="mourner-item" data-index="${mournerCount - 1}">
            <div class="mourner-header">
                <span class="mourner-number">상주 ${mournerCount}</span>
                <button type="button" class="btn-remove-mourner" onclick="removeMourner(this)">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    삭제
                </button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label required">관계</label>
                    <select name="mourners[${mournerCount - 1}][relationship]" class="form-select" required>
                        <option value="">선택</option>
                        <option value="배우자">배우자</option>
                        <option value="아들">아들</option>
                        <option value="딸">딸</option>
                        <option value="며느리">며느리</option>
                        <option value="사위">사위</option>
                        <option value="손">손</option>
                        <option value="손자">손자</option>
                        <option value="손녀">손녀</option>
                        <option value="외손">외손</option>
                        <option value="외손자">외손자</option>
                        <option value="외손녀">외손녀</option>
                        <option value="증손">증손</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label required">성함</label>
                    <input type="text" name="mourners[${mournerCount - 1}][name]" class="form-input" placeholder="상주 성함" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label required">연락처</label>
                <input type="tel" name="mourners[${mournerCount - 1}][contact]" class="form-input" placeholder="010-0000-0000" required>
            </div>
        </div>
    `;
    
    mournersList.insertAdjacentHTML('beforeend', mournerHTML);
    showNotification('상주가 추가되었습니다.', 'success');
}

// 상주 삭제
function removeMourner(button) {
    const mournerItem = button.closest('.mourner-item');
    mournerItem.remove();
    mournerCount--;
    
    // 상주 번호 재정렬
    const mournerItems = document.querySelectorAll('.mourner-item');
    mournerItems.forEach((item, index) => {
        item.querySelector('.mourner-number').textContent = `상주 ${index + 1}`;
    });
    
    showNotification('상주가 삭제되었습니다.', 'success');
}

// 계좌 정보 토글
function toggleAccountInfo() {
    const accountInfo = document.getElementById('accountInfo');
    const isChecked = document.getElementById('accountToggle').checked;
    
    if (isChecked) {
        accountInfo.style.display = 'block';
    } else {
        accountInfo.style.display = 'none';
    }
}

// 폼 유효성 검사 초기화
function initFormValidation() {
    const form = document.getElementById('bugoForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

// 필드 유효성 검사
function validateField(field) {
    const value = field.value.trim();
    const formGroup = field.closest('.form-group');
    
    // 기존 에러 메시지 제거
    const existingError = formGroup?.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    field.classList.remove('error');
    
    // 필수 항목 검사
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        showFieldError(formGroup, '필수 입력 항목입니다.');
        return false;
    }
    
    // 전화번호 형식 검증
    if (field.type === 'tel' && value) {
        const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phoneRegex.test(value.replace(/\-/g, ''))) {
            field.classList.add('error');
            showFieldError(formGroup, '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
            return false;
        }
    }
    
    return true;
}

// 필드 에러 메시지 표시
function showFieldError(formGroup, message) {
    if (!formGroup) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
        ${message}
    `;
    formGroup.appendChild(errorDiv);
}

// 주소 검색 (Daum 주소 API)
function searchAddress() {
    new daum.Postcode({
        oncomplete: function(data) {
            let addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
            document.getElementById('address').value = addr;
            
            // 상세주소 입력란 표시
            const addressDetail = document.getElementById('address_detail');
            if (addressDetail) {
                addressDetail.style.display = 'block';
                addressDetail.focus();
            }
        }
    }).open();
}



// 폼 제출 초기화
function initFormSubmit() {
    const form = document.getElementById('bugoForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 전체 필수 항목 검사
        console.log('🔍 필수 항목 검사 시작');
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        console.log('📋 필수 필드 수:', requiredFields.length);
        
        requiredFields.forEach((field, index) => {
            const fieldValid = validateField(field);
            if (!fieldValid) {
                console.log(`❌ 필드 ${index + 1} 검증 실패:`, field.name, field.value);
                isValid = false;
            }
        });
        
        if (!isValid) {
            console.log('❌ 필수 항목 검증 실패');
            showNotification('필수 항목을 모두 입력해주세요.', 'error');
            const firstError = form.querySelector('.error');
            if (firstError) {
                // 스크롤 애니메이션
                firstError.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // 깜빡임 효과
                setTimeout(() => {
                    firstError.style.animation = 'none';
                    setTimeout(() => {
                        firstError.style.animation = 'shake 0.5s ease-in-out';
                    }, 10);
                }, 500);
            }
            return;
        }
        
        // 폼 데이터 수집
        const formData = new FormData(form);
        
        // 날짜 순서 검증 (별세 ≤ 입관 ≤ 발인)
        const checkDeathDate = formData.get('death_date');
        const checkDeathHour = formData.get('death_hour');
        const checkDeathMinute = formData.get('death_minute');
        
        const checkEncoffinDate = formData.get('encoffin_date');
        const checkEncoffinHour = formData.get('encoffin_hour');
        const checkEncoffinMinute = formData.get('encoffin_minute');
        
        const checkFuneralDate = formData.get('funeral_date');
        const checkFuneralHour = formData.get('funeral_hour');
        const checkFuneralMinute = formData.get('funeral_minute');
        
        // 날짜/시간을 타임스탬프로 변환
        const deathTimestamp = checkDeathDate && checkDeathHour && checkDeathMinute ? 
            new Date(`${checkDeathDate}T${checkDeathHour}:${checkDeathMinute}:00`).getTime() : null;
        const encoffinTimestamp = checkEncoffinDate && checkEncoffinHour && checkEncoffinMinute ? 
            new Date(`${checkEncoffinDate}T${checkEncoffinHour}:${checkEncoffinMinute}:00`).getTime() : null;
        const funeralTimestamp = checkFuneralDate && checkFuneralHour && checkFuneralMinute ? 
            new Date(`${checkFuneralDate}T${checkFuneralHour}:${checkFuneralMinute}:00`).getTime() : null;
        
        // 입관일시가 별세일시보다 빠른지 확인
        if (deathTimestamp && encoffinTimestamp && encoffinTimestamp < deathTimestamp) {
            showNotification('입관일시는 별세일시와 같거나 이후여야 합니다.', 'error');
            document.querySelector('input[name="encoffin_date"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // 발인일시가 입관일시보다 빠른지 확인
        if (encoffinTimestamp && funeralTimestamp && funeralTimestamp < encoffinTimestamp) {
            showNotification('발인일시는 입관일시와 같거나 이후여야 합니다.', 'error');
            document.querySelector('input[name="funeral_date"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // 상주 정보 수집
        const mourners = [];
        for (let i = 0; i < mournerCount; i++) {
            const relationship = formData.get(`mourners[${i}][relationship]`);
            const name = formData.get(`mourners[${i}][name]`);
            const contact = formData.get(`mourners[${i}][contact]`);
            
            if (relationship && name && contact) {
                mourners.push({ relationship, name, contact });
            }
        }
        
        // 계좌 정보 수집
        let accounts = null;
        if (document.getElementById('accountToggle').checked) {
            const holder = formData.get('accounts[0][holder]');
            const bank = formData.get('accounts[0][bank]');
            const number = formData.get('accounts[0][number]');
            
            if (holder && bank && number) {
                accounts = [{ holder, bank, number }];
            }
        }
        
        // 별세일시 조합 (날짜 + 시간)
        const deathDateValue = formData.get('death_date');
        const deathHour = formData.get('death_hour');
        const deathMinute = formData.get('death_minute');
        let deathDate = null;
        if (deathDateValue) {
            if (deathHour && deathMinute) {
                deathDate = `${deathDateValue}T${deathHour}:${deathMinute}:00`;
            } else {
                deathDate = `${deathDateValue}T00:00:00`;
            }
        }
        
        // 발인일시 조합 (날짜 + 시간)
        const funeralDateValue = formData.get('funeral_date');
        const funeralHour = formData.get('funeral_hour');
        const funeralMinute = formData.get('funeral_minute');
        let funeralTime = null;
        if (funeralHour && funeralMinute) {
            funeralTime = `${funeralHour}:${funeralMinute}`;
        }
        
        // 종교 (기타 선택 시 직접 입력값)
        let religion = formData.get('religion');
        if (religion === '기타') {
            religion = formData.get('religion_custom') || '기타';
        }
        
        const bugoData = {
            template: selectedTemplate,
            applicant_name: formData.get('applicant_name'),
            phone_password: formData.get('phone_password'),
            deceased_name: formData.get('deceased_name'),
            gender: formData.get('gender'),
            relationship: formData.get('relationship'),
            age: formData.get('age') ? parseInt(formData.get('age')) : null,
            religion: religion || null,
            mourners: mourners,
            funeral_home: formData.get('funeral_home'),
            room_number: formData.get('room_number') || null,
            funeral_home_tel: formData.get('funeral_home_tel') || null,
            address: formData.get('address') ? 
                `${formData.get('address')} ${formData.get('address_detail') || ''}`.trim() : null,
            death_date: deathDate,
            funeral_date: funeralDateValue,
            funeral_time: funeralTime,
            burial_place: formData.get('burial_place') || null,
            message: formData.get('message') || null,
            accounts: accounts
        };
        
        // 데이터베이스에 저장
        console.log('부고 데이터 전송 시작:', bugoData);
        await saveBugoData(bugoData);
    });
}

// 부고장 고유번호 생성 (4자리)
async function generateBugoNumber() {
    // 1000-9999 사이의 랜덤 숫자 생성
    let bugoNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    while (!isUnique && attempts < maxAttempts) {
        bugoNumber = String(Math.floor(1000 + Math.random() * 9000));
        
        // 중복 확인
        try {
            const response = await fetch(`tables/bugo?search=${bugoNumber}&limit=1`);
            const data = await response.json();
            
            if (data.data.length === 0) {
                isUnique = true;
            }
        } catch (error) {
            console.error('부고번호 중복 확인 실패:', error);
        }
        
        attempts++;
    }
    
    if (!isUnique) {
        // 최대 시도 횟수 초과 시 타임스탬프 기반 생성
        bugoNumber = String(Date.now()).slice(-4);
    }
    
    return bugoNumber;
}

// 로딩 오버레이 표시
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// 로딩 오버레이 숨김
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// 부고 데이터 저장
async function saveBugoData(data) {
    try {
        console.log('saveBugoData 함수 시작:', data);
        showLoading(); // 로딩 표시
        
        // 부고장 고유번호 생성 (4자리)
        const bugoNumber = await generateBugoNumber();
        
        // 상주 정보를 문자열로 변환
        const mournersText = data.mourners && data.mourners.length > 0 ?
            data.mourners.map(m => `${m.relationship} ${m.name} (${m.contact})`).join('\n') : '';
        
        // 계좌 정보를 문자열로 변환
        const accountsText = data.accounts ? 
            data.accounts.map(a => `${a.bank} ${a.number} (${a.holder})`).join('\n') : null;
        
        const saveData = {
            bugo_number: bugoNumber,
            template: data.template,
            applicant_name: data.applicant_name,
            phone_password: data.phone_password,
            deceased_name: data.deceased_name,
            gender: data.gender,
            relationship: data.relationship,
            age: data.age,
            death_date: data.death_date,
            religion: data.religion,
            mourner_name: data.mourners[0]?.name || '',
            contact: data.mourners[0]?.contact || '',
            funeral_home: data.funeral_home,
            room_number: data.room_number,
            funeral_home_tel: data.funeral_home_tel,
            address: data.address,
            funeral_date: data.funeral_date,
            funeral_time: data.funeral_time,
            burial_place: data.burial_place,
            message: data.message,
            family_list: mournersText,
            account_info: accountsText,
            photo_url: data.photo_url || null
        };
        
        console.log('서버로 전송할 데이터:', saveData);
        
        // 수정 모드면 PUT, 생성 모드면 POST
        const url = isEditMode ? `tables/bugo/${editBugoId}` : 'tables/bugo';
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saveData)
        });
        
        console.log('서버 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('서버 응답 오류:', errorData);
            throw new Error(errorData.message || '부고장 저장에 실패했습니다.');
        }
        
        const savedData = await response.json();
        console.log('부고장 저장 성공:', savedData);
        
        // ID가 없으면 오류
        if (!savedData.id) {
            console.error('저장된 데이터에 ID가 없습니다:', savedData);
            throw new Error('부고장 ID를 받지 못했습니다.');
        }
        
        const successMessage = isEditMode ? '부고장이 성공적으로 수정되었습니다!' : '부고장이 성공적으로 생성되었습니다!';
        
        // 로딩 숨김
        hideLoading();
        
        showNotification(successMessage, 'success');
        
        // 임시저장 정리
        localStorage.removeItem('bugo_draft_id');
        localStorage.removeItem('bugo_draft_time');
        
        // 수정 모드 localStorage 정리
        if (isEditMode) {
            localStorage.removeItem('edit_bugo_data');
            localStorage.removeItem('edit_bugo_id');
        }
        
        // Step 3으로 이동하여 공유 화면 표시
        setTimeout(() => {
            displayShareScreen(savedData);
        }, 500);
        
    } catch (error) {
        console.error('부고장 저장 오류:', error);
        hideLoading(); // 오류 시에도 로딩 숨김
        showNotification('부고장 생성 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}

// 미리보기
function previewBugo() {
    const form = document.getElementById('bugoForm');
    if (!form) return;
    
    // 폼 데이터 수집
    const formData = new FormData(form);
    
    // 필수 필드 확인
    const deceasedName = formData.get('deceased_name');
    const funeralHome = formData.get('funeral_home');
    
    if (!deceasedName || !funeralHome) {
        showNotification('고인 성함과 장례식장은 필수 입력 항목입니다.', 'warning');
        return;
    }
    
    // 미리보기 데이터 객체 생성
    const previewData = {
        template: selectedTemplate || 'basic',
        deceased_name: deceasedName,
        gender: formData.get('gender'),
        age: formData.get('age'),
        religion: formData.get('religion') === '기타' ? formData.get('religion_custom') : formData.get('religion'),
        relationship: formData.get('relationship'),
        funeral_home: funeralHome,
        room_number: formData.get('room_number'),
        funeral_home_tel: formData.get('funeral_home_tel'),
        address: formData.get('address'),
        address_detail: formData.get('address_detail'),
        death_date: formData.get('death_date'),
        death_hour: formData.get('death_hour'),
        death_minute: formData.get('death_minute'),
        encoffin_date: formData.get('encoffin_date'),
        encoffin_hour: formData.get('encoffin_hour'),
        encoffin_minute: formData.get('encoffin_minute'),
        funeral_date: formData.get('funeral_date'),
        funeral_hour: formData.get('funeral_hour'),
        funeral_minute: formData.get('funeral_minute'),
        burial_place: formData.get('burial_place'),
        message: formData.get('message'),
        photo_url: formData.get('photo_url') || null,
        preview: true // 미리보기 모드 플래그
    };
    
    // 상주 정보
    const mourners = [];
    for (let i = 0; i < mournerCount; i++) {
        const relationship = formData.get(`mourners[${i}][relationship]`);
        const name = formData.get(`mourners[${i}][name]`);
        const contact = formData.get(`mourners[${i}][contact]`);
        if (relationship && name) {
            mourners.push({ relationship, name, contact });
        }
    }
    previewData.mourners = mourners;
    
    // 계좌 정보
    if (document.getElementById('accountToggle')?.checked) {
        const accounts = [];
        const holder = formData.get('accounts[0][holder]');
        const bank = formData.get('accounts[0][bank]');
        const number = formData.get('accounts[0][number]');
        if (holder && bank && number) {
            accounts.push({ holder, bank, number });
        }
        previewData.accounts = accounts;
    }
    
    // 데이터를 sessionStorage에 저장
    sessionStorage.setItem('preview_data', JSON.stringify(previewData));
    
    // 미리보기 모달 열기
    const modal = document.getElementById('bugoPreviewModal');
    const iframe = document.getElementById('bugoPreviewFrame');
    
    if (modal && iframe) {
        iframe.src = 'view.html?preview=true';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// 미리보기 모달 닫기
function closeBugoPreview() {
    const modal = document.getElementById('bugoPreviewModal');
    const iframe = document.getElementById('bugoPreviewFrame');
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        if (iframe) {
            iframe.src = '';
        }
    }
}

// 임시저장
async function saveDraft() {
    const form = document.getElementById('bugoForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const draftData = {};
    
    // 폼 데이터를 객체로 변환
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('mourners[') || key.startsWith('accounts[')) {
            continue; // 배열 데이터는 별도 처리
        }
        draftData[key] = value;
    }
    
    // 상주 정보 수집
    const mourners = [];
    const mournerElements = document.querySelectorAll('.mourner-item');
    mournerElements.forEach((item, index) => {
        const relationship = form.querySelector(`[name="mourners[${index}][relationship]"]`)?.value;
        const name = form.querySelector(`[name="mourners[${index}][name]"]`)?.value;
        const contact = form.querySelector(`[name="mourners[${index}][contact]"]`)?.value;
        
        if (relationship && name) {
            mourners.push({ relationship, name, contact });
        }
    });
    draftData.mourners = JSON.stringify(mourners);
    
    // 계좌 정보 수집
    const accounts = [];
    const accountElements = document.querySelectorAll('.account-item');
    accountElements.forEach((item, index) => {
        const holder = form.querySelector(`[name="accounts[${index}][holder]"]`)?.value;
        const bank = form.querySelector(`[name="accounts[${index}][bank]"]`)?.value;
        const number = form.querySelector(`[name="accounts[${index}][number]"]`)?.value;
        
        if (holder || bank || number) {
            accounts.push({ holder, bank, number });
        }
    });
    draftData.accounts = JSON.stringify(accounts);
    
    // 시간 정보 조합
    const deathHour = form.querySelector('[name="death_hour"]')?.value;
    const deathMinute = form.querySelector('[name="death_minute"]')?.value;
    if (deathHour && deathMinute) {
        draftData.death_time = `${deathHour}:${deathMinute}`;
    }
    
    const encoffinHour = form.querySelector('[name="encoffin_hour"]')?.value;
    const encoffinMinute = form.querySelector('[name="encoffin_minute"]')?.value;
    if (encoffinHour && encoffinMinute) {
        draftData.encoffin_time = `${encoffinHour}:${encoffinMinute}`;
    }
    
    const funeralHour = form.querySelector('[name="funeral_hour"]')?.value;
    const funeralMinute = form.querySelector('[name="funeral_minute"]')?.value;
    if (funeralHour && funeralMinute) {
        draftData.funeral_time = `${funeralHour}:${funeralMinute}`;
    }
    
    // 임시저장 키 생성 (신청자명_전화번호)
    const draftKey = `${draftData.applicant_name || 'unknown'}_${draftData.phone_password || '0000'}`;
    draftData.draft_key = draftKey;
    
    try {
        // DB에 저장
        const response = await fetch('tables/drafts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(draftData)
        });
        
        if (response.ok) {
            const result = await response.json();
            // LocalStorage에도 draft_id 저장
            localStorage.setItem('bugo_draft_id', result.id);
            localStorage.setItem('bugo_draft_time', new Date().toISOString());
            
            showNotification('임시저장되었습니다.', 'success');
            showDraftButton(); // 네비게이션에 버튼 표시
        } else {
            throw new Error('저장 실패');
        }
    } catch (error) {
        console.error('임시저장 실패:', error);
        showNotification('임시저장에 실패했습니다.', 'error');
    }
}

// 임시저장 배너 표시
function showDraftButton() {
    // 이미 배너가 있으면 리턴
    if (document.getElementById('draftBanner')) return;
    
    const body = document.body;
    
    const draftBanner = document.createElement('div');
    draftBanner.id = 'draftBanner';
    draftBanner.className = 'draft-banner';
    draftBanner.innerHTML = `
        <div class="draft-banner-content">
            <span class="material-symbols-outlined">draft</span>
            <div class="draft-banner-left">
                <span class="draft-banner-text">임시저장된 내용이 있습니다</span>
                <button class="draft-banner-btn-delete" onclick="deleteDraft()">지우기</button>
            </div>
            <button class="draft-banner-btn" onclick="loadDraft()">불러오기</button>
        </div>
    `;
    
    // body 최상단에 삽입
    body.insertBefore(draftBanner, body.firstChild);
}

// 임시저장 삭제
function deleteDraft() {
    if (confirm('임시저장된 내용을 삭제하시겠습니까?')) {
        localStorage.removeItem('bugo_draft_id');
        localStorage.removeItem('bugo_draft_time');
        
        // 배너 제거
        const banner = document.getElementById('draftBanner');
        if (banner) {
            banner.remove();
        }
        
        showNotification('임시저장이 삭제되었습니다.', 'info');
    }
}

// 임시저장 불러오기
async function loadDraft() {
    const draftId = localStorage.getItem('bugo_draft_id');
    if (!draftId) {
        showNotification('임시저장된 내용이 없습니다.', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`tables/drafts/${draftId}`);
        if (response.ok) {
            const draftData = await response.json();
            fillFormWithDraft(draftData);
            showNotification('임시저장 내용을 불러왔습니다.', 'success');
            
            // 배너 숨기기
            const banner = document.getElementById('draftBanner');
            if (banner) {
                banner.style.display = 'none';
            }
        } else {
            throw new Error('불러오기 실패');
        }
    } catch (error) {
        console.error('임시저장 불러오기 실패:', error);
        showNotification('임시저장 내용을 불러오는데 실패했습니다.', 'error');
    }
}

// 폼에 임시저장 데이터 채우기
function fillFormWithDraft(data) {
    const form = document.getElementById('bugoForm');
    if (!form) return;
    
    // 템플릿 선택
    if (data.template) {
        selectedTemplate = data.template;
        document.getElementById('template').value = data.template;
        goToStep(2);
    }
    
    // 기본 필드 채우기
    Object.keys(data).forEach(key => {
        if (key === 'mourners' || key === 'accounts' || key === 'id' || key === 'draft_key') return;
        
        const input = form.querySelector(`[name="${key}"]`);
        if (input && data[key]) {
            input.value = data[key];
        }
    });
    
    // 상주 정보 복원
    if (data.mourners) {
        try {
            const mourners = JSON.parse(data.mourners);
            // TODO: 상주 UI 복원 로직
        } catch (e) {
            console.error('상주 정보 파싱 실패:', e);
        }
    }
    
    // 계좌 정보 복원
    if (data.accounts) {
        try {
            const accounts = JSON.parse(data.accounts);
            // TODO: 계좌 UI 복원 로직
        } catch (e) {
            console.error('계좌 정보 파싱 실패:', e);
        }
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.667 3.5L5.25 9.917 2.333 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        error: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" stroke-width="1.5"/><path d="M7 4.2v2.8M7 9.8h.01" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>',
        warning: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2.1L12.124 11.2H1.876L7 2.1z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 5.6v2.1M7 9.8h.01" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>',
        info: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" stroke-width="1.5"/><path d="M7 6.3v2.8M7 4.2h.01" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };
    
    const colors = {
        success: '#00C853',
        error: '#FF6B6B',
        warning: '#FFA726',
        info: '#3182F6'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-message">${message}</div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 24px;
        right: 24px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        color: var(--gray-800);
        padding: 14px 20px;
        border-radius: 12px;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(0, 0, 0, 0.06);
    `;
    
    notification.querySelector('.notification-icon').style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${colors[type]};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 애니메이션 스타일
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
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
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// 네비게이션 토글
document.getElementById('navToggle')?.addEventListener('click', function() {
    document.getElementById('navMenu')?.classList.toggle('active');
});

// ========================================
// Step 3: 공유하기 관련 함수
// ========================================

let currentBugoId = null;
let currentBugoUrl = null;

// 공유 화면 표시
function displayShareScreen(bugoData) {
    currentBugoId = bugoData.id;
    currentBugoUrl = `${window.location.origin}/view.html?id=${bugoData.id}`;
    
    // Step 3로 이동
    goToStep(3);
    
    // 공유 링크 입력란에 URL 설정
    const shareLinkInput = document.getElementById('shareLink');
    if (shareLinkInput) {
        shareLinkInput.value = currentBugoUrl;
    }
    
    // 미리보기 내용 생성
    generatePreviewContent(bugoData);
}

// 미리보기 내용 생성
function generatePreviewContent(bugoData) {
    const previewContent = document.getElementById('bugoPreviewContent');
    if (!previewContent) return;
    
    const html = `
        <div style="text-align: center; padding: 20px;">
            <h3 style="font-size: 20px; margin-bottom: 16px; color: var(--gray-900);">訃告</h3>
            <div style="margin-bottom: 16px;">
                <p style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">${bugoData.deceased_name || ''} (${bugoData.gender === '남' ? '남' : '여'})</p>
                <p style="font-size: 14px; color: var(--gray-600);">별세</p>
            </div>
            <div style="font-size: 14px; color: var(--gray-700); line-height: 1.8;">
                <p><strong>빈소:</strong> ${bugoData.funeral_home || ''}</p>
                <p><strong>발인:</strong> ${bugoData.funeral_datetime ? new Date(bugoData.funeral_datetime).toLocaleString('ko-KR') : ''}</p>
                <p><strong>상주:</strong> ${bugoData.mourner_name || ''}</p>
            </div>
        </div>
    `;
    
    previewContent.innerHTML = html;
}

// 공유 링크 복사
function copyShareLink() {
    const shareLinkInput = document.getElementById('shareLink');
    if (!shareLinkInput) return;
    
    shareLinkInput.select();
    shareLinkInput.setSelectionRange(0, 99999); // 모바일 대응
    
    try {
        document.execCommand('copy');
        showNotification('링크가 복사되었습니다!', 'success');
    } catch (err) {
        // Clipboard API 사용
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            showNotification('링크가 복사되었습니다!', 'success');
        }).catch(() => {
            showNotification('링크 복사에 실패했습니다.', 'error');
        });
    }
}

// 카카오톡 공유
function shareKakao() {
    if (!currentBugoUrl) {
        showNotification('공유할 링크가 없습니다.', 'error');
        return;
    }
    
    // 카카오톡 공유 (모바일에서 작동)
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(currentBugoUrl)}`;
    window.open(kakaoUrl, '_blank');
}

// 문자 공유
function shareSMS() {
    if (!currentBugoUrl) {
        showNotification('공유할 링크가 없습니다.', 'error');
        return;
    }
    
    const message = `부고장을 공유합니다.\n${currentBugoUrl}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
}

// 계좌번호 복사
function copyAccountNumber(number) {
    if (!number) {
        showNotification('계좌번호가 없습니다.', 'error');
        return;
    }
    
    navigator.clipboard.writeText(number).then(() => {
        showNotification('계좌번호가 복사되었습니다.', 'success');
    }).catch((error) => {
        console.error('복사 실패:', error);
        showNotification('복사에 실패했습니다.', 'error');
    });
}

// 링크 공유 (Web Share API)
function shareLink() {
    if (!currentBugoUrl) {
        showNotification('공유할 링크가 없습니다.', 'error');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: '부고장',
            text: '부고장을 공유합니다.',
            url: currentBugoUrl
        }).then(() => {
            showNotification('공유되었습니다.', 'success');
        }).catch((error) => {
            console.log('공유 취소 또는 오류:', error);
        });
    } else {
        // Web Share API 미지원 시 링크 복사
        copyShareLink();
    }
}

// 전체 보기
function viewFullBugo() {
    if (!currentBugoId) {
        showNotification('부고장 정보가 없습니다.', 'error');
        return;
    }
    
    window.open(`view.html?id=${currentBugoId}`, '_blank');
}

// 전역 함수 명시적 할당
window.selectTemplate = selectTemplate;
window.previewTemplate = previewTemplate;
window.closePreviewModal = closePreviewModal;
window.goToStep = goToStep;
window.addMourner = addMourner;
window.removeMourner = removeMourner;
window.toggleAccountInfo = toggleAccountInfo;
window.toggleReligionInput = toggleReligionInput;
window.searchAddress = searchAddress;
window.previewBugo = previewBugo;
window.saveDraft = saveDraft;
window.copyAccountNumber = copyAccountNumber;
window.copyShareLink = copyShareLink;
window.shareKakao = shareKakao;
window.shareSMS = shareSMS;
window.shareLink = shareLink;
window.viewFullBugo = viewFullBugo;

// 수정 모드 확인 및 데이터 로드
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        isEditMode = true;
        editBugoId = editId;
        
        // localStorage에서 데이터 로드
        const editData = localStorage.getItem('edit_bugo_data');
        if (editData) {
            try {
                const bugoData = JSON.parse(editData);
                loadEditData(bugoData);
                
                // 버튼 텍스트 변경
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = '수정 완료';
                }
                
                console.log('✅ 수정 모드로 로드됨:', editId);
            } catch (error) {
                console.error('수정 데이터 로드 오류:', error);
            }
        }
    }
}

// 수정할 데이터 로드
function loadEditData(data) {
    // Step 1: 템플릿 선택 및 자동 이동
    if (data.template) {
        selectTemplate(data.template);
        setTimeout(() => goToStep(2), 500);
    }
    
    // Step 2: 폼 데이터 채우기
    setTimeout(() => {
        // 신청자 정보
        setFieldValue('applicant_name', data.applicant_name);
        setFieldValue('phone_password', data.phone_password);
        
        // 고인 정보
        setFieldValue('deceased_name', data.deceased_name);
        setFieldValue('gender', data.gender);
        setFieldValue('relationship', data.relationship);
        setFieldValue('age', data.age);
        setFieldValue('religion', data.religion);
        
        // 상주 정보 (family_list에서 파싱)
        if (data.family_list) {
            loadMourners(data.family_list);
        }
        
        // 장례식장 정보
        setFieldValue('funeral_home', data.funeral_home);
        setFieldValue('room_number', data.room_number);
        setFieldValue('funeral_home_tel', data.funeral_home_tel);
        
        // 주소
        if (data.address) {
            const addressParts = data.address.split(' ');
            const detailIndex = addressParts.findIndex(part => 
                part.includes('동') || part.includes('호') || part.length < 3
            );
            
            if (detailIndex > 0) {
                setFieldValue('address', addressParts.slice(0, detailIndex).join(' '));
                setFieldValue('address_detail', addressParts.slice(detailIndex).join(' '));
                document.getElementById('address_detail').style.display = 'block';
            } else {
                setFieldValue('address', data.address);
            }
        }
        
        // 날짜/시간 데이터 파싱
        if (data.death_date) {
            const deathDT = new Date(data.death_date);
            setFieldValue('death_date', formatDate(deathDT));
            setFieldValue('death_hour', String(deathDT.getHours()).padStart(2, '0'));
            setFieldValue('death_minute', String(deathDT.getMinutes()).padStart(2, '0'));
        }
        
        if (data.funeral_datetime) {
            const funeralDT = new Date(data.funeral_datetime);
            setFieldValue('funeral_date', formatDate(funeralDT));
            setFieldValue('funeral_hour', String(funeralDT.getHours()).padStart(2, '0'));
            setFieldValue('funeral_minute', String(funeralDT.getMinutes()).padStart(2, '0'));
        }
        
        // 입관일시 (encoffin_date, encoffin_time)
        if (data.encoffin_date) {
            setFieldValue('encoffin_date', data.encoffin_date);
        }
        if (data.encoffin_time) {
            const [hour, minute] = data.encoffin_time.split(':');
            setFieldValue('encoffin_hour', hour);
            setFieldValue('encoffin_minute', minute || '00');
        }
        
        // 장지
        setFieldValue('burial_place', data.burial_place);
        
        // 메시지
        setFieldValue('message', data.message);
        
        // 계좌 정보
        if (data.account_info) {
            loadAccounts(data.account_info);
        }
        
        console.log('✅ 데이터 로드 완료');
    }, 1000);
}

// 필드 값 설정
function setFieldValue(name, value) {
    if (!value) return;
    
    const field = document.querySelector(`[name="${name}"]`);
    if (field) {
        field.value = value;
    }
}

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 상주 정보 로드
function loadMourners(familyList) {
    if (!familyList) return;
    
    const lines = familyList.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
        // "관계 이름 (연락처)" 형식 파싱
        const match = line.match(/(.+?)\s+(.+?)\s+\((.+?)\)/);
        if (match) {
            const [, relationship, name, contact] = match;
            
            if (index === 0) {
                // 첫 번째 상주
                setFieldValue('mourners[0][relationship]', relationship.trim());
                setFieldValue('mourners[0][name]', name.trim());
                setFieldValue('mourners[0][contact]', contact.trim());
            } else {
                // 추가 상주
                addMourner();
                setTimeout(() => {
                    setFieldValue(`mourners[${index}][relationship]`, relationship.trim());
                    setFieldValue(`mourners[${index}][name]`, name.trim());
                    setFieldValue(`mourners[${index}][contact]`, contact.trim());
                }, 100 * index);
            }
        }
    });
}

// 계좌 정보 로드
function loadAccounts(accountInfo) {
    if (!accountInfo) return;
    
    // "은행 계좌번호 (예금주)" 형식 파싱
    const match = accountInfo.match(/(.+?)\s+(.+?)\s+\((.+?)\)/);
    if (match) {
        const [, bank, number, holder] = match;
        
        // 계좌 정보 토글 켜기
        const accountToggle = document.getElementById('accountToggle');
        if (accountToggle && !accountToggle.checked) {
            accountToggle.checked = true;
            toggleAccountInfo();
        }
        
        setTimeout(() => {
            setFieldValue('accounts[0][bank]', bank.trim());
            setFieldValue('accounts[0][number]', number.trim());
            setFieldValue('accounts[0][holder]', holder.trim());
        }, 300);
    }
}

// ========================================
// 영정 사진 업로드 기능
// ========================================

// 영정 사진 업로드 토글
function togglePhotoUpload() {
    const toggle = document.getElementById('photoToggle');
    const section = document.getElementById('photoUploadSection');
    
    if (toggle && section) {
        if (toggle.checked) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
            // 토글 끄면 사진도 제거
            removePhotoSilent();
        }
    }
}

// 사진 제거 (알림 없이)
function removePhotoSilent() {
    document.getElementById('photoInput').value = '';
    document.getElementById('photoUrl').value = '';
    document.getElementById('photoPlaceholder').style.display = 'flex';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPreviewImg').src = '';
}

// 사진 업로드 처리
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
        showNotification('이미지 파일만 업로드 가능합니다.', 'error');
        return;
    }
    
    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('파일 크기는 10MB 이하여야 합니다.', 'error');
        return;
    }
    
    try {
        // 이미지 리사이징 및 압축
        const compressedBase64 = await compressImage(file);
        
        // 미리보기 표시
        document.getElementById('photoPlaceholder').style.display = 'none';
        document.getElementById('photoPreview').style.display = 'block';
        document.getElementById('photoPreviewImg').src = compressedBase64;
        document.getElementById('photoUrl').value = compressedBase64;
        
        showNotification('사진이 업로드되었습니다.', 'success');
    } catch (error) {
        console.error('사진 업로드 오류:', error);
        showNotification('사진 업로드에 실패했습니다.', 'error');
    }
}

// 이미지 압축 및 리사이징
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                // Canvas 생성
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 최대 크기 설정 (가로 800px)
                let width = img.width;
                let height = img.height;
                const maxWidth = 800;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 이미지 그리기
                ctx.drawImage(img, 0, 0, width, height);
                
                // JPEG로 변환 (품질 80%)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                // 크기 확인 (2MB 초과 시 품질 낮춤)
                let quality = 0.8;
                let result = compressedDataUrl;
                
                while (result.length > 2 * 1024 * 1024 && quality > 0.3) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }
                
                if (result.length > 2 * 1024 * 1024) {
                    reject(new Error('이미지 크기가 너무 큽니다. 더 작은 이미지를 선택해주세요.'));
                } else {
                    resolve(result);
                }
            };
            
            img.onerror = function() {
                reject(new Error('이미지를 불러올 수 없습니다.'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            reject(new Error('파일을 읽을 수 없습니다.'));
        };
        
        reader.readAsDataURL(file);
    });
}

// 사진 제거
function removePhoto(event) {
    event.stopPropagation();
    
    if (confirm('업로드한 사진을 삭제하시겠습니까?')) {
        document.getElementById('photoInput').value = '';
        document.getElementById('photoUrl').value = '';
        document.getElementById('photoPlaceholder').style.display = 'flex';
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('photoPreviewImg').src = '';
        
        showNotification('사진이 삭제되었습니다.', 'info');
    }
}

console.log('✅ 부고장 상세 작성 JavaScript 로드 완료');
console.log('전역 함수 확인:', {
    selectTemplate: typeof window.selectTemplate,
    goToStep: typeof window.goToStep
});
