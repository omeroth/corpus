#!/bin/bash
# Cold-launch the installed app 10 times. After each launch, read the
# next-up node's final rect top + the scrollingElement's scrollTop and
# print the viewport-centre delta. Then screenshot once at the end.
set -euo pipefail
DEVICE_ID="4D519785-DA9B-449A-A558-23E25EE360C0"
BUNDLE_ID="com.corpusapp.corpus"
APP_DATA="/Users/omeroth/Library/Developer/CoreSimulator/Devices/${DEVICE_ID}/data/Containers/Data/Application/940C6DEF-E069-4B60-A3C7-6777D28CBE41"
LS_SQLITE="${APP_DATA}/Library/WebKit/com.corpusapp.corpus/WebsiteData/Default/EsClrj4xW-APC03YFHnhKDlNE3KrMTGBSDqX3tQi-bk/EsClrj4xW-APC03YFHnhKDlNE3KrMTGBSDqX3tQi-bk/LocalStorage/localstorage.sqlite3"

# This test uses Playwright because xcrun simctl can't read DOM — we
# want the actual final scrollTop + node rect, not just a screenshot.
# The simulator's native app pulls from the same www bundle, so the
# layout timing is representative.
node /Users/omeroth/CORPUS/scripts/_launch_stability_10x.mjs
