package com.smsretriever

import com.smsretriever.NativeSmsRetrieverSpec
import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class SMSRetrieverPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeSmsRetrieverSpec.NAME) {
      SMSRetrieverModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativeSmsRetrieverSpec.NAME to ReactModuleInfo(
        name = NativeSmsRetrieverSpec.NAME,
        className = SMSRetrieverModule::class.java.name,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true
      )
    )
  }
}
