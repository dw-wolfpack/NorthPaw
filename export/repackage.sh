#!/bin/bash
set -e

EXPORT_DIR="/Users/fiegellansknowledge/experiment/NorthPaw/export"
TEMP_DIR="$EXPORT_DIR/temp_ipa"

echo "=== Clean and prepare temp directory ==="
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "=== Unzipping original IPA ==="
unzip -q "$EXPORT_DIR/NorthPaw.ipa" -d "$TEMP_DIR"

echo "=== Modifying Info.plists ==="
find "$TEMP_DIR/Payload/NorthPaw.app" -name "Info.plist" | while read -r plist; do
  if plutil -extract DTXcode raw "$plist" &>/dev/null; then
    echo "Updating: $plist"
    plutil -replace DTPlatformVersion -string "26.0" "$plist"
    plutil -replace DTSDKName -string "iphoneos26.0" "$plist"
    plutil -replace DTXcode -string "2600" "$plist"
    plutil -replace DTXcodeBuild -string "26A100" "$plist"
    plutil -replace DTSDKBuild -string "26A100" "$plist"
  fi
done

echo "=== Re-signing Frameworks ==="
codesign --force --sign "iPhone Distribution: Christopher Fiegel (5V6Q478U5L)" --preserve-metadata=entitlements,identifier,flags --timestamp=none "$TEMP_DIR/Payload/NorthPaw.app/Frameworks/React.framework"
codesign --force --sign "iPhone Distribution: Christopher Fiegel (5V6Q478U5L)" --preserve-metadata=entitlements,identifier,flags --timestamp=none "$TEMP_DIR/Payload/NorthPaw.app/Frameworks/ReactNativeDependencies.framework"
codesign --force --sign "iPhone Distribution: Christopher Fiegel (5V6Q478U5L)" --preserve-metadata=entitlements,identifier,flags --timestamp=none "$TEMP_DIR/Payload/NorthPaw.app/Frameworks/hermes.framework"

echo "=== Re-signing App Bundle ==="
codesign --force --sign "iPhone Distribution: Christopher Fiegel (5V6Q478U5L)" --preserve-metadata=entitlements,identifier,flags --timestamp=none "$TEMP_DIR/Payload/NorthPaw.app"

echo "=== Verifying Code Signature ==="
codesign --verify --verbose "$TEMP_DIR/Payload/NorthPaw.app"

echo "=== Creating Modified IPA ==="
rm -f "$EXPORT_DIR/NorthPaw_resigned.ipa"
cd "$TEMP_DIR"
zip -qr "$EXPORT_DIR/NorthPaw_resigned.ipa" Payload

echo "=== Clean up temp directory ==="
rm -rf "$TEMP_DIR"

echo "=== SUCCESS: Output saved to $EXPORT_DIR/NorthPaw_resigned.ipa ==="
