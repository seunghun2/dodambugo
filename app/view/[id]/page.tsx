'use client';

import { useEffect, useState } from 'react';
import {
    Container,
    Title,
    Text,
    Stack,
    Card,
    Group,
    Box,
    Divider,
    Button,
    Paper,
    Badge,
    Anchor,
    Skeleton,
    Alert,
    rem,
} from '@mantine/core';
import {
    IconPhone,
    IconMapPin,
    IconCalendar,
    IconShare,
    IconCopy,
    IconBrandKakoTalk,
    IconMessage,
    IconHome,
    IconAlertCircle,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase, Bugo } from '@/lib/supabase';
import { notifications } from '@mantine/notifications';
import classes from './page.module.css';

export default function ViewPage() {
    const params = useParams();
    const [bugo, setBugo] = useState<Bugo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const { data, error } = await supabase
                    .from('bugo')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (error) throw error;
                setBugo(data);
            } catch (err: any) {
                setError('부고장을 찾을 수 없습니다.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchBugo();
        }
    }, [params.id]);

    const copyShareUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        notifications.show({
            title: '복사 완료',
            message: '링크가 클립보드에 복사되었습니다.',
            color: 'green',
        });
    };

    if (loading) {
        return (
            <Box className={classes.wrapper}>
                <Container size="sm" py={100}>
                    <Stack gap="md">
                        <Skeleton height={200} radius="md" />
                        <Skeleton height={150} radius="md" />
                        <Skeleton height={150} radius="md" />
                    </Stack>
                </Container>
            </Box>
        );
    }

    if (error || !bugo) {
        return (
            <Box className={classes.wrapper}>
                <Container size="sm" py={100}>
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="부고장을 찾을 수 없습니다"
                        color="red"
                    >
                        요청하신 부고장이 존재하지 않거나 삭제되었습니다.
                    </Alert>
                    <Button component={Link} href="/" mt="xl" leftSection={<IconHome size={16} />}>
                        홈으로 돌아가기
                    </Button>
                </Container>
            </Box>
        );
    }

    return (
        <Box className={classes.wrapper}>
            {/* 템플릿 헤더 */}
            <Box className={classes.templateHeader}>
                <Container size="sm">
                    <Stack align="center" py={60} gap="md">
                        <Text size="sm" c="dimmed">삼가 고인의 명복을 빕니다</Text>
                        <Title order={1} className={classes.deceasedName}>
                            故 {bugo.deceased_name}
                        </Title>
                        {bugo.age && (
                            <Badge variant="light" size="lg">향년 {bugo.age}세</Badge>
                        )}
                    </Stack>
                </Container>
            </Box>

            <Container size="sm" py="xl">
                <Stack gap="lg">
                    {/* 고인 정보 */}
                    <Paper p="lg" radius="md" withBorder>
                        <Title order={4} mb="md" className={classes.sectionTitle}>
                            고인 정보
                        </Title>
                        <Stack gap="sm">
                            <InfoRow label="고인" value={`故 ${bugo.deceased_name}`} />
                            {bugo.gender && <InfoRow label="성별" value={bugo.gender} />}
                            {bugo.age && <InfoRow label="향년" value={`${bugo.age}세`} />}
                            {bugo.religion && <InfoRow label="종교" value={bugo.religion} />}
                            {bugo.death_date && <InfoRow label="별세일" value={bugo.death_date} />}
                        </Stack>
                    </Paper>

                    {/* 상주 정보 */}
                    <Paper p="lg" radius="md" withBorder>
                        <Title order={4} mb="md" className={classes.sectionTitle}>
                            상주
                        </Title>
                        <Stack gap="sm">
                            {bugo.family_list ? (
                                bugo.family_list.split('\n').map((line, index) => (
                                    <Text key={index}>{line}</Text>
                                ))
                            ) : (
                                <>
                                    {bugo.mourner_name && <Text>{bugo.mourner_name}</Text>}
                                    {bugo.contact && (
                                        <Group gap="xs">
                                            <IconPhone size={16} />
                                            <Anchor href={`tel:${bugo.contact}`}>{bugo.contact}</Anchor>
                                        </Group>
                                    )}
                                </>
                            )}
                        </Stack>
                    </Paper>

                    {/* 장례식장 정보 */}
                    <Paper p="lg" radius="md" withBorder>
                        <Title order={4} mb="md" className={classes.sectionTitle}>
                            빈소
                        </Title>
                        <Stack gap="sm">
                            <InfoRow label="장례식장" value={bugo.funeral_home} />
                            {bugo.room_number && <InfoRow label="호실" value={bugo.room_number} />}
                            {bugo.funeral_home_tel && (
                                <Group gap="xs">
                                    <Text size="sm" c="dimmed" w={80}>연락처</Text>
                                    <Group gap="xs">
                                        <IconPhone size={16} />
                                        <Anchor href={`tel:${bugo.funeral_home_tel}`}>{bugo.funeral_home_tel}</Anchor>
                                    </Group>
                                </Group>
                            )}
                            {bugo.address && (
                                <Group gap="xs" align="flex-start">
                                    <Text size="sm" c="dimmed" w={80}>주소</Text>
                                    <Group gap="xs">
                                        <IconMapPin size={16} />
                                        <Text>{bugo.address}</Text>
                                    </Group>
                                </Group>
                            )}
                        </Stack>
                    </Paper>

                    {/* 일정 정보 */}
                    <Paper p="lg" radius="md" withBorder>
                        <Title order={4} mb="md" className={classes.sectionTitle}>
                            일정
                        </Title>
                        <Stack gap="sm">
                            {bugo.funeral_date && (
                                <Group gap="xs">
                                    <IconCalendar size={16} />
                                    <Text>발인: {bugo.funeral_date} {bugo.funeral_time || ''}</Text>
                                </Group>
                            )}
                            {bugo.burial_place && <InfoRow label="장지" value={bugo.burial_place} />}
                        </Stack>
                    </Paper>

                    {/* 인사말 */}
                    {bugo.message && (
                        <Paper p="lg" radius="md" withBorder bg="gray.0">
                            <Text ta="center" className={classes.message}>
                                {bugo.message}
                            </Text>
                        </Paper>
                    )}

                    {/* 공유 버튼 */}
                    <Divider my="md" />
                    <Stack gap="sm">
                        <Button
                            size="lg"
                            fullWidth
                            leftSection={<IconCopy size={18} />}
                            onClick={copyShareUrl}
                        >
                            링크 복사하기
                        </Button>
                        <Button
                            size="lg"
                            fullWidth
                            variant="light"
                            color="yellow"
                            leftSection={<IconBrandKakoTalk size={18} />}
                        >
                            카카오톡 공유
                        </Button>
                        <Button
                            size="lg"
                            fullWidth
                            variant="light"
                            leftSection={<IconMessage size={18} />}
                        >
                            문자로 공유
                        </Button>
                    </Stack>

                    {/* 푸터 */}
                    <Divider my="md" />
                    <Group justify="center">
                        <Anchor component={Link} href="/" size="sm" c="dimmed">
                            도담부고 홈
                        </Anchor>
                    </Group>
                </Stack>
            </Container>
        </Box>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Group gap="xs">
            <Text size="sm" c="dimmed" w={80}>{label}</Text>
            <Text fw={500}>{value}</Text>
        </Group>
    );
}
