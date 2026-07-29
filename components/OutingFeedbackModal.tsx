import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { finishOuting, OutingOutcomeResponse } from '@/lib/outings';
import { trackEvent } from '@/lib/analytics';

type Props = {
  visible: boolean;
  outingId: string;
  dogName?: string;
  onClose: () => void;
};

const SIGNAL_CHIPS = [
  { id: 'heavy_panting', label: 'Heavy Panting' },
  { id: 'sought_shade', label: 'Sought Shade' },
  { id: 'stopped_early', label: 'Stopped Early' },
  { id: 'foot_lifting', label: 'Paw Lifting' },
  { id: 'slow_recovery', label: 'Slow Recovery' },
];

export default function OutingFeedbackModal({ visible, outingId, dogName = 'your dog', onClose }: Props) {
  const [selectedResponse, setSelectedResponse] = useState<OutingOutcomeResponse | null>(null);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleResponseSelect = async (resp: OutingOutcomeResponse) => {
    setSelectedResponse(resp);
    if (resp === 'as_usual' || resp === 'did_not_go') {
      // 1-tap fast path finish
      await finishOuting(outingId, resp, []);
      trackEvent('post_outing_flow_completed');
      setSavedSuccess(true);
    }
  };

  const toggleSignal = (signalId: string) => {
    setSelectedSignals((prev) =>
      prev.includes(signalId) ? prev.filter((s) => s !== signalId) : [...prev, signalId]
    );
  };

  const handleSaveDetailed = async () => {
    if (!selectedResponse) return;
    await finishOuting(outingId, selectedResponse, selectedSignals);
    // D4 & F6 PRIVACY GUARANTEE: Telemetry emits flow completion event with ZERO outcome text or chips
    trackEvent('post_outing_flow_completed');
    setSavedSuccess(true);
  };

  const handleDismiss = () => {
    trackEvent('post_outing_prompt_dismissed');
    setSelectedResponse(null);
    setSelectedSignals([]);
    setSavedSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Post-Walk Check-In</Text>
            <Pressable onPress={handleDismiss} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#9AAFA3" />
            </Pressable>
          </View>

          {savedSuccess ? (
            <View style={styles.successBox}>
              <MaterialCommunityIcons name="shield-check-outline" size={48} color="#D4AF37" />
              <Text style={styles.successTitle}>Saved Privately On Device</Text>
              <Text style={styles.successSub}>
                Your check-in builds {dogName}'s private baseline for safer future walk recommendations.
              </Text>
              <Pressable style={styles.doneBtn} onPress={handleDismiss}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.questionText}>How did {dogName} handle the outing?</Text>

              <View style={styles.optionsList}>
                <Pressable
                  style={[styles.optionBtn, selectedResponse === 'as_usual' && styles.optionSelected]}
                  onPress={() => handleResponseSelect('as_usual')}>
                  <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color="#4E9F6E" />
                  <Text style={styles.optionText}>As Usual</Text>
                </Pressable>

                <Pressable
                  style={[styles.optionBtn, selectedResponse === 'slowed' && styles.optionSelected]}
                  onPress={() => handleResponseSelect('slowed')}>
                  <MaterialCommunityIcons name="walk" size={24} color="#D4AF37" />
                  <Text style={styles.optionText}>Slowed Down</Text>
                </Pressable>

                <Pressable
                  style={[styles.optionBtn, selectedResponse === 'struggled' && styles.optionSelected]}
                  onPress={() => handleResponseSelect('struggled')}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#E67E22" />
                  <Text style={styles.optionText}>Struggled</Text>
                </Pressable>

                <Pressable
                  style={[styles.optionBtn, selectedResponse === 'did_not_go' && styles.optionSelected]}
                  onPress={() => handleResponseSelect('did_not_go')}>
                  <MaterialCommunityIcons name="cancel" size={24} color="#8A9E92" />
                  <Text style={styles.optionText}>Didn't Go</Text>
                </Pressable>
              </View>

              {/* Conditional Follow-Up Chips for Slowed/Struggled */}
              {(selectedResponse === 'slowed' || selectedResponse === 'struggled') && (
                <View style={styles.chipsSection}>
                  <Text style={styles.chipsLabel}>Optional Observations (Tap to select):</Text>
                  <View style={styles.chipsGrid}>
                    {SIGNAL_CHIPS.map((chip) => {
                      const isSelected = selectedSignals.includes(chip.id);
                      return (
                        <Pressable
                          key={chip.id}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => toggleSignal(chip.id)}>
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {chip.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable style={styles.saveBtn} onPress={handleSaveDetailed}>
                    <Text style={styles.saveBtnText}>Save Check-In</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#0D1F17',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  questionText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chipsSection: {
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  chipsLabel: {
    color: '#B0C2B6',
    fontSize: 13,
    marginBottom: 10,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  chipText: {
    color: '#D0E0D5',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#0A1A12',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0A1A12',
    fontWeight: '700',
    fontSize: 16,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  successSub: {
    color: '#B0C2B6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  doneBtnText: {
    color: '#0A1A12',
    fontWeight: '700',
    fontSize: 15,
  },
});
