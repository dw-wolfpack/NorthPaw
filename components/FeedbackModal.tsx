import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { File, Paths } from 'expo-file-system';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { trackEvent } from '@/lib/analytics';

export type FeedbackType =
  | 'breed_request'
  | 'surface_request'
  | 'feature_request'
  | 'bug_report'
  | 'general_feedback';

export interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
}

const FEEDBACK_TYPES: Array<{ id: FeedbackType; label: string; icon: string }> = [
  { id: 'breed_request', label: 'Breed', icon: 'dog' },
  { id: 'surface_request', label: 'Surface', icon: 'road-variant' },
  { id: 'feature_request', label: 'Feature', icon: 'lightbulb-outline' },
  { id: 'bug_report', label: 'Bug', icon: 'bug-outline' },
  { id: 'general_feedback', label: 'General', icon: 'comment-text-outline' },
];

const FIELD_CONFIGS: Record<
  FeedbackType,
  {
    title: string;
    subtitle: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
  }
> = {
  breed_request: {
    title: 'Request a Breed',
    subtitle: 'NorthPaw is growing thanks to community feedback. If your dog’s breed isn’t listed, let me know and I’ll add it to the list.',
    subjectLabel: 'Breed Name (required)',
    subjectPlaceholder: 'Whippet',
    notesLabel: 'Notes (optional)',
    notesPlaceholder: 'Anything special I should know? Coat type, exercise needs, heat sensitivity, etc.',
  },
  surface_request: {
    title: 'Suggest a Surface',
    subtitle: 'Help improve our thermal pavement model. Let us know what surface is missing.',
    subjectLabel: 'Surface Name (required)',
    subjectPlaceholder: 'Cobblestone',
    notesLabel: 'Notes (optional)',
    notesPlaceholder: 'Describe the surface: texture, location, behavior under solar heat, etc.',
  },
  feature_request: {
    title: 'Request a Feature',
    subtitle: 'What features or additions would make NorthPaw even better for you and your dog?',
    subjectLabel: 'Feature Idea (required)',
    subjectPlaceholder: 'Apple Watch widget',
    notesLabel: 'Description (optional)',
    notesPlaceholder: 'Why would this feature be useful for your dog walks?',
  },
  bug_report: {
    title: 'Report a Bug',
    subtitle: 'Found an issue? Tell us what went wrong so we can fix it as soon as possible.',
    subjectLabel: 'What went wrong? (required)',
    subjectPlaceholder: 'e.g. App crashes when cycling surface',
    notesLabel: 'Details (optional)',
    notesPlaceholder: 'What steps did you take? Or device/iOS details.',
  },
  general_feedback: {
    title: 'Help Improve NorthPaw',
    subtitle: 'NorthPaw is growing thanks to community feedback. Share your thoughts or ideas with us.',
    subjectLabel: 'Subject (required)',
    subjectPlaceholder: 'e.g. Love the app design!',
    notesLabel: 'Feedback (optional)',
    notesPlaceholder: 'Anything you would like to share with the developer.',
  },
};

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export function FeedbackModal({ visible, onClose, initialType = 'general_feedback' }: FeedbackModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [activeType, setActiveType] = useState<FeedbackType>(initialType);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  // Sync activeType when initialType changes or modal opens
  useEffect(() => {
    if (visible) {
      setActiveType(initialType);
      setSubject('');
      setNotes('');
      setEmail('');
      setSuccess(false);
      setSubjectError(null);
    }
  }, [visible, initialType]);

  const config = FIELD_CONFIGS[activeType];

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setSubjectError(`${config.subjectLabel.split(' (')[0]} is required`);
      return;
    }
    setSubjectError(null);
    setBusy(true);

    try {
      const subVal = subject.trim();
      const notesVal = notes.trim();
      const emailVal = email.trim();
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      const timestamp = Date.now();

      // 1. Store request locally in Document directory
      const file = new File(Paths.document, 'feedback_requests.json');
      let requests: Array<{
        type: string;
        subject: string;
        notes: string;
        email: string;
        timestamp: number;
        appVersion: string;
      }> = [];

      if (file.exists) {
        try {
          const text = await file.text();
          requests = JSON.parse(text);
        } catch {
          // ignore corrupted/empty file
        }
      }
      requests.push({
        type: activeType,
        subject: subVal,
        notes: notesVal,
        email: emailVal,
        timestamp,
        appVersion,
      });
      file.write(JSON.stringify(requests));

      // 2. Track Mixpanel events
      // Send general feedback submission
      trackEvent('feedback_submitted', {
        feedback_type: activeType,
        email_provided: !!emailVal,
        notes_provided: !!notesVal,
        app_version: appVersion,
      });

      // Special legacy analytics check to support breed_request_submitted analytics properties
      if (activeType === 'breed_request') {
        trackEvent('breed_request_submitted', {
          breed_name: subVal,
          email_provided: !!emailVal,
          notes_provided: !!notesVal,
          app_version: appVersion,
        });
      }

      // 3. Submit to Google Sheets Web App if configured
      const sheetsUrl = process.env.EXPO_PUBLIC_BREED_REQUEST_SHEETS_URL;
      if (sheetsUrl) {
        try {
          const response = await fetch(sheetsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: activeType,
              subject: subVal,
              notes: notesVal,
              email: emailVal,
              appVersion,
            }),
          });
          const result = await response.json();
          if (result.status !== 'success') {
            console.warn('[NorthPaw] Google Sheets Web App responded with error:', result);
          }
        } catch (err) {
          console.warn('[NorthPaw] Failed to post feedback to Google Sheets Web App:', err);
          throw new Error('Network error posting to Sheets');
        }
      } else {
        console.log(`[NorthPaw] Feedback (${activeType}) saved locally. Set EXPO_PUBLIC_BREED_REQUEST_SHEETS_URL for Sheet submission.`);
      }

      setSuccess(true);
    } catch (e) {
      console.error('[NorthPaw] Feedback submission error:', e);
      setSubjectError('Failed to send feedback. Please check connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.modalRoot, { backgroundColor: palette.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
          <Text style={[styles.modalTitle, { color: palette.text }]}>{config.title}</Text>
          <Pressable onPress={() => { hapticTap(); onClose(); }} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={palette.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          {success ? (
            <View style={styles.modalSuccessContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color={palette.tint}
                style={{ alignSelf: 'center', marginBottom: 16 }}
              />
              <Text style={[styles.modalSuccessText, { color: palette.text }]}>
                Thanks! Your feedback has been sent. Every submission is personally reviewed and helps make NorthPaw better.
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1, marginTop: 24 },
                ]}
              >
                <Text style={styles.ctaText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              {/* Type Switcher Chips */}
              <Text style={[styles.inputLabel, { color: palette.text, marginBottom: 8 }]}>Feedback Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScroll}
                contentContainerStyle={styles.typeContainer}
              >
                {FEEDBACK_TYPES.map((t) => {
                  const isSelected = activeType === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => {
                        hapticTap();
                        setActiveType(t.id);
                        setSubjectError(null);
                      }}
                      style={[
                        styles.typeChip,
                        {
                          borderColor: isSelected ? palette.tint : palette.border,
                          backgroundColor: isSelected ? palette.selectedBg : palette.surface,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={t.icon as any}
                        size={16}
                        color={isSelected ? palette.tint : palette.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.typeChipLabel,
                          { color: isSelected ? palette.tint : palette.textSecondary },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[styles.modalSubtitle, { color: palette.textSecondary, marginBottom: 20 }]}>
                {config.subtitle}
              </Text>

              {subjectError ? (
                <Text style={[styles.errorLabel, { color: palette.danger, marginBottom: 12 }]}>
                  {subjectError}
                </Text>
              ) : null}

              <Text style={[styles.inputLabel, { color: palette.text, marginBottom: 6 }]}>
                {config.subjectLabel}
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder={config.subjectPlaceholder}
                placeholderTextColor={palette.textSecondary}
                style={[
                  styles.input,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.surface,
                    color: palette.text,
                    marginBottom: 16,
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: palette.text, marginBottom: 6 }]}>
                {config.notesLabel}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={config.notesPlaceholder}
                placeholderTextColor={palette.textSecondary}
                multiline
                numberOfLines={3}
                style={[
                  styles.input,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.surface,
                    color: palette.text,
                    marginBottom: 16,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: palette.text, marginBottom: 6 }]}>
                Email (optional)
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={palette.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.surface,
                    color: palette.text,
                    marginBottom: 4,
                  },
                ]}
              />
              <Text style={[styles.helperText, { color: palette.textSecondary, marginBottom: 24 }]}>
                Only used to let you know when it is resolved/available.
              </Text>

              <Pressable
                disabled={busy}
                onPress={() => { hapticTap(); void handleSubmit(); }}
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: busy ? palette.border : palette.tint,
                    opacity: pressed && !busy ? 0.9 : 1,
                  },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>🐾 Submit Feedback</Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  modalScroll: { padding: 20 },
  modalSuccessContainer: { alignItems: 'stretch', paddingVertical: 40 },
  modalSuccessText: { fontSize: 16, lineHeight: 24, textAlign: 'center', fontWeight: '600' },
  inputLabel: { fontSize: 14, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
  },
  helperText: { fontSize: 12, marginTop: 4 },
  errorLabel: { fontSize: 13, fontWeight: '700' },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  typeScroll: { marginBottom: 16, marginTop: 4 },
  typeContainer: { gap: 8, paddingRight: 20 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeChipLabel: { fontSize: 14, fontWeight: '700' },
});
