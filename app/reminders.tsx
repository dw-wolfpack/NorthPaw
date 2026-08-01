import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { trackEvent } from '@/lib/analytics';
import {
  addMedReminder,
  countMedReminderByKind,
  deleteMedReminder,
  listMedReminders,
  markMedReminderCompleted,
  medReminderDisplayLabel,
  requestMedReminderPermissions,
  rescheduleMedRemindersFromUi,
  setMedReminderEnabled,
  updatePresetMedReminderSchedule,
  type MedReminderRow,
} from '@/lib/medReminders';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDetailScrollPadding } from '@/lib/layout';

const DEFAULT_INTERVAL = 30;

type ThemePalette = (typeof Colors)['light'];

type PresetFormState =
  | null
  | {
      mode: 'add';
      kind: 'heartworm' | 'flea_tick';
      intervalDays: number;
      firstDueDays: number;
      hourLocal: number;
      minuteLocal: number;
    }
  | {
      mode: 'edit';
      id: string;
      kind: 'heartworm' | 'flea_tick';
      intervalDays: number;
      firstDueDays: number;
      hourLocal: number;
      minuteLocal: number;
    };

const INTERVAL_CHOICES = [
  { days: 7 as const, label: '1 week' },
  { days: 14 as const, label: '2 weeks' },
  { days: 30 as const, label: '30 days' },
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function getTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateFromDaysFromToday(days: number): Date {
  const d = getTodayMidnight();
  d.setDate(d.getDate() + days);
  return d;
}

function daysFromTodayToDate(selected: Date): number {
  const start = getTodayMidnight();
  const end = new Date(selected);
  end.setHours(0, 0, 0, 0);
  return clamp(Math.round((end.getTime() - start.getTime()) / 86_400_000), 0, 365);
}

function maxFirstDueDate(): Date {
  const d = getTodayMidnight();
  d.setDate(d.getDate() + 365);
  return d;
}

function nearestIntervalPreset(n: number): 7 | 14 | 30 {
  const opts: (7 | 14 | 30)[] = [7, 14, 30];
  return opts.reduce((best, o) => (Math.abs(o - n) < Math.abs(best - n) ? o : best));
}

function formatFirstDueLine(days: number): string {
  if (days === 0) return 'First alert is today';
  return `First alert: ${dateFromDaysFromToday(days).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

/** 15-minute slots 6:00 AM – 10:00 PM for web time list */
function generateTimeSlots(): { h: number; m: number }[] {
  const out: { h: number; m: number }[] = [];
  for (let t = 6 * 60; t <= 22 * 60; t += 15) {
    out.push({ h: Math.floor(t / 60), m: t % 60 });
  }
  return out;
}

const WEB_TIME_SLOTS = generateTimeSlots();

function snapTimeToQuarterHour(h: number, m: number): { h: number; m: number } {
  let total = h * 60 + m;
  total = Math.round(total / 15) * 15;
  total = clamp(total, 6 * 60, 22 * 60);
  return { h: Math.floor(total / 60), m: total % 60 };
}

function estimateFirstDueInDaysFromNext(nextDueAt: number): number {
  const now = Date.now();
  if (nextDueAt <= now) return 0;
  return Math.min(365, Math.max(0, Math.ceil((nextDueAt - now) / 86_400_000)));
}

function validateSchedule(
  interval: number,
  first: number,
  hour: number,
  minute: number
): { ok: true } | { ok: false; title: string; message: string } {
  if (![7, 14, 30].includes(interval)) {
    return {
      ok: false,
      title: 'How often',
      message: 'Choose 1 week, 2 weeks, or 30 days.',
    };
  }
  if (first < 0 || first > 365) {
    return { ok: false, title: 'First reminder', message: 'Use 0–365 days from today.' };
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { ok: false, title: 'Time', message: 'Invalid time.' };
  }
  return { ok: true };
}

function SchedulePickers(props: {
  palette: ThemePalette;
  colorScheme: 'light' | 'dark';
  intervalDays: number;
  onIntervalDays: (n: number) => void;
  firstDueDays: number;
  onFirstDueDays: (n: number) => void;
  hourLocal: number;
  minuteLocal: number;
  onTime: (h: number, m: number) => void;
}) {
  const {
    palette,
    colorScheme,
    intervalDays,
    onIntervalDays,
    firstDueDays,
    onFirstDueDays,
    hourLocal,
    minuteLocal,
    onTime,
  } = props;

  const [iosDateOpen, setIosDateOpen] = useState(false);
  const [androidDateOpen, setAndroidDateOpen] = useState(false);
  const [androidTimeOpen, setAndroidTimeOpen] = useState(false);

  const timeAsDate = useMemo(() => {
    const d = new Date();
    d.setHours(hourLocal, minuteLocal, 0, 0);
    return d;
  }, [hourLocal, minuteLocal]);

  const chip = (label: string, selected: boolean, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={() => { hapticTap(); onPress(); }}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? palette.tint : palette.border,
          backgroundColor: palette.surface,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <Text
        style={{
          color: selected ? palette.tint : palette.text,
          fontWeight: '700',
          fontSize: 13,
        }}>
        {label}
      </Text>
    </Pressable>
  );

  const openCalendar = () => {
    if (Platform.OS === 'android') {
      setAndroidDateOpen(true);
    } else if (Platform.OS === 'ios') {
      setIosDateOpen(true);
    }
  };

  const setNextFirstOfMonth = () => {
    onIntervalDays(30);
    const now = getTodayMidnight();
    let target = new Date(now.getFullYear(), now.getMonth(), 1);
    if (target.getTime() < now.getTime()) {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    onFirstDueDays(daysFromTodayToDate(target));
  };

  const setNextFifteenthOfMonth = () => {
    onIntervalDays(30);
    const now = getTodayMidnight();
    let target = new Date(now.getFullYear(), now.getMonth(), 15);
    if (target.getTime() < now.getTime()) {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    }
    onFirstDueDays(daysFromTodayToDate(target));
  };

  const selectedDate = useMemo(() => dateFromDaysFromToday(firstDueDays), [firstDueDays]);
  const isFirstOfMonthSelected = selectedDate.getDate() === 1 && firstDueDays !== 0;
  const isFifteenthOfMonthSelected = selectedDate.getDate() === 15 && firstDueDays !== 0;

  if (Platform.OS === 'web') {
    return (
      <>
        <View style={styles.scheduleBlock}>
          <Text style={[styles.scheduleBlockTitle, { color: palette.text }]}>How often?</Text>
          <Text style={[styles.scheduleBlockHint, { color: palette.textSecondary }]}>
            Choose repeat cadence for monthly or weekly care.
          </Text>
          <View style={[styles.chipScroll, { flexWrap: 'wrap' }]}>
            {INTERVAL_CHOICES.map((s) =>
              chip(s.label, intervalDays === s.days, () => onIntervalDays(s.days), `int-${s.days}`)
            )}
          </View>
        </View>
        <View style={styles.scheduleBlock}>
          <Text style={[styles.scheduleBlockTitle, { color: palette.text }]}>First reminder</Text>
          <View style={[styles.chipScroll, { flexWrap: 'wrap', marginBottom: 10 }]}>
            {chip('Today', firstDueDays === 0, () => onFirstDueDays(0), 'web-today')}
            {chip('1st of Month', false, setNextFirstOfMonth, 'web-1st')}
            {chip('15th of Month', false, setNextFifteenthOfMonth, 'web-15th')}
          </View>
          <Text style={[styles.scheduleBlockHint, { color: palette.textSecondary, marginBottom: 6 }]}>
            Days from today (0 = today)
          </Text>
          <TextInput
            value={String(firstDueDays)}
            onChangeText={(t) => {
              const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
              if (t === '' || Number.isNaN(n)) return;
              onFirstDueDays(clamp(n, 0, 365));
            }}
            keyboardType="number-pad"
            style={[
              styles.input,
              { borderColor: palette.border, backgroundColor: palette.background, color: palette.text },
            ]}
          />
          <Text style={[styles.scheduleFinePrint, { color: palette.textSecondary, marginTop: 8 }]}>
            {formatFirstDueLine(firstDueDays)}
          </Text>
        </View>
        <View style={styles.scheduleBlock}>
          <Text style={[styles.scheduleBlockTitle, { color: palette.text }]}>Alert time</Text>
          <ScrollView style={styles.webTimeList} nestedScrollEnabled>
            {WEB_TIME_SLOTS.map(({ h, m }) => {
              const d = new Date();
              d.setHours(h, m, 0, 0);
              const label = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
              const sel = hourLocal === h && minuteLocal === m;
              return (
                <Pressable
                  key={`${h}-${m}`}
                  onPress={() => { hapticTap();  onTime(h, m); }}
                  style={[
                    styles.webTimeRow,
                    {
                      borderColor: sel ? palette.tint : palette.border,
                      borderWidth: sel ? 2 : 1,
                      backgroundColor: palette.surface,
                    },
                  ]}>
                  <Text style={{ color: sel ? palette.tint : palette.text, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </>
    );
  }

  return (
    <>
      <View style={styles.scheduleBlock}>
        <Text style={[styles.scheduleBlockTitle, { color: palette.text }]}>How often?</Text>
        <Text style={[styles.scheduleBlockHint, { color: palette.textSecondary }]}>
          Choose 1 week, 2 weeks, or monthly (30 days).
        </Text>
        <View style={[styles.chipScroll, { flexWrap: 'wrap' }]}>
          {INTERVAL_CHOICES.map((s) =>
            chip(s.label, intervalDays === s.days, () => onIntervalDays(s.days), `int-${s.days}`)
          )}
        </View>
      </View>

      <View style={styles.scheduleBlock}>
        <Text style={[styles.scheduleBlockTitle, { color: palette.text }]}>First reminder</Text>
        <Text style={[styles.scheduleBlockHint, { color: palette.textSecondary }]}>
          Start today, pick a calendar date, or set to 1st/15th of the month.
        </Text>
        <View style={[styles.dateRow, { gap: 8, flexWrap: 'wrap' }]}>
          {chip('Today', firstDueDays === 0, () => onFirstDueDays(0), 'first-today')}
          {chip('1st of Month', isFirstOfMonthSelected, setNextFirstOfMonth, 'first-1st')}
          {chip('15th of Month', isFifteenthOfMonthSelected, setNextFifteenthOfMonth, 'first-15th')}
          <Pressable
            onPress={() => { hapticTap(); openCalendar(); }}
            style={({ pressed }) => [
              styles.chip,
              styles.calendarChip,
              {
                borderColor: palette.tint,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            <FontAwesome name="calendar" size={14} color={palette.tint} style={{ marginRight: 8 }} />
            <Text style={{ color: palette.tint, fontWeight: '800', fontSize: 13 }}>Choose date</Text>
          </Pressable>
        </View>
        <Text style={[styles.firstDueSummary, { color: palette.text }]}>{formatFirstDueLine(firstDueDays)}</Text>

        {Platform.OS === 'android' && androidDateOpen ? (
          <DateTimePicker
            mode="date"
            display="default"
            value={dateFromDaysFromToday(firstDueDays)}
            minimumDate={getTodayMidnight()}
            maximumDate={maxFirstDueDate()}
            onChange={(e, date) => {
              setAndroidDateOpen(false);
              if (e.type === 'set' && date) {
                onFirstDueDays(daysFromTodayToDate(date));
              }
            }}
          />
        ) : null}

        <Modal visible={iosDateOpen} animationType="slide" transparent>
          <Pressable style={styles.dateModalBackdrop} onPress={() => { hapticTap();  setIosDateOpen(false); }}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[styles.dateModalSheet, { backgroundColor: palette.surface }]}>
              <View style={styles.dateModalHeader}>
                <Text style={[styles.dateModalTitle, { color: palette.text }]}>First reminder date</Text>
                <Pressable onPress={() => { hapticTap();  setIosDateOpen(false); }} hitSlop={12}>
                  <Text style={{ color: palette.tint, fontWeight: '800', fontSize: 16 }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode="date"
                display="inline"
                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                value={dateFromDaysFromToday(firstDueDays)}
                minimumDate={getTodayMidnight()}
                maximumDate={maxFirstDueDate()}
                onChange={(_, date) => {
                  if (date) onFirstDueDays(daysFromTodayToDate(date));
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      <View style={styles.scheduleBlock}>
        <Text style={[styles.scheduleBlockTitle, { color: palette.text }]}>Alert time</Text>
        <Text style={[styles.scheduleBlockHint, { color: palette.textSecondary }]}>
          Select what time of day to receive your alert.
        </Text>
        {Platform.OS === 'android' ? (
          <View style={{ marginTop: 6 }}>
            <Pressable
              onPress={() => { hapticTap(); setAndroidTimeOpen(true); }}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: palette.tint,
                  backgroundColor: palette.surface,
                  borderWidth: 1.5,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Text style={{ color: palette.tint, fontWeight: '800', fontSize: 15 }}>
                ⏰ Alert Time: {timeAsDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </Pressable>
            {androidTimeOpen ? (
              <DateTimePicker
                mode="time"
                display="default"
                value={timeAsDate}
                onChange={(e, date) => {
                  setAndroidTimeOpen(false);
                  if (e.type === 'set' && date) {
                    const s = snapTimeToQuarterHour(date.getHours(), date.getMinutes());
                    onTime(s.h, s.m);
                  }
                }}
              />
            ) : null}
          </View>
        ) : (
          <View
            style={[
              styles.timeSpinnerWrap,
              { backgroundColor: palette.background, borderColor: palette.border },
            ]}>
            <DateTimePicker
              mode="time"
              display="spinner"
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              value={timeAsDate}
              minuteInterval={15}
              onChange={(_, date) => {
                if (date) {
                  const s = snapTimeToQuarterHour(date.getHours(), date.getMinutes());
                  onTime(s.h, s.m);
                }
              }}
            />
          </View>
        )}
      </View>
    </>
  );
}

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export default function RemindersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[(colorScheme as 'light' | 'dark') ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro } = useSubscription();
  const [rows, setRows] = useState<MedReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKind, setBusyKind] = useState<string | null>(null);
  const [presetForm, setPresetForm] = useState<PresetFormState>(null);
  const [presetBusy, setPresetBusy] = useState(false);

  const [customLabel, setCustomLabel] = useState('');
  const [customInterval, setCustomInterval] = useState(DEFAULT_INTERVAL);
  const [customFirstDue, setCustomFirstDue] = useState(DEFAULT_INTERVAL);
  const [customHour, setCustomHour] = useState(9);
  const [customMinute, setCustomMinute] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  const reload = useCallback(async () => {
    const list = await listMedReminders();
    setRows(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let gone = false;
      trackEvent('screen_viewed', { screenName: 'Care Reminders' });
      (async () => {
        await reload();
        await rescheduleMedRemindersFromUi();
        if (!gone) setLoading(false);
      })();
      return () => {
        gone = true;
      };
    }, [reload])
  );

  useEffect(() => {
    setPresetForm((f) => {
      if (!f || f.mode !== 'edit') return f;
      return rows.some((r) => r.id === f.id) ? f : null;
    });
  }, [rows]);

  const ensurePerm = async (): Promise<boolean> => {
    const result = await requestMedReminderPermissions();
    if (result.ok) {
      trackEvent('notification_enabled', { context: 'reminders' });
      return true;
    }

    const openSettings = () => {
      Linking.openSettings().catch(() => {});
    };

    if (!result.canAskAgain) {
      Alert.alert(
        'Turn on notifications',
        'The “Allow” prompt can’t be shown again for NorthPaw. Open Settings, enable notifications, then return here and add your reminder.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]
      );
    } else {
      Alert.alert(
        'Notifications off',
        'When your phone asks, tap Allow so reminders can alert you. You can also open Settings to turn notifications on for NorthPaw.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]
      );
    }
    return false;
  };

  const openPresetAddForm = (kind: 'heartworm' | 'flea_tick') => {
    if (kind === 'heartworm' && rows.some((r) => r.kind === 'heartworm')) return;
    if (kind === 'flea_tick' && rows.some((r) => r.kind === 'flea_tick')) return;
    setPresetForm({
      mode: 'add',
      kind,
      intervalDays: DEFAULT_INTERVAL,
      firstDueDays: DEFAULT_INTERVAL,
      hourLocal: 9,
      minuteLocal: 0,
    });
  };

  const openPresetEditForm = (row: MedReminderRow) => {
    if (row.kind !== 'heartworm' && row.kind !== 'flea_tick') return;
    const snapped = snapTimeToQuarterHour(row.hour_local, row.minute_local);
    setPresetForm({
      mode: 'edit',
      id: row.id,
      kind: row.kind,
      intervalDays: nearestIntervalPreset(row.interval_days),
      firstDueDays: estimateFirstDueInDaysFromNext(row.next_due_at),
      hourLocal: snapped.h,
      minuteLocal: snapped.m,
    });
  };

  const savePresetForm = async () => {
    if (!presetForm) return;
    const v = validateSchedule(
      presetForm.intervalDays,
      presetForm.firstDueDays,
      presetForm.hourLocal,
      presetForm.minuteLocal
    );
    if (!v.ok) {
      Alert.alert(v.title, v.message);
      return;
    }

    const perm = await ensurePerm();
    if (!perm) return;

    setPresetBusy(true);
    try {
      if (presetForm.mode === 'add') {
        const n = await countMedReminderByKind(presetForm.kind);
        if (n > 0) {
          Alert.alert(
            'Already added',
            `You already have a ${presetForm.kind === 'heartworm' ? 'heartworm' : 'flea & tick'} reminder.`
          );
          setPresetForm(null);
          return;
        }
        await addMedReminder({
          kind: presetForm.kind,
          customLabel: '',
          intervalDays: presetForm.intervalDays,
          firstDueInDays: presetForm.firstDueDays,
          hourLocal: presetForm.hourLocal,
          minuteLocal: presetForm.minuteLocal,
        });
      } else {
        await updatePresetMedReminderSchedule(presetForm.id, {
          intervalDays: presetForm.intervalDays,
          firstDueInDays: presetForm.firstDueDays,
          hourLocal: presetForm.hourLocal,
          minuteLocal: presetForm.minuteLocal,
        });
      }
      setPresetForm(null);
      await reload();
      await rescheduleMedRemindersFromUi();
    } finally {
      setPresetBusy(false);
    }
  };

  const cancelPresetForm = () => setPresetForm(null);

  const addCustom = async () => {
    if (!isPro) {
      router.push({ pathname: '/paywall', params: { returnTo: '/reminders' } });
      return;
    }
    const label = customLabel.trim();
    if (!label) {
      Alert.alert('Name your reminder', 'Enter what this dose is for (for example, allergy meds).');
      return;
    }
    const check = validateSchedule(customInterval, customFirstDue, customHour, customMinute);
    if (!check.ok) {
      Alert.alert(check.title, check.message);
      return;
    }
    const perm = await ensurePerm();
    if (!perm) return;
    setBusyKind('custom');
    try {
      await addMedReminder({
        kind: 'custom',
        customLabel: label,
        intervalDays: customInterval,
        firstDueInDays: customFirstDue,
        hourLocal: customHour,
        minuteLocal: customMinute,
      });
      setCustomLabel('');
      setCustomInterval(DEFAULT_INTERVAL);
      setCustomFirstDue(DEFAULT_INTERVAL);
      setCustomHour(9);
      setCustomMinute(0);
      setShowCustom(false);
      await reload();
      await rescheduleMedRemindersFromUi();
    } finally {
      setBusyKind(null);
    }
  };

  const onToggle = async (row: MedReminderRow, on: boolean) => {
    await setMedReminderEnabled(row.id, on);
    trackEvent(on ? 'notification_enabled' : 'notification_disabled', {
      context: 'reminders_toggle',
      reminder_kind: row.kind,
    });
    await reload();
    await rescheduleMedRemindersFromUi();
  };

  const onMarkDone = async (row: MedReminderRow) => {
    await markMedReminderCompleted(row.id);
    await reload();
    await rescheduleMedRemindersFromUi();
  };

  const onDelete = (row: MedReminderRow) => {
    Alert.alert(
      'Remove reminder?',
      `${medReminderDisplayLabel(row)} will be deleted and its alert canceled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteMedReminder(row.id);
            await reload();
            await rescheduleMedRemindersFromUi();
          },
        },
      ]
    );
  };

  const hasHeartworm = rows.some((r) => r.kind === 'heartworm');
  const hasFlea = rows.some((r) => r.kind === 'flea_tick');

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={[styles.container, { paddingBottom: getDetailScrollPadding(insets.bottom) }]}>
      {Platform.OS === 'web' ? (
        <View style={[styles.note, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={{ color: palette.textSecondary, lineHeight: 20 }}>
            Local alerts work in the iPhone and Android apps after install. On the web, manage reminders when you use
            NorthPaw on a device.
          </Text>
        </View>
      ) : null}

      <Text style={[styles.body, { color: palette.textSecondary }]}>
        On-device alerts for routine care and treatment dates (not medical advice, please confirm schedules with your veterinarian).
      </Text>

      <Text style={[styles.h1, { color: palette.text }]}>Free reminders</Text>
      <View style={styles.presetRow}>
        <Pressable
          disabled={!!busyKind || presetBusy || hasHeartworm}
          onPress={() => { hapticTap();  openPresetAddForm('heartworm'); }}
          style={({ pressed }) => [
            styles.presetBtn,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.9 : hasHeartworm ? 0.45 : 1,
            },
          ]}>
          {presetBusy && presetForm?.mode === 'add' && presetForm.kind === 'heartworm' ? (
            <ActivityIndicator color={palette.tint} />
          ) : (
            <>
              <FontAwesome name="plus" size={14} color={palette.tint} style={{ marginRight: 6 }} />
              <Text style={{ color: palette.text, fontWeight: '800' }}>Heartworm</Text>
            </>
          )}
        </Pressable>
        <Pressable
          disabled={!!busyKind || presetBusy || hasFlea}
          onPress={() => { hapticTap();  openPresetAddForm('flea_tick'); }}
          style={({ pressed }) => [
            styles.presetBtn,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.9 : hasFlea ? 0.45 : 1,
            },
          ]}>
          {presetBusy && presetForm?.mode === 'add' && presetForm.kind === 'flea_tick' ? (
            <ActivityIndicator color={palette.tint} />
          ) : (
            <>
              <FontAwesome name="plus" size={14} color={palette.tint} style={{ marginRight: 6 }} />
              <Text style={{ color: palette.text, fontWeight: '800' }}>Flea & tick</Text>
            </>
          )}
        </Pressable>
      </View>
      <Text style={[styles.hint, { color: palette.textSecondary }]}>
        Choose sensible defaults below—you can edit anytime. Mark given to roll the next alert.
      </Text>

      {presetForm ? (
        <View
          style={[
            styles.scheduleCard,
            { borderColor: palette.border, backgroundColor: palette.surface },
          ]}>
          <Text style={[styles.scheduleCardTitle, { color: palette.text }]}>
            {presetForm.mode === 'add'
              ? presetForm.kind === 'heartworm'
                ? 'Heartworm schedule'
                : 'Flea & tick schedule'
              : presetForm.kind === 'heartworm'
                ? 'Edit heartworm schedule'
                : 'Edit flea & tick schedule'}
          </Text>
          <SchedulePickers
            palette={palette}
            colorScheme={colorScheme}
            intervalDays={presetForm.intervalDays}
            onIntervalDays={(n) => setPresetForm((f) => (f ? { ...f, intervalDays: n } : f))}
            firstDueDays={presetForm.firstDueDays}
            onFirstDueDays={(n) => setPresetForm((f) => (f ? { ...f, firstDueDays: n } : f))}
            hourLocal={presetForm.hourLocal}
            minuteLocal={presetForm.minuteLocal}
            onTime={(h, m) => setPresetForm((f) => (f ? { ...f, hourLocal: h, minuteLocal: m } : f))}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={() => { hapticTap(); cancelPresetForm(); }}
              disabled={presetBusy}
              style={[styles.secondaryBtn, { borderColor: palette.border, opacity: presetBusy ? 0.6 : 1 }]}>
              <Text style={{ color: palette.text, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={presetBusy}
              onPress={() => { hapticTap(); savePresetForm(); }}
              style={[
                styles.primaryBtn,
                { backgroundColor: palette.tint, flex: 1, opacity: presetBusy ? 0.7 : 1 },
              ]}>
              {presetBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '800' }}>Save reminder</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      <Text style={[styles.h1, { color: palette.text, marginTop: 28 }]}>Your reminders</Text>
      {rows.length === 0 ? (
        <Text style={{ color: palette.textSecondary }}>No reminders yet. Add heartworm or flea & tick above.</Text>
      ) : (
        rows.map((row) => (
          <View
            key={row.id}
            style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.text, fontWeight: '800', fontSize: 17 }}>
                  {medReminderDisplayLabel(row)}
                </Text>
                <Text style={{ color: palette.textSecondary, marginTop: 6, fontSize: 13 }}>
                  Next:{' '}
                  {new Date(row.next_due_at).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={{ color: palette.textSecondary, marginTop: 4, fontSize: 12 }}>
                  Every {row.interval_days}d · alert at{' '}
                  {String(row.hour_local).padStart(2, '0')}:{String(row.minute_local).padStart(2, '0')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: palette.textSecondary, fontSize: 11, marginBottom: 4 }}>On</Text>
                <Switch
                  value={row.enabled === 1}
                  onValueChange={(v) => onToggle(row, v)}
                  trackColor={{ false: palette.border, true: palette.tint }}
                />
              </View>
            </View>
            <View style={styles.cardActions}>
              {row.kind === 'heartworm' || row.kind === 'flea_tick' ? (
                <Pressable
                  onPress={() => { hapticTap();  openPresetEditForm(row); }}
                  style={styles.actionBtn}
                  disabled={presetBusy}>
                  <Text style={{ color: palette.tint, fontWeight: '700' }}>Edit schedule</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => { hapticTap();  onMarkDone(row); }} style={styles.actionBtn}>
                <Text style={{ color: palette.tint, fontWeight: '800' }}>Mark given</Text>
              </Pressable>
              <Pressable onPress={() => { hapticTap();  onDelete(row); }} style={styles.actionBtn}>
                <Text style={{ color: palette.danger, fontWeight: '700' }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  note: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  h1: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  scheduleCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  scheduleCardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  scheduleBlock: { marginBottom: 18 },
  scheduleBlockTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  scheduleBlockHint: { fontSize: 12, lineHeight: 16, marginBottom: 10 },
  chipScrollView: { marginHorizontal: -4 },
  chipScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  scheduleFinePrint: { fontSize: 11, lineHeight: 15, marginTop: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  calendarChip: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  firstDueSummary: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  dateModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dateModalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  dateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  dateModalTitle: { fontSize: 17, fontWeight: '800' },
  timeSpinnerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  webTimeList: { maxHeight: 200, marginTop: 8 },
  webTimeRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  proBlock: { marginTop: 8 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.35)',
  },
  actionBtn: { paddingVertical: 6 },
});
