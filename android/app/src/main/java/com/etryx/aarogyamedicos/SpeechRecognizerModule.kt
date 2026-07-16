package com.etryx.aarogyamedicos

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognizerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var speechRecognizer: SpeechRecognizer? = null

  override fun getName(): String = "SpeechRecognizerModule"

  @ReactMethod
  fun startListening(locale: String) {
    val activity = reactContext.currentActivity ?: return

    activity.runOnUiThread {
      speechRecognizer?.destroy()
      speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)

      val intent =
        Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
          putExtra(
            RecognizerIntent.EXTRA_LANGUAGE_MODEL,
            RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
          )
          putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
          putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
          putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

      speechRecognizer?.setRecognitionListener(
        object : RecognitionListener {
          override fun onReadyForSpeech(params: Bundle?) {
            sendEvent("onSpeechStart", null)
          }

          override fun onBeginningOfSpeech() {}

          override fun onRmsChanged(rmsdB: Float) {}

          override fun onBufferReceived(buffer: ByteArray?) {}

          override fun onEndOfSpeech() {
            sendEvent("onSpeechEnd", null)
          }

          override fun onError(error: Int) {
            val map = Arguments.createMap()
            map.putInt("error", error)
            map.putString("message", "Speech recognition failed with code $error")
            sendEvent("onSpeechError", map)
          }

          override fun onResults(results: Bundle?) {
            val matches =
              results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (!matches.isNullOrEmpty()) {
              val map = Arguments.createMap()
              map.putString("value", matches[0])
              sendEvent("onSpeechResults", map)
            }
          }

          override fun onPartialResults(partialResults: Bundle?) {
            val matches =
              partialResults?.getStringArrayList(
                SpeechRecognizer.RESULTS_RECOGNITION,
              )
            if (!matches.isNullOrEmpty()) {
              val map = Arguments.createMap()
              map.putString("value", matches[0])
              sendEvent("onSpeechPartialResults", map)
            }
          }

          override fun onEvent(eventType: Int, params: Bundle?) {}
        },
      )

      speechRecognizer?.startListening(intent)
    }
  }

  @ReactMethod
  fun stopListening() {
    reactContext.currentActivity?.runOnUiThread {
      speechRecognizer?.stopListening()
    }
  }

  @ReactMethod
  fun destroy() {
    reactContext.currentActivity?.runOnUiThread {
      speechRecognizer?.destroy()
      speechRecognizer = null
    }
  }

  private fun sendEvent(eventName: String, params: WritableMap?) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}
}
