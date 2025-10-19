# Clocked - iOS Build Guide

## Building for iOS

### Option 1: Build with EAS CLI (Recommended)

```bash
eas build --platform ios --profile production
```

This will build your app in the cloud and provide a download link when complete.

---

### Option 2: Build Locally with Xcode

If you need to build locally (e.g., for debugging or when credentials are problematic), follow these steps:

#### Step 1: Generate the Native iOS Project

```bash
npx expo prebuild --platform ios --clean
```

This creates the `ios/` directory with the native Xcode project.

#### Step 2: Open the Project in Xcode

```bash
open ios/Clocked.xcworkspace
```

**Important:** Always open the `.xcworkspace` file, NOT the `.xcodeproj` file (CocoaPods requirement).

#### Step 3: Configure Signing & Capabilities

1. **Wait for Xcode to finish indexing** (progress bar at top)

2. **In the left sidebar**, click on the **Clocked** project (blue icon at the top)

3. **Select the "Clocked" target** (under TARGETS, not PROJECTS)

4. **Click the "Signing & Capabilities" tab**

5. **Configure signing:**

   - **Option A - Automatic Signing (Easier):**

     - ✅ Check "Automatically manage signing"
     - Select your **Team** from the dropdown (e.g., "Noah Ross (Individual)")
     - Xcode will automatically create/download provisioning profiles

   - **Option B - Manual Signing (More Control):**
     - ❌ Uncheck "Automatically manage signing"
     - **Provisioning Profile:** Select from dropdown
     - **Signing Certificate:** Select from dropdown
     - Make sure the profile supports all capabilities (especially Push Notifications)

6. **Verify Capabilities:**
   - You should see **"Push Notifications"** in the capabilities list
   - If missing, click **"+ Capability"** and add "Push Notifications"

#### Step 4: Select Build Destination

At the top of Xcode, next to the scheme selector:

- Click the device/simulator dropdown
- Select **"Any iOS Device (arm64)"** for a real device build
- OR select a specific connected device if you have one plugged in

#### Step 5: Build & Archive

1. In the menu bar, go to **Product → Archive**

2. **Wait for the build to complete** (this can take 5-15 minutes)

   - You can monitor progress in the top status bar
   - Check for errors in the left sidebar (red icons)

3. **When archive succeeds:**
   - The **Organizer window** will open automatically
   - Your archive will be listed (sorted by date, newest first)

---

## Exporting the IPA (After Archive)

Once you have an archive:

1. **In Organizer**, select your archive

2. Click **"Distribute App"**

3. **Choose distribution method:**

   - **App Store Connect** - For submitting to the App Store
   - **Ad Hoc** - For installing on specific registered devices
   - **Enterprise** - For enterprise distribution (requires enterprise account)
   - **Development** - For testing on development devices

4. **Follow the wizard:**

   - Keep default options (unless you know what you're changing)
   - Choose where to save the IPA
   - Click **Export**

5. **IPA location:**
   - Saved to the folder you selected (usually Desktop or Downloads)
   - The folder will contain the `.ipa` file and other metadata

---

## Troubleshooting

### "Provisioning profile doesn't support Push Notifications"

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Find your App ID: `dev.noah.hackathonappoct1925`
3. Click **Edit**
4. Enable **Push Notifications** capability
5. Click **Save**
6. Delete all provisioning profiles from [Expo Dashboard](https://expo.dev)
7. Regenerate profiles or use Xcode's automatic signing

### "No signing certificate found"

- Make sure you're logged into your Apple account in Xcode
- Go to **Xcode → Settings → Accounts**
- Add your Apple ID if missing
- Click **Download Manual Profiles**

### Build Errors

- Clean build folder: **Product → Clean Build Folder** (Cmd + Shift + K)
- Delete `ios/Pods` and `ios/build` folders, then run `npx expo prebuild --platform ios --clean` again
- Make sure all dependencies are installed: `npm install`

---

## Development

### Run in Simulator

```bash
npx expo run:ios
```

### Run on Physical Device

```bash
npx expo run:ios --device
```

---

## Project Info

- **Bundle ID:** `dev.noah.hackathonappoct1925`
- **App Name:** Clocked
- **Platform:** iOS (requires macOS and Xcode)
