import Constants, { ExecutionEnvironment } from 'expo-constants';

/** True when running inside the Expo Go client (scan QR without a custom dev build). */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}
