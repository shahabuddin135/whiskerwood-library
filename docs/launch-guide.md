# Launch guide: from your computer to the app stores

A plain-language, step-by-step guide to testing Whiskerwood Library on a phone, publishing it on
Google Play and the Apple App Store, and earning money from ads. It's written for a first-time
mobile developer.

**What it costs**

| What | Price | Needed for |
|---|---|---|
| Google Play developer account | $25, once | Android |
| Apple Developer Program | $99 a year | iPhone |
| AdMob (ads) | Free | Earning money |
| A Mac with Xcode | Borrow or rent one | iPhone only |

---

## 1. The package ID

It's your app's permanent, unique name inside the app stores. Players never see it, but it's how
Google and Apple tell your app apart from every other app.

- **Yours right now:** `com.whiskerwood.library`.
- **You choose it yourself.** There's nothing to find or register. By convention it's your website
  written backwards, plus the app name. For WeWise Labs, something like `com.wewiselabs.whiskerwood`.
- **Once you upload your first build to a store, it can never change.** Decide before that.
- On iPhone the same thing is called the **Bundle ID**. Use the same text.

To change it, update all of these places (before your first upload):

| File | What to change |
|---|---|
| `capacitor.config.json` | `"appId"` |
| `android/app/build.gradle` | `namespace` and `applicationId` |
| `android/app/src/main/res/values/strings.xml` | `package_name` and `custom_url_scheme` |
| `android/app/src/main/java/com/whiskerwood/library/MainActivity.java` | The `package` line at the top, and move the file into matching folders (for example `java/com/wewiselabs/whiskerwood/`) |
| `site/site.config.json` | `"packageId"` |

Then run `npx cap sync android`.

---

## 2. Test on your phone (no store needed)

### Android

1. Run `npm run android:apk`.
2. Copy `android/app/build/outputs/apk/debug/app-debug.apk` to your phone (by USB cable, Google
   Drive, or email to yourself).
3. Tap the file on your phone. When it warns you, allow "install unknown apps".
4. You can send this same file to friends so they can test too.

### iPhone

There's no file you can just send. You need a Mac (see section 5), and then you use Apple's free
**TestFlight** app to invite testers by email or link.

---

## 3. Android: publish on Google Play

