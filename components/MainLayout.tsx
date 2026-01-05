'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    AppShell,
    Burger,
    Group,
    NavLink,
    Text,
    Button,
    Drawer,
    Stack,
    Divider,
    rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconHome,
    IconPencil,
    IconSearch,
    IconPhone,
    IconFileText,
    IconShield,
} from '@tabler/icons-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { label: '부고검색', href: '/search', icon: IconSearch },
    { label: '자주묻는 질문', href: '/faq', icon: IconFileText },
    { label: '부고장 만들기', href: '/create', icon: IconPencil },
];

const footerLinks = [
    { label: '이용약관', href: '/terms' },
    { label: '개인정보처리방침', href: '/privacy' },
];

export default function MainLayout({ children }: MainLayoutProps) {
    const [opened, { toggle, close }] = useDisclosure(false);
    const pathname = usePathname();

    // 뷰 페이지나 특정 페이지에서는 헤더 숨김
    const hideHeader = pathname.startsWith('/view/') || pathname.startsWith('/create/complete/');

    if (hideHeader) {
        return <>{children}</>;
    }

    return (
        <AppShell
            header={{ height: 60 }}
            padding={0}
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <Text
                            size="xl"
                            fw={700}
                            c="blue.6"
                            style={{ letterSpacing: '-0.5px' }}
                        >
                            마음부고
                        </Text>
                    </Link>

                    {/* 데스크톱 네비게이션 */}
                    <Group gap="xs" visibleFrom="sm">
                        {navItems.map((item) => (
                            <Button
                                key={item.href}
                                component={Link}
                                href={item.href}
                                variant={pathname === item.href ? 'light' : 'subtle'}
                                size="sm"
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Group>

                    {/* 모바일 햄버거 */}
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    />
                </Group>
            </AppShell.Header>

            {/* 모바일 드로어 */}
            <Drawer
                opened={opened}
                onClose={close}
                size="280px"
                padding="md"
                title={
                    <Text fw={700} size="lg" c="blue.6">
                        마음부고
                    </Text>
                }
                hiddenFrom="sm"
                zIndex={1000}
            >
                <Stack gap="xs">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            component={Link}
                            href={item.href}
                            label={item.label}
                            leftSection={<item.icon size={20} />}
                            active={pathname === item.href}
                            onClick={close}
                            style={{ borderRadius: rem(8) }}
                        />
                    ))}
                    <Divider my="sm" />
                    {footerLinks.map((item) => (
                        <NavLink
                            key={item.href}
                            component={Link}
                            href={item.href}
                            label={item.label}
                            onClick={close}
                            c="dimmed"
                            style={{ borderRadius: rem(8) }}
                        />
                    ))}
                </Stack>
            </Drawer>

            <AppShell.Main>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
