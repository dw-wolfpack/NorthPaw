import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

import { ENTITLEMENT_PRO } from '@/constants/Purchases';
import { isExpoGo as getIsExpoGo } from '@/lib/expoMode';

type SubscriptionContextValue = {
  /** True when RevenueCat reports active `pro` entitlement (or dev unlock). */
  isPro: boolean;
  /** Array of string IDs for all currently active item entitlements */
  activeEntitlements: string[];
  loading: boolean;
  configured: boolean;
  /** True when running in Expo Go, real IAP is unavailable. */
  expoGo: boolean;
  error: string | null;
  currentOffering: PurchasesOffering | null;
  refresh: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  restorePurchases: () => Promise<CustomerInfo>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const devUnlock =
  __DEV__ &&
  typeof process !== 'undefined' &&
  (process.env.EXPO_PUBLIC_NORTHPAW_DEV_PRO === '1' ||
    process.env.EXPO_PUBLIC_TRAILREADY_DEV_PRO === '1');

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isProInternal, setIsProInternal] = useState(false);
  const [activeEntitlements, setActiveEntitlements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

  const expoGo = Platform.OS === 'web' ? false : getIsExpoGo();

  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    const active = info.entitlements.active[ENTITLEMENT_PRO] != null;
    setIsProInternal(active);
    setActiveEntitlements(Object.keys(info.entitlements.active));
  }, []);

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'ios' || !configured || expoGo) return;
    try {
      const info = await Purchases.getCustomerInfo();
      applyCustomerInfo(info);
      const offerings = await Purchases.getOfferings();
      setCurrentOffering(offerings.current);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Subscription refresh failed');
    }
  }, [applyCustomerInfo, configured, expoGo]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setLoading(false);
      setConfigured(false);
      return;
    }

    if (expoGo) {
      setConfigured(false);
      setLoading(false);
      setIsProInternal(false);
      setActiveEntitlements([]);
      setCurrentOffering(null);
      setError(null);
      return;
    }

    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
    if (!apiKey) {
      if (__DEV__) {
        console.warn(
          '[NorthPaw] Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY, Pro content stays locked until configured.'
        );
      }
      setConfigured(false);
      setLoading(false);
      setIsProInternal(false);
      setActiveEntitlements([]);
      return;
    }

    let cancelled = false;
    let listenerRegistered = false;
    const onCustomerInfoUpdate = (info: CustomerInfo) => applyCustomerInfo(info);

    (async () => {
      try {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
        Purchases.configure({ apiKey });
        if (cancelled) return;
        setConfigured(true);
        Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdate);
        listenerRegistered = true;

        const info = await Purchases.getCustomerInfo();
        if (cancelled) return;
        applyCustomerInfo(info);
        const offerings = await Purchases.getOfferings();
        if (cancelled) return;
        setCurrentOffering(offerings.current);
        setError(null);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Purchases failed to configure');
          setConfigured(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (listenerRegistered) {
        Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdate);
      }
    };
  }, [applyCustomerInfo, expoGo]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage) => {
      if (expoGo) {
        throw new Error('Purchases are not available in Expo Go. Use a development build to test IAP.');
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      applyCustomerInfo(customerInfo);
      return customerInfo;
    },
    [applyCustomerInfo, expoGo]
  );

  const restorePurchases = useCallback(async () => {
    if (expoGo) {
      throw new Error('Restore is not available in Expo Go.');
    }
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return info;
  }, [applyCustomerInfo, expoGo]);

  const isPro = devUnlock || isProInternal;

  const value = useMemo(
    () => ({
      isPro,
      activeEntitlements,
      loading,
      configured,
      expoGo,
      error,
      currentOffering,
      refresh,
      purchasePackage,
      restorePurchases,
    }),
    [
      isPro,
      activeEntitlements,
      loading,
      configured,
      expoGo,
      error,
      currentOffering,
      refresh,
      purchasePackage,
      restorePurchases,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
