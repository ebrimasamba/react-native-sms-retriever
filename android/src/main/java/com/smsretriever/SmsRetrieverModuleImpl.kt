package com.smsretriever

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.auth.api.phone.SmsRetrieverClient
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status


enum class SMSErrorType {
  TIMEOUT,
  PERMISSION_DENIED,
  SERVICE_UNAVAILABLE,
  INVALID_SMS_FORMAT,
  UNKNOWN_ERROR
}
class SmsRetrieverModuleImpl(private val reactContext: ReactApplicationContext) {
  companion object {
    const val NAME = "SMSRetriever"
    private const val TAG = "SMSRetrieverModuleImpl"
  }

  private var isRegistered: Boolean = false
  private var isListening: Boolean = false
  private var currentPromise: Promise? = null

  private val smsBroadcastReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      Log.d(TAG, "Intent received: ${intent.action}")

      if (SmsRetriever.SMS_RETRIEVED_ACTION == intent.action) {
        val extras = intent.extras
        val status = extras?.getParcelable<Status>(SmsRetriever.EXTRA_STATUS)

        if (status == null) {
          Log.e(TAG, "Status is null in SMS intent")
          handleError(SMSErrorType.UNKNOWN_ERROR, "Invalid SMS status")
          return
        }

        Log.d(TAG, "SMS Status: ${status.statusCode}")

        when (status.statusCode) {
          CommonStatusCodes.SUCCESS -> {
            val sms = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE)
            if (sms.isNullOrBlank()) {
              Log.e(TAG, "SMS message is null or empty")
              handleError(SMSErrorType.INVALID_SMS_FORMAT, "Empty SMS message")
              return
            }

            val otp = extractOTPFromSMS(sms)
            if (otp.isNullOrBlank()) {
              Log.e(TAG, "Could not extract OTP from SMS: $sms")
              handleError(SMSErrorType.INVALID_SMS_FORMAT, "No valid OTP found in SMS")
              return
            }

            Log.d(TAG, "OTP extracted successfully: $otp")
            handleSuccess(otp)
          }
          CommonStatusCodes.TIMEOUT -> {
            Log.w(TAG, "SMS retrieval timeout")
            handleError(SMSErrorType.TIMEOUT, "SMS retrieval timeout")
          }
          CommonStatusCodes.API_NOT_CONNECTED -> {
            Log.e(TAG, "Google Play Services not connected")
            handleError(SMSErrorType.SERVICE_UNAVAILABLE, "Google Play Services not available")
          }
          else -> {
            Log.e(TAG, "Unknown SMS status code: ${status.statusCode}")
            handleError(SMSErrorType.UNKNOWN_ERROR, "Unknown error: ${status.statusCode}")
          }
        }
      }
    }
  }
  private fun extractOTPFromSMS(sms: String?): String? {
    if (sms.isNullOrBlank()) {
      Log.w(TAG, "SMS is null or blank")
      return null
    }

    Log.d(TAG, "Extracting OTP from SMS: $sms")

    // Multiple OTP patterns for better coverage
    val otpPatterns = listOf(
      "\\b\\d{4,6}\\b",           // 4-6 digit numbers with word boundaries
      "(?i)(?:otp|code|verification|pin)[\\s:]*([0-9]{4,6})", // OTP with prefix
      "([0-9]{4,6})",             // Simple 4-6 digit numbers
      "\\d{4,8}"                  // Extended range for some services
    )

    for (pattern in otpPatterns) {
      val regex = pattern.toRegex()
      val match = regex.find(sms)
      if (match != null) {
        val otp = match.groupValues.lastOrNull { it.matches("\\d{4,8}".toRegex()) }
        if (!otp.isNullOrBlank()) {
          Log.d(TAG, "OTP found with pattern '$pattern': $otp")
          return otp
        }
      }
    }

    Log.w(TAG, "No valid OTP pattern found in SMS")
    return null
  }

  private fun handleSuccess(otp: String) {
    Log.d(TAG, "SMS retrieval successful: $otp")
    cleanup()
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("onSMSRetrieved", otp)

    currentPromise?.resolve(otp)
    currentPromise = null
  }

  private fun handleError(errorType: SMSErrorType, message: String) {
    Log.e(TAG, "SMS retrieval error: $message")
    cleanup()

    val errorMap = Arguments.createMap().apply {
      putString("type", errorType.name)
      putString("message", message) }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("onSMSError", errorMap)

    currentPromise?.reject(errorType.name, message)
    currentPromise = null
  }

  private fun cleanup() {
    isListening = false
  }


  fun startSMSListener() {
    if (isListening) {
      Log.w(TAG, "SMS listener is already active")
      return
    }

    Log.d(TAG, "Starting SMS listener...")

    try {
      val client: SmsRetrieverClient = SmsRetriever.getClient(reactContext)
      val task = client.startSmsRetriever()

      task.addOnSuccessListener {
        Log.d(TAG, "SMS Retriever started successfully")
        registerBroadcastReceiver()
        isListening = true
        Log.d(TAG, "SMS listener is now active and waiting for SMS...")
      }

      task.addOnFailureListener { exception ->
        Log.e(TAG, "Failed to start SMS Retriever: ${exception.message}", exception)
        handleError(SMSErrorType.SERVICE_UNAVAILABLE, "Failed to start SMS Retriever: ${exception.message}")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Exception starting SMS listener", e)
      handleError(SMSErrorType.UNKNOWN_ERROR, "Exception starting SMS listener: ${e.message}")
    }
  }

  private fun registerBroadcastReceiver() {
    if (!isRegistered) {
      try {
        val intentFilter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
          // Android 13+ (API 33) — new overload that requires flags
          ContextCompat.registerReceiver(
            reactContext,
            smsBroadcastReceiver,
            intentFilter,
            ContextCompat.RECEIVER_EXPORTED
          )
        } else {
          // For Android 12 and below
          ContextCompat.registerReceiver(
            reactContext,
            smsBroadcastReceiver,
            intentFilter,
            ContextCompat.RECEIVER_NOT_EXPORTED
          )
        }
        isRegistered = true
        Log.d(TAG, "SMS BroadcastReceiver registered successfully")
      } catch (e: Exception) {
        Log.e(TAG, "Failed to register SMS BroadcastReceiver", e)
        handleError(SMSErrorType.UNKNOWN_ERROR, "Failed to register SMS receiver: ${e.message}")
      }
    }
  }

   fun stopSMSListener() {
    Log.d(TAG, "Stopping SMS listener...")

    try {
      if (isRegistered) {
        reactContext.unregisterReceiver(smsBroadcastReceiver)
        isRegistered = false
        Log.d(TAG, "SMS BroadcastReceiver unregistered successfully")
      }
    } catch (e: IllegalArgumentException) {
      Log.w(TAG, "SMS BroadcastReceiver was not registered: ${e.message}")
    } catch (e: Exception) {
      Log.e(TAG, "Error unregistering SMS BroadcastReceiver", e)
    } finally {
      cleanup()
      Log.d(TAG, "SMS listener stopped")
    }
  }


   fun getAppHash(promise: Promise) {
    try {
      Log.d(TAG, "Getting app hash...")
      val appSignatureHelper = AppSignatureHelper(reactContext)
      val appHashes = appSignatureHelper.getAppSignatures()

      if (appHashes.isEmpty()) {
        Log.w(TAG, "No app signatures found")
        promise.reject("NO_SIGNATURES", "No app signatures found")
        return
      }

      val primaryHash = appHashes.first()
      Log.d(TAG, "App hash retrieved successfully: $primaryHash")
      promise.resolve(primaryHash)
    } catch (e: Exception) {
      Log.e(TAG, "Error getting app hash", e)
      promise.reject("HASH_ERROR", "Failed to get app hash: ${e.message}")
    }
  }

  // Implement the abstract method from the generated spec
   fun getStatus(promise: Promise) {
    try {
      val statusMap = Arguments.createMap().apply {
        putBoolean("isListening", isListening)
        putBoolean("isRegistered", isRegistered)
      }
      promise.resolve(statusMap)
    } catch (e: Exception) {
      Log.e(TAG, "Error getting status", e)
      promise.reject("STATUS_ERROR", "Failed to get status: ${e.message}")
    }
  }

}
