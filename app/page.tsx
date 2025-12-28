'use client';

import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Box,
  Divider,
  Accordion,
  rem,
  Anchor,
} from '@mantine/core';
import {
  IconClock,
  IconDeviceMobile,
  IconLock,
  IconShare,
  IconTemplate,
  IconCurrencyWon,
  IconChevronRight,
  IconEdit,
  IconSearch,
} from '@tabler/icons-react';
import Link from 'next/link';
import classes from './page.module.css';

// 템플릿 데이터
const templates = [
  { id: 'basic', name: '기본형', description: '단정하고 기본적인 디자인', image: '/images/template-basic.png' },
  { id: 'ribbon', name: '검은리본', description: '검은 리본 장식이 포인트', image: '/images/template-ribbon.png' },
  { id: 'border', name: '검은띠', description: '격식있는 검은 테두리', image: '/images/template-border.png' },
  { id: 'flower', name: '국화', description: '국화꽃 장식의 고급스러운 디자인', image: '/images/template-flower.png' },
];

// 주요 기능 데이터
const features = [
  {
    icon: IconClock,
    title: '3분 완성',
    description: '복잡한 절차 없이 간단한 정보 입력으로 빠르게 부고장을 만들 수 있습니다.',
  },
  {
    icon: IconCurrencyWon,
    title: '완전 무료',
    description: '작성, 수정, 공유 모든 기능이 무료입니다. 숨겨진 비용이 없습니다.',
  },
  {
    icon: IconDeviceMobile,
    title: '모바일 최적화',
    description: '스마트폰에서 가장 보기 좋게 디자인되었습니다.',
  },
  {
    icon: IconLock,
    title: '광고 없음',
    description: '고인을 위한 부고장에 광고가 나타나지 않습니다.',
  },
  {
    icon: IconTemplate,
    title: '4가지 템플릿',
    description: '상황에 맞는 다양한 디자인을 선택할 수 있습니다.',
  },
  {
    icon: IconShare,
    title: '간편한 공유',
    description: '카카오톡, 문자 등으로 쉽게 공유할 수 있습니다.',
  },
];

// FAQ 데이터
const faqData = [
  {
    question: '정말 무료인가요?',
    answer: '네, 모든 기능이 완전 무료입니다. 부고장 작성, 수정, 공유 등 어떤 기능도 비용이 들지 않습니다.',
  },
  {
    question: '작성한 부고장은 언제까지 유지되나요?',
    answer: '부고장은 기본적으로 30일간 유지됩니다. 필요시 연장도 가능합니다.',
  },
  {
    question: '수정이 가능한가요?',
    answer: '네, 작성 시 설정한 비밀번호를 통해 언제든지 수정할 수 있습니다.',
  },
  {
    question: '여러 장 만들 수 있나요?',
    answer: '네, 필요한 만큼 여러 개의 부고장을 만들 수 있습니다.',
  },
];

