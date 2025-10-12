package com.smsretriever

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.modules.core.DeviceEventManagerModule

class SMSRetrieverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val smsRetrieverModuleImpl = SmsRetrieverModuleImpl(reactContext)

    override fun getName(): String {
        return SmsRetrieverModuleImpl.NAME
    }

    @ReactMethod
    fun startSMSListener() {
        smsRetrieverModuleImpl.startSMSListener()
    }

    @ReactMethod
    fun stopSMSListener() {
        smsRetrieverModuleImpl.stopSMSListener()
    }

    @ReactMethod
    fun getAppHash(promise: Promise) {
        smsRetrieverModuleImpl.getAppHash(promise)
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        smsRetrieverModuleImpl.getStatus(promise)
    }
}