1. **Make a Google Play developer account** at [play.google.com/console](https://play.google.com/console).
   It costs **$25, once**, and asks for a photo of your ID.

2. **Make your upload key.** This is a password-protected file that proves future updates come from
   you. **Back up the file and both passwords somewhere safe.** If you lose them, you can't update
   your game.
   - Run this command in the project folder. It asks you to choose passwords and type your name:
     ```bash
     keytool -genkeypair -v -keystore android/whiskerwood-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
     ```
     If your computer says it can't find `keytool`, use the full path instead:
     `D:\Java\jdk-21.0.12.1+1\bin\keytool`.
   - Create a file called `android/keystore.properties` containing these four lines, with your
     own passwords:
     ```
     storeFile=../whiskerwood-upload.jks
     storePassword=YOUR_PASSWORD
     keyAlias=upload
     keyPassword=YOUR_PASSWORD
     ```
     This file is kept out of git on purpose. Never share it.

3. **Before every upload:**
   - Raise `versionCode` by one (for example 2 → 3) in `android/app/build.gradle`. Google refuses
     an upload with a number it has already seen.
   - Make sure `devTools: false` is set in `src/config.js`.

4. **Build the store file:** run `npm run android:release`. You get
   `android/app/build/outputs/bundle/release/app-release.aab`, the file format Google Play asks
   for.

5. **In Play Console:**
   - Click **Create app**, then fill in the store listing. The text is ready in
     `docs/store-listing.md` and the pictures are in `docs/store/`.
   - Fill in the **App content** forms (ads, age rating, data safety and so on). Suggested answers
     are in `docs/store-listing.md`. For the privacy policy, use your website's `/privacy` page.
   - Upload the `.aab` to **Internal testing** and try it on your own phone.

6. **Closed test (new personal accounts only):** at least **12 people** must keep the game
   installed for **14 days** in a row before Google lets you go public. Friends and family are
   fine.

7. **Go public:** move the game to **Production** and submit it for review. It usually takes a few
   days, then you're live.

---

## 4. Earning money: AdMob

This works the same for Android and iPhone. Until you add your own IDs, the game uses Google's
test ads, which earn nothing.

1. Sign up at [admob.google.com](https://admob.google.com). It's free; use the same Google account
   as Play Console.

2. Click **Add app**, choose **Android**, and say it isn't published yet.

3. Create **two ad units**:
   - **Rewarded:** the optional "watch for a bonus" ads.
   - **Interstitial:** the occasional full-screen ad between play.

4. **Put your IDs into the game:**
   - **App ID** (it contains a `~`): paste it into
     `android/app/src/main/AndroidManifest.xml`, in the `android:value` next to
     `com.google.android.gms.ads.APPLICATION_ID`. Also paste it into `src/config.js` at
     `ads → admob → android → appId`.
   - **Ad unit IDs** (they contain a `/`): paste them into `src/config.js` at
     `ads → admob → android → rewarded` and `interstitial`.
   - In `src/config.js`, change `testing: true` to `testing: false`.

5. **Prove the ads are yours:** put your **publisher ID** (it starts with `pub-`) into
   `site/site.config.json` as `"admobPublisherId"`, then redeploy the website. AdMob looks for it
   there.

6. **Consent popup:** under **Privacy & messaging**, turn on the European consent message. The game
   already shows it automatically where the law requires it.

7. **Getting paid:** under **Payments**, add your tax information and bank account. AdMob pays once
   a month after you've earned about $100.

8. **Never tap real ads on your own phone.** Google can ban your account for that. Add your phone as
   a **test device** in AdMob's settings.

Real ads only start showing after the game is live on the store and AdMob has reviewed it. That can
take a few days.

---

## 5. iPhone: publish on the App Store

1. **You need a Mac** with the free **Xcode** app from the Mac App Store. Apple doesn't allow
   building iPhone apps on Windows, so borrow or rent a Mac for this part.

2. **Join the Apple Developer Program** at
   [developer.apple.com](https://developer.apple.com/programs/). It costs **$99 a year**.

3. **Create the iPhone project.** On the Mac, copy the project, then run each of these, one at a
   time:
   ```bash
   npm install
   npm run build
   npx cap add ios
   npx cap sync ios
   npx cap open ios
   ```
   The last one opens the project in Xcode.

4. **In Xcode:**
   - Under **Signing**, pick your Apple developer account as the **Team**.
   - Set the **Bundle ID** to your package ID.
   - Under **Supported Destinations**, keep **iPhone** only. Otherwise Apple also asks for iPad
     screenshots.

5. **iPhone ads:** in AdMob, create a separate **iOS app** with its own two ad units (as in
   section 4). Then:
   - Paste the iOS IDs into `src/config.js`, under `ads → admob → ios`.
   - Add three settings to `ios/App/App/Info.plist`:
     - `GADApplicationIdentifier`: your iOS AdMob App ID.
     - `SKAdNetworkItems`: the list from Google's AdMob iOS setup guide.
     - `NSUserTrackingUsageDescription`: the sentence shown when the game asks permission for
       personalised ads, for example "Your data will be used to show you relevant ads."
   - Run `npx cap sync ios` again.

6. **Test:**
   - On your own iPhone: plug it in, choose it at the top of Xcode, and press ▶.
   - For other testers, use **TestFlight** (step 8).

7. **In [App Store Connect](https://appstoreconnect.apple.com):**
   - Create the app with the same Bundle ID.
   - Add screenshots, a description, an age rating, and answer the privacy questions (the game
     uses Google AdMob, as described on your `/privacy` page).
   - When asked about encryption, answer **No**. The game only uses the standard secure web
     connection that every app has.

8. **Send it:**
   - In Xcode choose **Product → Archive**, then **Distribute App → App Store Connect**.
   - The build appears in **TestFlight** after a few minutes. Invite testers there if you like.
   - When you're happy, submit it for review. That usually takes 1–3 days.

---

## 6. What the game is built with

- **The game:** plain JavaScript drawing on a web canvas, built with a tool called **Vite**.
- **Turning it into apps:** **Capacitor** wraps the same game into real Android and iPhone apps,
  and adds phone features like ads, notifications and vibration.
- **The website:** static pages hosted on **Vercel**.

**Is it a normal choice?** Yes, it's a sensible choice for a game like this:

- One set of code runs on the web, Android and iPhone.
- The app is small (about 11 MB).
- Changes are quick to make.

The biggest game studios mostly use engines like **Unity** or **Godot**. Those shine for 3D, heavy
physics or big action games. For a cozy 2D idle game, this setup is lighter, simpler, and has
everything the game needs. The trade-off is that the game runs on its own custom code rather than a
ready-made game editor, but that code is already tuned to run smoothly.

---

## Quick checklist before each store release

- [ ] `devTools: false` in `src/config.js`
- [ ] Real AdMob IDs pasted in, and `testing: false`
- [ ] `versionCode` raised in `android/app/build.gradle`
- [ ] Upload key and `keystore.properties` present (and backed up)
- [ ] Website live, with the privacy policy and `app-ads.txt` working
- [ ] Tested the new build on your own phone first
