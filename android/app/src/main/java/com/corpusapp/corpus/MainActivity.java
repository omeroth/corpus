package com.corpusapp.corpus;

import android.os.Bundle;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Round 40 A1 — native build-time flag. Under the Debug Gradle build type
    // (BuildConfig.DEBUG == true) we expose a JavascriptInterface that the
    // early <script> block at the top of index.html queries once and
    // normalizes into window.__CORPUS_DEBUG_BUILD = true. Release builds omit
    // the interface, so the normalization short-circuits and the index.html
    // redaction block near the end of the main <script> deletes every
    // window.__corpus* / window._replay* helper. _isDevPremium() returns
    // false in Release regardless of localStorage flags. Chrome remote
    // debugging (WebView.setWebContentsDebuggingEnabled) stays off in
    // Release — Capacitor's default. The native flag is the belt; the
    // debugger lock is the braces.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (BuildConfig.DEBUG) {
            bridge.getWebView().addJavascriptInterface(
                new CorpusDebugBridge(),
                "__CORPUS_DEBUG_BRIDGE_ANDROID"
            );
        }
    }

    private static class CorpusDebugBridge {
        @JavascriptInterface
        public boolean isDebug() {
            return true;
        }
    }
}
