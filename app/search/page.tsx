'use client';

import { useState } from 'react';
import {
    Container,
    Title,
    Text,
    TextInput,
    Button,
    Stack,
    Card,
    Group,
    Box,
    Paper,
    Anchor,
    Alert,
    Loader,
    Center,
} from '@mantine/core';
import {
    IconSearch,
    IconAlertCircle,
    IconChevronRight,
    IconHome,
} from '@tabler/icons-react';
import Link from 'next/link';
import { supabase, Bugo } from '@/lib/supabase';
import classes from './page.module.css';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Bugo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            // 부고번호 또는 고인 성함으로 검색
            const { data, error } = await supabase
                .from('bugo')
                .select('*')
                .or(`bugo_number.eq.${query},deceased_name.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error('검색 오류:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <Box className={classes.wrapper}>
            {/* Header */}
            <Box component="header" className={classes.header}>
                <Container size="lg">
                    <Group justify="space-between" h={60}>
                        <Anchor component={Link} href="/" c="inherit">
                            <Text fw={700} size="lg" className={classes.logo}>
                                도담부고
                            </Text>
                        </Anchor>
                    </Group>
                </Container>
            </Box>

            <Container size="sm" py={100}>
                <Stack gap="xl">
                    {/* 검색 헤더 */}
                    <Stack align="center" gap="md">
                        <Title order={1} ta="center">
                            부고 검색
                        </Title>
                        <Text c="dimmed" ta="center">
                            고인 성함 또는 부고번호로 검색하세요
                        </Text>
                    </Stack>

                    {/* 검색 입력 */}
                    <Paper p="lg" radius="md" withBorder>
                        <Stack gap="md">
                            <TextInput
                                size="lg"
                                placeholder="고인 성함 또는 부고번호 (4자리)"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                rightSection={
                                    loading ? <Loader size="sm" /> : null
                                }
                            />
                            <Button
                                size="lg"
                                fullWidth
                                onClick={handleSearch}
                                loading={loading}
                                leftSection={<IconSearch size={18} />}
                            >
                                검색하기
                            </Button>
                        </Stack>
                    </Paper>

                    {/* 검색 결과 */}
                    {searched && (
                        <>
                            {results.length > 0 ? (
                                <Stack gap="md">
                                    <Text size="sm" c="dimmed">
                                        {results.length}개의 부고장을 찾았습니다
                                    </Text>
                                    {results.map((bugo) => (
                                        <Card
                                            key={bugo.id}
                                            component={Link}
                                            href={`/view/${bugo.id}`}
                                            shadow="sm"
                                            padding="lg"
                                            radius="md"
                                            withBorder
                                            className={classes.resultCard}
                                        >
                                            <Group justify="space-between">
                                                <Stack gap="xs">
                                                    <Text fw={600} size="lg">
                                                        故 {bugo.deceased_name}
                                                    </Text>
                                                    <Group gap="md">
                                                        <Text size="sm" c="dimmed">
                                                            부고번호: {bugo.bugo_number}
                                                        </Text>
                                                        <Text size="sm" c="dimmed">
                                                            {bugo.funeral_home}
                                                        </Text>
                                                    </Group>
                                                </Stack>
                                                <IconChevronRight size={20} color="gray" />
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : (
                                <Alert
                                    icon={<IconAlertCircle size={16} />}
                                    title="검색 결과가 없습니다"
                                    color="gray"
                                >
                                    입력하신 정보와 일치하는 부고장을 찾을 수 없습니다.
                                    다른 검색어로 다시 시도해 주세요.
                                </Alert>
                            )}
                        </>
                    )}

                    {/* 홈으로 */}
                    <Center>
                        <Button
                            component={Link}
                            href="/"
                            variant="subtle"
                            leftSection={<IconHome size={16} />}
                        >
                            홈으로 돌아가기
                        </Button>
                    </Center>
                </Stack>
            </Container>
        </Box>
    );
}
