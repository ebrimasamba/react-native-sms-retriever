package com.smsretriever

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class SMSRetrieverPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == SmsRetrieverModuleImpl.NAME) {
      SMSRetrieverModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    val isTurboModule: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

    mapOf(
      SmsRetrieverModuleImpl.NAME to ReactModuleInfo(
        name = SmsRetrieverModuleImpl.NAME,
        className = SmsRetrieverModuleImpl.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = isTurboModule
      )
    )
  }
}
