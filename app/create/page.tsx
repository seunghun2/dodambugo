'use client';

import { useState, Suspense } from 'react';
import {
    Container,
    Stepper,
    Button,
    Group,
    TextInput,
    Select,
    Textarea,
    Card,
    Title,
    Text,
    Stack,
    SimpleGrid,
    Box,
    Divider,
    NumberInput,
    ActionIcon,
    Paper,
    Badge,
    Anchor,
    rem,
    Loader,
    Center,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
    IconPlus,
    IconTrash,
    IconChevronLeft,
    IconChevronRight,
    IconCheck,
    IconShare,
    IconBrandKakoTalk,
    IconMessage,
    IconCopy,
    IconHome,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, Bugo } from '@/lib/supabase';
import classes from './page.module.css';

// 템플릿 데이터
const templates = [
    { id: 'basic', name: '기본형', description: '단정하고 기본적인 디자인', image: '/images/template-basic.png' },
    { id: 'ribbon', name: '검은리본', description: '검은 리본 장식이 포인트', image: '/images/template-ribbon.png' },
    { id: 'border', name: '검은띠', description: '격식있는 검은 테두리', image: '/images/template-border.png' },
    { id: 'flower', name: '국화', description: '국화꽃 장식의 고급스러운 디자인', image: '/images/template-flower.png' },
];

// 관계 옵션
const relationOptions = [
    '부모님', '조부모님', '배우자', '형제자매', '자녀', '친척', '기타'
];

// 상주 관계 옵션
const mournerRelationOptions = [
    '장남', '차남', '삼남', '장녀', '차녀', '삼녀', '아들', '딸', '손자', '손녀', '배우자', '기타'
];

// 종교 옵션
const religionOptions = [
    '무교', '불교', '기독교', '천주교', '원불교', '기타'
];

interface Mourner {
    relation: string;
    name: string;
    contact: string;
}

function CreatePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [active, setActive] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState(searchParams.get('template') || '');
    const [mourners, setMourners] = useState<Mourner[]>([{ relation: '', name: '', contact: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdBugo, setCreatedBugo] = useState<Bugo | null>(null);

    const form = useForm({
        initialValues: {
            applicant_name: '',
            phone_password: '',
            deceased_name: '',
            gender: '',
            relationship: '',
            age: undefined as number | undefined,
            religion: '',
            funeral_home: '',
            room_number: '',
            funeral_home_tel: '',
            address: '',
            death_date: null as Date | null,
            funeral_date: null as Date | null,
            funeral_time: '',
            burial_place: '',
            message: '',
        },
        validate: {
            applicant_name: (value) => (value.length < 2 ? '신청자명을 입력해주세요' : null),
            phone_password: (value) => (value.length !== 4 ? '4자리 비밀번호를 입력해주세요' : null),
            deceased_name: (value) => (value.length < 2 ? '고인 성함을 입력해주세요' : null),
            gender: (value) => (!value ? '성별을 선택해주세요' : null),
            funeral_home: (value) => (value.length < 2 ? '장례식장을 입력해주세요' : null),
        },
    });

    const nextStep = () => {
        if (active === 0 && !selectedTemplate) {
            notifications.show({
                title: '템플릿 선택',
                message: '템플릿을 선택해주세요',
                color: 'red',
            });
            return;
        }

        if (active === 1) {
            const validation = form.validate();
            if (validation.hasErrors) {
                return;
            }
        }

        setActive((current) => Math.min(current + 1, 3));
    };

    const prevStep = () => setActive((current) => Math.max(current - 1, 0));

    const addMourner = () => {
        setMourners([...mourners, { relation: '', name: '', contact: '' }]);
    };

    const removeMourner = (index: number) => {
        if (mourners.length > 1) {
            setMourners(mourners.filter((_, i) => i !== index));
        }
    };

    const updateMourner = (index: number, field: keyof Mourner, value: string) => {
        const newMourners = [...mourners];
        newMourners[index][field] = value;
        setMourners(newMourners);
    };

    // 부고번호 생성
    const generateBugoNumber = async (): Promise<string> => {
        let bugoNumber: string;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 50) {
            bugoNumber = String(Math.floor(1000 + Math.random() * 9000));
            const { data } = await supabase
                .from('bugo')
                .select('id')
                .eq('bugo_number', bugoNumber!)
                .limit(1);

            if (!data || data.length === 0) {
                isUnique = true;
                return bugoNumber!;
            }
            attempts++;
        }

        return String(Date.now()).slice(-4);
    };

    // 부고장 저장
    const handleSubmit = async () => {
        if (mourners[0].name.length < 2) {
            notifications.show({
                title: '입력 확인',
                message: '상주 정보를 입력해주세요',
                color: 'red',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const bugoNumber = await generateBugoNumber();
            const values = form.values;

            const familyList = mourners
                .filter(m => m.name)
                .map(m => `${m.relation} ${m.name} (${m.contact})`)
                .join('\n');

            const bugoData = {
                bugo_number: bugoNumber,
                template: selectedTemplate,
                applicant_name: values.applicant_name,
                phone_password: values.phone_password,
                deceased_name: values.deceased_name,
                gender: values.gender,
                relationship: values.relationship,
                age: values.age,
                death_date: values.death_date?.toISOString().split('T')[0],
                religion: values.religion,
                mourner_name: mourners[0].name,
                contact: mourners[0].contact,
                funeral_home: values.funeral_home,
                room_number: values.room_number,
                funeral_home_tel: values.funeral_home_tel,
                address: values.address,
                funeral_date: values.funeral_date?.toISOString().split('T')[0],
                funeral_time: values.funeral_time,
                burial_place: values.burial_place,
                message: values.message,
                family_list: familyList,
            };

            const { data, error } = await supabase
                .from('bugo')
                .insert([bugoData])
                .select()
                .single();

            if (error) throw error;

            setCreatedBugo(data);
            setActive(3);

            notifications.show({
                title: '부고장 생성 완료',
                message: '부고장이 성공적으로 생성되었습니다.',
                color: 'green',
                icon: <IconCheck size={16} />,
            });

        } catch (error: any) {
            console.error('부고장 생성 오류:', error);
            notifications.show({
                title: '오류 발생',
                message: error.message || '부고장 생성 중 오류가 발생했습니다.',
                color: 'red',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 공유 URL 복사
    const copyShareUrl = () => {
        if (createdBugo) {
            const url = `${window.location.origin}/view/${createdBugo.id}`;
            navigator.clipboard.writeText(url);
            notifications.show({
                title: '복사 완료',
                message: '링크가 클립보드에 복사되었습니다.',
                color: 'green',
            });
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

            <Container size="md" py={100}>
                <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
                    {/* Step 1: 템플릿 선택 */}
                    <Stepper.Step label="템플릿 선택" description="디자인 선택">
                        <Stack gap="xl" mt="xl">
                            <Title order={2} ta="center">템플릿을 선택하세요</Title>
                            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                                {templates.map((template) => (
                                    <Card
                                        key={template.id}
                                        shadow={selectedTemplate === template.id ? 'lg' : 'sm'}
                                        padding="lg"
                                        radius="md"
                                        withBorder
                                        className={classes.templateCard}
                                        data-selected={selectedTemplate === template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                    >
                                        <Box
                                            h={80}
                                            mb="md"
                                            style={{
                                                borderRadius: rem(8),
                                                overflow: 'hidden',
                                                background: '#f0f0f0',
                                            }}
                                        >
                                            <img
                                                src={template.image}
                                                alt={template.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </Box>
                                        <Text fw={600} size="sm">{template.name}</Text>
                                        <Text size="xs" c="dimmed">{template.description}</Text>
                                        {selectedTemplate === template.id && (
                                            <Badge mt="sm" color="blue">선택됨</Badge>
                                        )}
                                    </Card>
                                ))}
                            </SimpleGrid>
                        </Stack>
                    </Stepper.Step>

                    {/* Step 2: 정보 입력 */}
                    <Stepper.Step label="정보 입력" description="부고 정보">
                        <Stack gap="xl" mt="xl">
                            {/* 신청자 정보 */}
                            <Paper p="lg" radius="md" withBorder>
                                <Title order={4} mb="md">신청자 정보</Title>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <TextInput
                                        label="신청자 성함"
                                        placeholder="신청자 성함"
                                        required
                                        {...form.getInputProps('applicant_name')}
                                    />
                                    <TextInput
                                        label="비밀번호 (숫자 4자리)"
                                        placeholder="수정 시 필요"
                                        maxLength={4}
                                        required
                                        {...form.getInputProps('phone_password')}
                                    />
                                </SimpleGrid>
                            </Paper>

                            {/* 고인 정보 */}
                            <Paper p="lg" radius="md" withBorder>
                                <Title order={4} mb="md">고인 정보</Title>
                                <Stack gap="md">
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                        <TextInput
                                            label="고인 성함"
                                            placeholder="고인의 성함"
                                            required
                                            {...form.getInputProps('deceased_name')}
                                        />
                                        <Select
                                            label="성별"
                                            placeholder="선택"
                                            data={['남', '여']}
                                            required
                                            {...form.getInputProps('gender')}
                                        />
                                    </SimpleGrid>
                                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                        <Select
                                            label="관계"
                                            placeholder="선택"
                                            data={relationOptions}
                                            {...form.getInputProps('relationship')}
                                        />
                                        <NumberInput
                                            label="향년"
                                            placeholder="나이"
                                            min={1}
                                            max={150}
                                            {...form.getInputProps('age')}
                                        />
                                        <Select
                                            label="종교"
                                            placeholder="선택"
                                            data={religionOptions}
                                            {...form.getInputProps('religion')}
                                        />
                                    </SimpleGrid>
                                    <DateInput
                                        label="별세일"
                                        placeholder="날짜 선택"
                                        valueFormat="YYYY년 MM월 DD일"
                                        {...form.getInputProps('death_date')}
                                    />
                                </Stack>
                            </Paper>

                            {/* 상주 정보 */}
                            <Paper p="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Title order={4}>상주 정보</Title>
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconPlus size={14} />}
                                        onClick={addMourner}
                                    >
                                        상주 추가
                                    </Button>
                                </Group>
                                <Stack gap="md">
                                    {mourners.map((mourner, index) => (
                                        <Paper key={index} p="sm" bg="gray.0" radius="md">
                                            <Group justify="space-between" mb="xs">
                                                <Text size="sm" fw={500}>상주 {index + 1}</Text>
                                                {mourners.length > 1 && (
                                                    <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        size="sm"
                                                        onClick={() => removeMourner(index)}
                                                    >
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                                                <Select
                                                    placeholder="관계"
                                                    data={mournerRelationOptions}
                                                    value={mourner.relation}
                                                    onChange={(value) => updateMourner(index, 'relation', value || '')}
                                                />
                                                <TextInput
                                                    placeholder="성함"
                                                    value={mourner.name}
                                                    onChange={(e) => updateMourner(index, 'name', e.target.value)}
                                                />
                                                <TextInput
                                                    placeholder="연락처"
                                                    value={mourner.contact}
                                                    onChange={(e) => updateMourner(index, 'contact', e.target.value)}
                                                />
                                            </SimpleGrid>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Paper>

                            {/* 장례식장 정보 */}
                            <Paper p="lg" radius="md" withBorder>
                                <Title order={4} mb="md">장례식장 정보</Title>
                                <Stack gap="md">
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                        <TextInput
                                            label="장례식장명"
                                            placeholder="장례식장 이름"
                                            required
                                            {...form.getInputProps('funeral_home')}
                                        />
                                        <TextInput
                                            label="호실"
                                            placeholder="예: 특1호실"
                                            {...form.getInputProps('room_number')}
                                        />
                                    </SimpleGrid>
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                        <TextInput
                                            label="장례식장 연락처"
                                            placeholder="02-0000-0000"
                                            {...form.getInputProps('funeral_home_tel')}
                                        />
                                        <TextInput
                                            label="주소"
                                            placeholder="장례식장 주소"
                                            {...form.getInputProps('address')}
                                        />
                                    </SimpleGrid>
                                </Stack>
                            </Paper>

                            {/* 일정 정보 */}
                            <Paper p="lg" radius="md" withBorder>
                                <Title order={4} mb="md">일정 정보</Title>
                                <Stack gap="md">
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                        <DateInput
                                            label="발인일"
                                            placeholder="날짜 선택"
                                            valueFormat="YYYY년 MM월 DD일"
                                            {...form.getInputProps('funeral_date')}
                                        />
                                        <TimeInput
                                            label="발인 시간"
                                            {...form.getInputProps('funeral_time')}
                                        />
                                    </SimpleGrid>
                                    <TextInput
                                        label="장지"
                                        placeholder="예: ○○추모공원"
                                        {...form.getInputProps('burial_place')}
                                    />
                                </Stack>
                            </Paper>

                            {/* 인사말 */}
                            <Paper p="lg" radius="md" withBorder>
                                <Title order={4} mb="md">인사말</Title>
                                <Textarea
                                    placeholder="황망한 마음에 일일이 연락드리지 못함을 너그러이 양해해 주시기 바랍니다."
                                    minRows={3}
                                    {...form.getInputProps('message')}
                                />
                            </Paper>
                        </Stack>
                    </Stepper.Step>

                    {/* Step 3: 완료 */}
                    <Stepper.Completed>
                        <Stack align="center" gap="xl" py={60}>
                            <Box ta="center">
                                <IconCheck size={60} color="var(--mantine-color-green-6)" />
                            </Box>
                            <Title order={2} ta="center">
                                부고장이 생성되었습니다
                            </Title>
                            {createdBugo && (
                                <>
                                    <Paper p="lg" radius="md" withBorder w="100%" maw={400}>
                                        <Stack gap="sm">
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">부고번호</Text>
                                                <Text fw={600}>{createdBugo.bugo_number}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">고인</Text>
                                                <Text fw={600}>故 {createdBugo.deceased_name}</Text>
                                            </Group>
                                        </Stack>
                                    </Paper>
                                    <Stack gap="sm" w="100%" maw={400}>
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
                                        <Divider my="sm" />
                                        <Button
                                            component={Link}
                                            href="/"
                                            variant="subtle"
                                            leftSection={<IconHome size={18} />}
                                        >
                                            홈으로 돌아가기
                                        </Button>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    </Stepper.Completed>
                </Stepper>

                {/* Navigation Buttons */}
                {active < 3 && (
                    <Group justify="center" mt="xl">
                        {active > 0 && (
                            <Button variant="default" onClick={prevStep} leftSection={<IconChevronLeft size={16} />}>
                                이전
                            </Button>
                        )}
                        {active < 2 ? (
                            <Button onClick={nextStep} rightSection={<IconChevronRight size={16} />}>
                                다음
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                loading={isSubmitting}
                                rightSection={<IconCheck size={16} />}
                            >
                                부고장 생성
                            </Button>
                        )}
                    </Group>
                )}
            </Container>
        </Box>
    );
}

export default function CreatePage() {
    return (
        <Suspense
            fallback={
                <Center h="100vh">
                    <Loader size="lg" />
                </Center>
            }
        >
            <CreatePageContent />
        </Suspense>
    );
}
