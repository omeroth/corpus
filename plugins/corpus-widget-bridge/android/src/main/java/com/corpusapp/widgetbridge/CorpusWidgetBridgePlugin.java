package com.corpusapp.widgetbridge;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Phase 1 Android stub.
 *
 * Writes the same JSON blob to SharedPreferences under the same key the
 * iOS side uses, so the data layer is in place for Phase 3 (Android
 * widget) without needing another JS-side change. Does NOT broadcast
 * a widget-provider update yet — there is no provider yet. Phase 3
 * adds the AppWidgetProvider class and the broadcast call here.
 *
 * The storage key and SharedPreferences name are deliberately
 * matched to the iOS App Group suite + key naming so a future
 * cross-platform reader (e.g. instrumentation test) can read the
 * same shape on both platforms.
 */
@CapacitorPlugin(name = "CorpusWidgetBridge")
public class CorpusWidgetBridgePlugin extends Plugin {

    private static final String PREFS_NAME  = "group.com.corpusapp.corpus.shared";
    private static final String STORAGE_KEY = "corpus.widget";

    @PluginMethod
    public void setData(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("setData requires a `json` string argument");
            return;
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(STORAGE_KEY, json).apply();

        // Phase 3: AppWidgetManager.getInstance(context).notifyAppWidgetViewDataChanged(ids, R.id.list)
        //          + sendBroadcast(new Intent(context, CorpusWidgetProvider.class)
        //                            .setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE))
        //          to force a redraw. No-op in Phase 1 — no provider exists.

        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("bytes", json.getBytes().length);
        call.resolve(result);
    }

    /**
     * Phase 3 placeholder. No Android widget provider exists yet, so
     * nothing is ever installed and the platform is "not supported"
     * from this plugin's point of view. The JS gate reads supported
     * now (rather than UA-sniffing iOS 17); on Android we return
     * supported:false so the gate skips the whole prompt flow.
     */
    @PluginMethod
    public void isWidgetInstalled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("installed", false);
        result.put("supported", false);
        call.resolve(result);
    }

    /**
     * Phase 3 placeholder. PiP video + AVPlayerLooper are iOS-only;
     * on Android there's no equivalent tutorial surface at this
     * stage. Returning supported:false lets the JS gate skip the
     * tutorial card entirely.
     */
    @PluginMethod
    public void startTutorial(PluginCall call) {
        JSObject result = new JSObject();
        result.put("started", false);
        result.put("supported", false);
        call.resolve(result);
    }

    /**
     * Phase 3 placeholder. Symmetric with startTutorial — no-op
     * resolve so the JS layer's try/catch stays clean.
     */
    @PluginMethod
    public void stopTutorial(PluginCall call) {
        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }
}
