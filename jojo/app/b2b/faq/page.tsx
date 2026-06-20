'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './faq.module.css';
import { B2BIcon } from '@/components/b2b/B2BIcon';

interface FAQItem {
  question: string;
  answer: string;
}

const b2bFaqData: FAQItem[] = [
  {
    question: '부고장 내에 화환보내기 버튼이 보이지 않습니다.',
    answer: '부고장 내 하단의 근조화환 보내기 버튼은 발인 진행이 되지 않은 부고에서만 구매가 가능합니다.\n또한 부고장 생성 시, \'근조화환 받지 않기\'를 설정하였는지 확인해주세요.',
  },
  {
    question: '부고장 내에 부의금 보내기에 카드결제를 안보이게 할 수 있나요?',
    answer: '현재 카드 결제 기능만 별도로 숨기는 기능은 제공되지 않습니다.\n부고장 생성 시, 상주님의 계좌번호를 입력하지 않으면 카드 결제 또한 노출되지 않으니, 이 점 참고하여 이용해 주세요.',
  },
  {
    question: '부고장 내에 상주 자리 앞부분을 공란으로 맞추려면 어떻게 해야하나요?',
    answer: 'ㅁ 을 입력해주시면 공란으로 변경되어 노출됩니다.',
  },
  {
    question: '계좌번호 입력을 했는데 부고장(부의금보내기)에 안보여요',
    answer: '계좌번호 정보는 부고장 생성 단계에서 노출 여부를 선택하거나, 상주별 발송 설정 화면(/b2b/create/complete/[bugoNumber])에서 계좌 노출 규칙(내 계좌만 노출, 모든 계좌 노출 등)을 개별 지정하여 표시되도록 설정해야 합니다.',
  },
  {
    question: '부고온 고객센터가 어떻게 되나요?',
    answer: '현재 고객센터는 유선 상담을 운영하고 있지 않으며, 1:1문의만 지원하고 있습니다.',
  },
  {
    question: '내 정보에 고유번호는 무엇인가요?',
    answer: '고유번호는 고객님의 추천코드로 부고온에서 랜덤으로 부여하고 있습니다.\n가입자가 추천인 입력시 회원님의 고유번호 입력 하시면 됩니다.',
  },
  {
    question: '적립금은 언제 지급되나요?',
    answer: '적립금은 상품 결제 기준 24시간 후에 적립됩니다.',
  },
  {
    question: '환급신청을 했는데 언제 지급되나요?',
    answer: '적립금(포인트) 환급은 당일 지급을 원칙으로 하고 있습니다.\n자세한 내용은 부고온 공지사항을 참조하시길 바랍니다.',
  },
  {
    question: '환급신청 시 인증 과정에서 오류가 나요',
    answer: '신청자와 입력하신 예금주 정보가 동일한지 먼저 확인 부탁드립니다.\n또한, 발급일자는 가장 최근에 발급 받으신 주민등록증 하단의 날짜를 입력해 주세요.\n이는 원활한 소득공제 처리를 위한 절차이오니, 번거로우시더라도 양해 부탁드립니다.',
  },
  {
    question: '장례식장 별로 다른 화환이 나와요. 화환 상품 추가 가능한가요?',
    answer: '지역 또는 장례식장 별 반입 가능한 화환이 달라 내부적으로 노출 가능한 화환을 제한하고 있습니다.',
  },
];

export default function B2BFAQPage() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveIdx(prev => (prev === index ? null : index));
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <B2BIcon name="chevron-left" size={24} />
        </button>
        <span className={styles.headerTitle}>자주묻는질문</span>
        <button className={styles.menuBtn} onClick={() => alert('메뉴 기능이 준비 중입니다.')}>
          <B2BIcon name="menu" size={24} />
        </button>
      </header>

      <div className={styles.container}>
        {/* FAQ 아코디언 리스트 */}
        <div className={styles.faqList}>
          {b2bFaqData.map((item, index) => {
            const isActive = activeIdx === index;
            return (
              <div
                key={index}
                className={`${styles.faqItem} ${isActive ? styles.faqItemActive : ''}`}
              >
                <div className={styles.faqQuestion} onClick={() => toggleFaq(index)}>
                  <div className={styles.questionMain}>
                    <span className={styles.qPrefix}>Q</span>
                    <span className={styles.questionText}>{item.question}</span>
                  </div>
                  <span className={styles.faqIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
                <div className={styles.faqAnswer}>
                  <div className={styles.answerContent}>
                    <div className={styles.aBadge}>A</div>
                    <p className={styles.answerText}>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
