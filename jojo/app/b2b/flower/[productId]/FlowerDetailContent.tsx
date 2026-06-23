'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import styles from './detail.module.css';

interface FlowerProduct {
  id: string;
  sort_order: number;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  images: string[];
}

interface FlowerDetailContentProps {
  product: FlowerProduct;
}

export default function FlowerDetailContent({ product }: FlowerDetailContentProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);

  // 상품 상세 정보
  const origin = '• 국산: 장미, 국화, 카네이션, 백합, 튤립, 글라디올러스 등\n• 수입산: 중국, 대만, 베트남, 일본, 콜롬비아, 네덜란드 등\n• 리본 및 부자재: 국산';
  const usage = '장례식장, 영결식, 추모식 등 고인의 명복을 기원하는 자리에 보내드리는 조화입니다.';
  const features = product.description || '정성을 담아 제작되는 화환입니다.';

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/b2b/flower')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.headerTitle}>상세보기</span>
        <div className={styles.headerRightPlaceholder} />
      </header>

      {/* 상품명 섹션 */}
      <div className={styles.productTitleSection}>
        <h2 className={styles.productName}>{product.name}</h2>
        <p className={styles.productSubtitle}>{product.description}</p>
      </div>

      {/* 이미지 - Swiper 캐러셀 */}
      <div className={styles.imageSection}>
        <div className={styles.swiperContainer}>
          <Swiper
            onSwiper={setSwiperRef}
            onSlideChange={(swiper) => setSelectedImage(swiper.realIndex)}
            loop={true}
            grabCursor={true}
            slidesPerView={1}
            className={styles.mainSwiper}
          >
            {product.images?.map((img, idx) => (
              <SwiperSlide key={idx}>
                <div className={styles.swiperImageWrapper}>
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* 하단 오버레이 */}
          {product.images && product.images.length > 1 && (
            <div className={styles.imageOverlay}>
              {/* 왼쪽: 썸네일 슬라이드 */}
              <div className={styles.thumbnailStrip}>
                {[-1, 0, 1].map((offset) => {
                  const idx = (selectedImage + offset + product.images.length) % product.images.length;
                  return (
                    <button
                      key={offset}
                      className={`${styles.stripThumb} ${offset === 0 ? styles.active : ''}`}
                      onClick={() => {
                        if (offset === 1 && swiperRef) swiperRef.slideNext();
                        if (offset === -1 && swiperRef) swiperRef.slidePrev();
                      }}
                    >
                      <img src={product.images[idx]} alt={`${product.name} 상세 이미지 ${idx + 1}`} />
                    </button>
                  );
                })}
              </div>

              {/* 오른쪽: 페이지 인디케이터 */}
              <div className={styles.pageIndicator}>
                <span>{selectedImage + 1}</span>
                <span className={styles.divider}>/</span>
                <span>{product.images.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 상품설명 */}
      <div className={styles.productInfoSection}>
        <h3 className={styles.sectionTitle}>상품설명</h3>

        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>[ 원산지 ]</span>
          <p className={styles.infoContent}>{origin}</p>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>[ 상품용도 ]</span>
          <p className={styles.infoContent}>{usage}</p>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>[ 상품특징 ]</span>
          <p className={styles.infoContent}>{features}</p>
        </div>
      </div>

      {/* 배송안내 */}
      <div className={styles.deliverySection}>
        <h3 className={styles.sectionTitle}>배송안내</h3>
        <p className={styles.deliveryNotice}>* 계절, 지역 상황에 따라 배송 상품이 이미지와 다소 다를 수 있습니다.</p>

        <div className={styles.deliveryItem}>
          <span className={styles.deliveryLabel}>1) 배송비</span>
          <p>전국 무료배송</p>
          <p>(도서산간 지역은 추가 비용이 발생할 수 있습니다)</p>
        </div>

        <div className={styles.deliveryItem}>
          <span className={styles.deliveryLabel}>2) 배송 소요시간</span>
          <p>주문 후 전국 어디든 4시간 내 도착</p>
          <p>교통 및 기상 상황에 따라 다소 지연될 수 있습니다.</p>
        </div>

        <div className={styles.deliveryItem}>
          <span className={styles.deliveryLabel}>3) 당일배송 안내</span>
          <p>오전 8시 ~ 오후 6시 주문 시 당일 배송됩니다.</p>
          <p>이후 주문 건은 익일 오후 1시 전 배송됩니다.</p>
        </div>

        <div className={styles.deliveryItem}>
          <span className={styles.deliveryLabel}>4) 고객센터</span>
          <p>운영시간: 오전 8시 ~ 오후 8시</p>
          <p>온라인 주문은 24시간 가능합니다.</p>
        </div>
      </div>

      {/* 교환/환불 안내 */}
      <div className={styles.refundSection}>
        <h3 className={styles.sectionTitle}>교환/환불 안내</h3>
        <p className={styles.refundNotice}>* 온라인에서는 교환/환불 접수가 불가하며, 고객센터로 문의해주세요. *</p>

        <p className={styles.refundDesc}>아래의 경우 교환 및 환불이 가능합니다.</p>

        <div className={styles.refundItem}>
          <span className={styles.refundLabel}>1) 교환 가능</span>
          <p>• 배송 중 상품이 파손 또는 훼손된 경우</p>
          <p>• 주문 내용과 다른 상품이 배송된 경우</p>
        </div>

        <div className={styles.refundItem}>
          <span className={styles.refundLabel}>2) 환불 가능</span>
          <p>• 결제 후 제작 시작 전 취소 요청 시</p>
          <p>• 품절 또는 배송 불가 지역인 경우</p>
        </div>

        <div className={styles.refundItem}>
          <span className={styles.refundLabel}>3) 교환/환불 불가</span>
          <p>• 생화는 한번 잘리면 재사용이 불가하여, 제작 완료 후 단순 변심에 의한 교환/환불이 어렵습니다.</p>
          <p>• 주문자의 배송정보 오류 또는 수취 거부로 인한 교환/환불은 불가합니다.</p>
        </div>

        <div className={styles.refundItem}>
          <span className={styles.refundLabel}>4) 이미지 관련 안내</span>
          <p>• 화분, 바구니, 포장지 등 부속품은 시즌 및 지역에 따라 이미지와 다를 수 있습니다.</p>
        </div>
      </div>

      {/* 하단 주문 버튼 */}
      <div className={styles.footer}>
        <button
          className={styles.btnOrder}
          onClick={() => router.push(`/b2b/flower/order/${product.sort_order}`)}
        >
          결제하기
        </button>
      </div>
    </div>
  );
}
