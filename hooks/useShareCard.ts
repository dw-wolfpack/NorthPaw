import { useRef, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { trackEvent } from '../lib/analytics';

interface ShareCardDetails {
  dogName: string;
  dogBreed: string;
  currentNpi: number;
  selectedSurface: string;
  surfaceTempF: number;
  currentTempF: number;
  roadBand: string;
}

export const useShareCard = () => {
  const viewRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareCard = useCallback(async (details: ShareCardDetails) => {
    if (isSharing) return;

    setIsSharing(true);
    
    // 1. Track share button tapped
    trackEvent('share_button_tapped', {
      dog_name: details.dogName,
      dog_breed: details.dogBreed,
      npi_score: details.currentNpi,
      surface_type: details.selectedSurface,
      surface_temp: details.surfaceTempF,
      air_temp: details.currentTempF,
      road_band: details.roadBand,
    });

    // Trigger medium haptic feedback to confirm press
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Silence haptic exceptions on simulator/unsupported devices
    }

    try {
      // 2. Capture the ShareCard view in full resolution (PNG, 100% quality)
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
      });

      // 3. Check if native OS sharing sheet is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
        setIsSharing(false);
        return;
      }

      // 4. Track share sheet opened
      trackEvent('share_sheet_opened', {
        dog_name: details.dogName,
        dog_breed: details.dogBreed,
        npi_score: details.currentNpi,
        surface_type: details.selectedSurface,
        surface_temp: details.surfaceTempF,
        air_temp: details.currentTempF,
        road_band: details.roadBand,
      });

      // 5. Share the captured card image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share NorthPaw Safety Card',
        UTI: 'public.png',
      });
      
      // 6. Track share completed (resolves when OS sharing sheet completes or closes)
      trackEvent('share_completed', {
        dog_name: details.dogName,
        dog_breed: details.dogBreed,
        npi_score: details.currentNpi,
        surface_type: details.selectedSurface,
        surface_temp: details.surfaceTempF,
        air_temp: details.currentTempF,
        road_band: details.roadBand,
      });

    } catch (error) {
      console.error('[useShareCard] Capture error: ', error);
      Alert.alert('Share Failed', 'Failed to generate and share the safety card. Please try again.');
    } finally {
      setIsSharing(false);
    }
  }, [isSharing]);

  return {
    viewRef,
    isSharing,
    shareCard,
  };
};
