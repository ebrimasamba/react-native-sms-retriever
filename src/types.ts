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
}

export type NativeSMSRetrieverType = {
  startSMSListener: () => void;
  onSMSRetrieved: (otp: string) => void;
  onSMSError: (error: SMSError) => void;
  stopSMSListener: () => void;
  getAppHash: () => Promise<string>;
  getStatus: () => Promise<SMSStatus>;
};
