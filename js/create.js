// ========================================
// 부고장 작성 페이지 JavaScript
// ========================================

// 전역 상태 관리
const state = {
    currentStep: 1,
    selectedTemplate: null,
    formData: {}
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initTemplateSelection();
    initFormValidation();
    console.log('✅ 부고장 작성 페이지 초기화 완료');
});

// 템플릿 선택
function initTemplateSelection() {
    const templateOptions = document.querySelectorAll('.template-option');
    
    templateOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 모든 템플릿에서 선택 해제
            templateOptions.forEach(opt => opt.classList.remove('selected'));
            
            // 클릭한 템플릿 선택
            this.classList.add('selected');
            state.selectedTemplate = this.dataset.template;
            
            // 선택 애니메이션
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'pulse 0.5s ease-out';
            }, 10);
        });
    });
}

// 폼 유효성 검사
function initFormValidation() {
    const form = document.getElementById('bugoForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    
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

function validateField(field) {
    const value = field.value.trim();
    const formGroup = field.closest('.form-group');
    
    // 기존 에러 메시지 제거
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    field.classList.remove('error');
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        showFieldError(formGroup, '필수 입력 항목입니다.');
        return false;
    }
    
    // 전화번호 형식 검증
    if (field.name === 'contact' && value) {
        const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phoneRegex.test(value.replace(/\-/g, ''))) {
            field.classList.add('error');
            showFieldError(formGroup, '올바른 전화번호 형식이 아닙니다.');
            return false;
        }
    }
    
    return true;
}

