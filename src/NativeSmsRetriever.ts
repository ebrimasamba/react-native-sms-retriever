import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface SMSError {
  type:
    | 'TIMEOUT'
    | 'PERMISSION_DENIED'
    | 'SERVICE_UNAVAILABLE'
    | 'INVALID_SMS_FORMAT'
    | 'UNKNOWN_ERROR';
  message: string;
}

export interface SMSStatus {
  isListening: boolean;
  isRegistered: boolean;
  retryCount: number;
}

export interface Spec extends TurboModule {
  startSMSListener(): void;
  stopSMSListener(): void;
  getAppHash(): Promise<string>;
  getStatus(): Promise<SMSStatus>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SMSRetriever') as Spec;