export default function HomePage() {
  return (
    <Box className={classes.wrapper}>
      {/* Navigation */}
      <Box component="header" className={classes.header}>
        <Container size="md">
          <Group justify="space-between" h={56}>
            <Text fw={700} size="lg" className={classes.logo}>
              도담부고
            </Text>
            <Group gap="sm">
              <Anchor component={Link} href="/search" c="dimmed" size="sm" className={classes.navLink}>
                부고 검색
              </Anchor>
              <Button
                component={Link}
                href="/create"
                size="sm"
                radius="xl"
                className={classes.headerBtn}
              >
                부고장 만들기
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className={classes.hero}>
        <Container size="md">
          <Stack align="center" gap="lg" py={60}>
            <Box className={classes.badge}>완전 무료 · 광고 없음</Box>
            <Title order={1} ta="center" className={classes.heroTitle}>
              3분 만에 만드는<br />
              <Text component="span" inherit className={classes.heroHighlight}>품격있는</Text> 모바일 부고장
            </Title>
            <Text size="md" c="dimmed" ta="center" maw={400} className={classes.heroDesc}>
              세련된 템플릿으로 고인을 정중히 알리세요.
              복잡한 절차 없이 간단하게 제작할 수 있습니다.
            </Text>
            <Group gap="sm" mt="md">
              <Button
                component={Link}
                href="/create"
                size="lg"
                radius="xl"
                className={classes.primaryBtn}
                rightSection={<IconChevronRight size={18} />}
              >
                부고장 만들기
              </Button>
              <Button
                component={Link}
                href="/search"
                size="lg"
                radius="xl"
                variant="default"
                className={classes.secondaryBtn}
                leftSection={<IconSearch size={18} />}
              >
                부고 검색
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={60} className={classes.section}>
        <Container size="md">
          <Stack align="center" gap="lg" mb={40}>
            <Title order={2} ta="center" className={classes.sectionTitle}>
              왜 도담부고인가요?
            </Title>
            <Text c="dimmed" ta="center" maw={400} size="sm">
              어려운 시간에 부담 없이 사용할 수 있도록
              모든 기능을 무료로 제공합니다.
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {features.map((feature, index) => (
              <Card key={index} padding="lg" radius="md" className={classes.featureCard}>
                <Box className={classes.featureIcon}>
                  <feature.icon size={24} stroke={1.5} />
                </Box>
                <Text fw={600} size="md" mt="sm" className={classes.featureTitle}>
                  {feature.title}
                </Text>
                <Text size="sm" c="dimmed" mt={4} lh={1.6}>
                  {feature.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Templates Section */}
      <Box py={60} className={classes.sectionAlt}>
        <Container size="md">
          <Stack align="center" gap="lg" mb={40}>
            <Title order={2} ta="center" className={classes.sectionTitle}>
              4가지 세련된 템플릿
            </Title>
            <Text c="dimmed" ta="center" maw={400} size="sm">
              상황에 맞는 디자인을 선택하세요.
              모든 템플릿은 모바일에 최적화되어 있습니다.
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            {templates.map((template) => (
              <Card
                key={template.id}
                padding="md"
                radius="md"
                className={classes.templateCard}
              >
                <Box className={classes.templateImage}>
                  <img
                    src={template.image}
                    alt={template.name}
                  />
                </Box>
                <Text fw={600} size="sm" mt="sm">{template.name}</Text>
                <Text size="xs" c="dimmed" mt={2}>{template.description}</Text>
                <Button
                  component={Link}
                  href={`/create?template=${template.id}`}
                  variant="light"
                  size="xs"
                  fullWidth
                  mt="sm"
                  radius="md"
                >
                  선택하기
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box py={60} className={classes.section}>
        <Container size="sm">
          <Stack align="center" gap="lg" mb={40}>
            <Title order={2} ta="center" className={classes.sectionTitle}>
              자주 묻는 질문
            </Title>
          </Stack>
          <Accordion variant="separated" radius="md" className={classes.accordion}>
            {faqData.map((faq, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control className={classes.accordionControl}>
                  {faq.question}
                </Accordion.Control>
                <Accordion.Panel className={classes.accordionPanel}>
                  {faq.answer}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={60} className={classes.ctaSection}>
        <Container size="sm">
          <Card padding="xl" radius="lg" className={classes.ctaCard}>
            <Stack align="center" gap="md">
              <Title order={2} c="white" ta="center" className={classes.ctaTitle}>
                지금 바로 시작하세요
              </Title>
              <Text c="white" ta="center" opacity={0.9} size="sm">
                복잡한 회원가입 없이 바로 부고장을 만들 수 있습니다.
              </Text>
              <Button
                component={Link}
                href="/create"
                size="lg"
                radius="xl"
                className={classes.ctaBtn}
                rightSection={<IconEdit size={18} />}
              >
                부고장 만들기
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" py={32} className={classes.footer}>
        <Container size="md">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Stack gap={4}>
              <Text fw={700} size="sm">도담부고</Text>
              <Text size="xs" c="dimmed">
                품격있는 무료 모바일 부고장 서비스
              </Text>
            </Stack>
            <Group gap="md">
              <Anchor href="/terms" size="xs" c="dimmed">이용약관</Anchor>
              <Anchor href="/privacy" size="xs" c="dimmed">개인정보처리방침</Anchor>
              <Anchor href="/contact" size="xs" c="dimmed">문의하기</Anchor>
            </Group>
          </Group>
          <Divider my="md" />
          <Text size="xs" c="dimmed" ta="center">
            © 2024 도담부고. All rights reserved.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
