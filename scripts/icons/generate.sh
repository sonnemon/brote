#!/bin/sh
# Regenerates the Brote "Orbe terrario" icon set into assets/icons (macOS, needs Xcode's swiftc).
set -e
cd "$(dirname "$0")"
OUT=../../assets/icons
TMP=$(mktemp -d)
swiftc -O terrario.swift -o "$TMP/terrario"
swiftc -O sheet.swift -o "$TMP/sheet"
T="$TMP/terrario"
mkdir -p "$OUT"
$T $OUT/ios-light.png 1024 4 6 92 full
$T $OUT/ios-dark.png 1024 4 6 92 dark
$T $OUT/ios-tinted.png 1024 4 6 92 tinted
$T $OUT/android-legacy.png 1024 4 6 92 full
$T $OUT/play-store.png 512 4 6 92 full
$T $OUT/android-foreground.png 512 -5 -5 110 splash
$T $OUT/android-background.png 512 -5 -5 110 bg
$T $OUT/android-monochrome.png 512 -5 -5 110 mono
$T $OUT/notification.png 96 14 14 72 mono
$T $OUT/splash.png 1024 14 12 72 splash
$T $OUT/favicon.png 48 12 12 76 simple
$T $OUT/logo.png 384 14 12 72 splash
"$TMP/sheet" "$OUT" "$OUT/_preview.png"
rm -rf "$TMP"
