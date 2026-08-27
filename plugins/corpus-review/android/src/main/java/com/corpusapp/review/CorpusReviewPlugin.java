package com.corpusapp.review;

import android.app.Activity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;
import com.google.android.play.core.tasks.Task;

// In-App Review via Play's ReviewManager. Play rate-limits this and
// never tells you whether the dialog actually appeared — the launch
// flow's completion listener fires on either "shown" or "silently
// suppressed". We resolve "requested: true" as long as launchReviewFlow
// completed, and let the JS side advance regardless. Any failure at the
// requestReviewFlow step (Play not available, non-Play install, etc.)
// resolves "requested: false" so the JS side can fall back to the store
// URL if it chooses to.
@CapacitorPlugin(name = "CorpusReview")
public class CorpusReviewPlugin extends Plugin {

    @PluginMethod
    public void requestReview(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("no activity");
            return;
        }
        ReviewManager manager = ReviewManagerFactory.create(activity);
        Task<ReviewInfo> request = manager.requestReviewFlow();
        request.addOnCompleteListener(task -> {
            if (!task.isSuccessful()) {
                JSObject ret = new JSObject();
                ret.put("requested", false);
                call.resolve(ret);
                return;
            }
            ReviewInfo reviewInfo = task.getResult();
            Task<Void> flow = manager.launchReviewFlow(activity, reviewInfo);
            flow.addOnCompleteListener(t -> {
                JSObject ret = new JSObject();
                ret.put("requested", true);
                call.resolve(ret);
            });
        });
    }
}
