'use client';

import { useEffect, useRef, useState } from 'react';

interface NaverMapProps {
    address: string;
    placeName?: string;
    width?: string;
    height?: string;
}

declare global {
    interface Window {
        naver: any;
    }
}

export default function NaverMap({ address, placeName, width = '100%', height = '200px' }: NaverMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!address) {
            setError('주소 정보가 없습니다.');
            return;
        }

        const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

        if (!clientId) {
            setError('지도 API 키가 설정되지 않았습니다.');
            return;
        }

        const initMap = () => {
            if (!mapRef.current || !window.naver?.maps) return;

            const { naver } = window;

            // 기본 좌표 (서울)
            const defaultLat = 37.5665;
            const defaultLng = 126.978;

            const mapOptions = {
                center: new naver.maps.LatLng(defaultLat, defaultLng),
                zoom: 16,
                zoomControl: false,
                mapDataControl: false,
                scaleControl: false,
            };

            const map = new naver.maps.Map(mapRef.current, mapOptions);
            mapInstance.current = map;

            // Geocoding - Service 모듈 사용 가능한지 확인
            if (naver.maps.Service) {
                naver.maps.Service.geocode(
                    { query: address },
                    (status: any, response: any) => {
                        if (status === naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                            const result = response.v2.addresses[0];
                            const lat = parseFloat(result.y);
                            const lng = parseFloat(result.x);

                            map.setCenter(new naver.maps.LatLng(lat, lng));

                            new naver.maps.Marker({
                                position: new naver.maps.LatLng(lat, lng),
                                map: map,
                            });
                        } else {
                            // geocode 실패 시 기본 마커
                            new naver.maps.Marker({
                                position: new naver.maps.LatLng(defaultLat, defaultLng),
                                map: map,
                            });
                        }
                    }
                );
            } else {
                // Service 모듈 없으면 기본 마커만
                new naver.maps.Marker({
                    position: new naver.maps.LatLng(defaultLat, defaultLng),
                    map: map,
                });
            }
        };

        // 스크립트 이미 로드됐는지 확인
        if (window.naver?.maps) {
            initMap();
            return;
        }

        // 네이버 지도 스크립트 로드
        const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
        if (existingScript) {
            existingScript.addEventListener('load', initMap);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
        script.async = true;
        script.onload = () => {
            // geocoder 서브모듈 로드 대기
            setTimeout(initMap, 100);
        };
        script.onerror = () => {
            setError('지도를 불러오는데 실패했습니다.');
        };
        document.head.appendChild(script);

    }, [address, placeName]);

    if (error) {
        return (
            <div style={{
                width,
                height,
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '14px'
            }}>
                {error}
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            style={{
                width,
                height,
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#f8fafc'
            }}
        />
    );
}
