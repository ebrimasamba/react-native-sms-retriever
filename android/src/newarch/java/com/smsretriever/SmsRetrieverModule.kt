package com.smsretriever

import com.facebook.react.bridge.Promise
import com.smsretriever.NativeSmsRetrieverSpec
import com.facebook.react.bridge.ReactApplicationContext



class SMSRetrieverModule(reactContext: ReactApplicationContext) : NativeSmsRetrieverSpec(reactContext) {
  private val smsRetrieverModuleImpl = SmsRetrieverModuleImpl(reactContext)
  override fun startSMSListener() {
    smsRetrieverModuleImpl.startSMSListener()
  }

  override fun stopSMSListener() {
    smsRetrieverModuleImpl.stopSMSListener()
  }

  override fun getAppHash(promise: Promise) {
    smsRetrieverModuleImpl.getAppHash(promise)
  }

  override fun getStatus(promise: Promise) {
  smsRetrieverModuleImpl.getStatus(promise)
  }


}