function showFieldError(formGroup, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: var(--error);
        font-size: 13px;
        margin-top: 6px;
        animation: fadeInUp 0.3s ease-out;
    `;
    formGroup.appendChild(errorDiv);
}

// 다음 단계로 이동
function nextStep() {
    if (state.currentStep === 1) {
        if (!state.selectedTemplate) {
            showNotification('템플릿을 선택해주세요.', 'warning');
            return;
        }
        showNotification('템플릿이 선택되었습니다!', 'success');
    }
    
    if (state.currentStep < 3) {
        state.currentStep++;
        updateStepDisplay();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 이전 단계로 이동
function prevStep() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateStepDisplay();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 단계 화면 업데이트
function updateStepDisplay() {
    // 모든 섹션 숨기기
    document.querySelectorAll('.create-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 현재 단계 표시
    const currentSection = document.getElementById(`step${state.currentStep}`);
    currentSection.classList.add('active');
    
    // 프로그레스 인디케이터 업데이트
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= state.currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// 미리보기 생성
async function previewBugo() {
    const form = document.getElementById('bugoForm');
    const formData = new FormData(form);
    
    // 필수 항목 검증
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('필수 항목을 모두 입력해주세요.', 'error');
        return;
    }
    
    // 폼 데이터 저장
    state.formData = {};
    for (let [key, value] of formData.entries()) {
        state.formData[key] = value;
    }
    
    // 데이터베이스에 저장
    try {
        showNotification('부고장을 생성하고 있습니다...', 'info');
        
        const bugoData = {
            template: state.selectedTemplate,
            deceased_name: state.formData.deceased_name,
            relationship: state.formData.relationship,
            age: state.formData.age ? parseInt(state.formData.age) : null,
            death_date: state.formData.death_date || null,
            mourner_name: state.formData.mourner_name,
            contact: state.formData.contact,
            funeral_home: state.formData.funeral_home,
            room_number: state.formData.room_number || null,
            funeral_datetime: state.formData.funeral_datetime || null,
            burial_place: state.formData.burial_place || null,
            address: state.formData.address || null,
            message: state.formData.message || null
        };
        
        const response = await fetch('tables/bugo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bugoData)
        });
        
        if (!response.ok) {
            throw new Error('부고장 저장에 실패했습니다.');
        }
        
        const savedData = await response.json();
        state.bugoId = savedData.id;
        
        // 부고장 링크 업데이트
        const bugoUrl = `${window.location.origin}/view.html?id=${savedData.id}`;
        document.getElementById('bugoLink').textContent = bugoUrl;
        
        // 미리보기 생성
        generatePreview();
        
        // 다음 단계로
        nextStep();
        
        showNotification('부고장이 생성되었습니다!', 'success');
        
    } catch (error) {
        console.error('부고장 저장 오류:', error);
        showNotification('부고장 생성 중 오류가 발생했습니다.', 'error');
    }
}

// 미리보기 HTML 생성
function generatePreview() {
    const data = state.formData;
    const previewCard = document.getElementById('previewCard');
    
    // 날짜 포맷팅
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };
    
    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '';
        const date = new Date(dateTimeStr);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시 ${date.getMinutes().toString().padStart(2, '0')}분`;
    };
    
    let html = `
        <div class="preview-header">
            <h2 class="preview-name">${data.deceased_name || '고인 성함'}</h2>
            <p class="preview-relation">${data.relationship || '관계'} 상(喪)</p>
        </div>
        <div class="preview-info">
    `;
    
    if (data.age) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">향년</span>
                <span class="preview-info-value">${data.age}세</span>
            </div>
        `;
    }
    
    if (data.death_date) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">별세일</span>
                <span class="preview-info-value">${formatDate(data.death_date)}</span>
            </div>
        `;
    }
    
    if (data.funeral_home) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">빈소</span>
                <span class="preview-info-value">${data.funeral_home}${data.room_number ? ' ' + data.room_number : ''}</span>
            </div>
        `;
    }
    
    if (data.funeral_datetime) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">발인일시</span>
                <span class="preview-info-value">${formatDateTime(data.funeral_datetime)}</span>
            </div>
        `;
    }
    
    if (data.burial_place) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">장지</span>
                <span class="preview-info-value">${data.burial_place}</span>
            </div>
        `;
    }
    
    if (data.mourner_name) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">상주</span>
                <span class="preview-info-value">${data.mourner_name}</span>
            </div>
        `;
    }
    
    if (data.contact) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">연락처</span>
                <span class="preview-info-value">${data.contact}</span>
            </div>
        `;
    }
    
    if (data.address) {
        html += `
            <div class="preview-info-item">
                <span class="preview-info-label">주소</span>
                <span class="preview-info-value">${data.address}</span>
            </div>
        `;
    }
    
    html += `</div>`;
    
    if (data.message) {
        html += `
            <div class="preview-message">
                ${data.message.replace(/\n/g, '<br>')}
            </div>
        `;
    }
    
    previewCard.innerHTML = html;
}

// 링크 복사
function copyLink() {
    const linkText = document.getElementById('bugoLink').textContent;
    const copyBtn = document.querySelector('.btn-copy');
    
    navigator.clipboard.writeText(linkText).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L8 13L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            복사완료!
        `;
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M13 7V5C13 3.89543 12.1046 3 11 3H5C3.89543 3 3 3.89543 3 5V11C3 12.1046 3.89543 13 5 13H7" stroke="currentColor" stroke-width="2"/>
                </svg>
                복사
            `;
        }, 2000);
        
        showNotification('링크가 복사되었습니다!', 'success');
    }).catch(() => {
        showNotification('복사에 실패했습니다.', 'error');
    });
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
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

// 애니메이션 스타일 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
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
    
    .form-input.error,
    .form-select.error {
        border-color: var(--error) !important;
        box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1) !important;
    }
`;
document.head.appendChild(style);

// 카카오톡 공유 (실제 구현 시 카카오 SDK 필요)
document.addEventListener('click', function(e) {
    if (e.target.closest('.share-btn.kakao')) {
        showNotification('카카오톡 공유 기능은 준비 중입니다.', 'info');
    }
    if (e.target.closest('.share-btn.sms')) {
        showNotification('문자 공유 기능은 준비 중입니다.', 'info');
    }
    if (e.target.closest('.share-btn.link')) {
        copyLink();
    }
});

console.log('✅ 부고장 작성 JavaScript 로드 완료');
