'use client';

import React, { useState } from 'react';
import styles from '@/components/b2b-landing/landing.module.css';
import LandingHeader from '@/components/b2b-landing/LandingHeader';
import LandingHero from '@/components/b2b-landing/LandingHero';
import ProfitCalculator from '@/components/b2b-landing/ProfitCalculator';
import DualAudienceSection from '@/components/b2b-landing/DualAudienceSection';
import ComparisonTable from '@/components/b2b-landing/ComparisonTable';
import FeatureGrid from '@/components/b2b-landing/FeatureGrid';
import PartnerTestimonials from '@/components/b2b-landing/PartnerTestimonials';
import CorporateInquiryModal from '@/components/b2b-landing/CorporateInquiryModal';
import StickyBottomCTA from '@/components/b2b-landing/StickyBottomCTA';
import LandingFooter from '@/components/b2b-landing/LandingFooter';

export default function BugoonPlusIntroPage() {
    const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

    return (
        <div className={styles.landingWrapper}>
            {/* 상단 헤더 */}
            <LandingHeader onOpenInquiry={() => setInquiryModalOpen(true)} />

            {/* 메인 히어로 섹션 (수당 직격 + 3D 목업) */}
            <LandingHero />

            {/* 실시간 슬라이더 카운트업 수익 계산기 */}
            <ProfitCalculator />

            {/* 지도사용 vs 상조사용 듀얼 혜택 탭 */}
            <DualAudienceSection onOpenInquiry={() => setInquiryModalOpen(true)} />

            {/* 타사 대비 팩트 비교표 */}
            <ComparisonTable />

            {/* 4대 핵심 기능 그리드 */}
            <FeatureGrid />

            {/* 실제 지도사 후기 & 제휴사 로고 */}
            <PartnerTestimonials />

            {/* 푸터 */}
            <LandingFooter />

            {/* 모바일 화면 하단 고정 끈적바 */}
            <StickyBottomCTA />

            {/* 기업 제휴 문의 모달 */}
            <CorporateInquiryModal 
                isOpen={inquiryModalOpen} 
                onClose={() => setInquiryModalOpen(false)} 
            />
        </div>
    );
}
