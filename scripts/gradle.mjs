// Runs the Android Gradle wrapper on any OS (gradlew.bat on Windows, ./gradlew elsewhere).
// Usage: node scripts/gradle.mjs <task...>   e.g. node scripts/gradle.mjs assembleDebug
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const android = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'android');
const tasks = process.argv.slice(2);
if (!tasks.length) { console.error('Usage: node scripts/gradle.mjs <task>'); process.exit(1); }

// Gradle needs to know where the Android SDK is: use ANDROID_HOME, or the default install location.
const props = path.join(android, 'local.properties');
if (!fs.existsSync(props) && !process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  const guess = process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')
    : process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Android', 'sdk') : path.join(os.homedir(), 'Android', 'Sdk');
  if (fs.existsSync(guess)) {
    fs.writeFileSync(props, `sdk.dir=${guess.replace(/\\/g, '\\\\')}\n`);
    console.log(`Android SDK: ${guess} (saved in android/local.properties)`);
  } else console.warn('Android SDK not found: install Android Studio, or set ANDROID_HOME.');
}

const releaseTask = tasks.some((t) => /release/i.test(t));
if (releaseTask && !fs.existsSync(path.join(android, 'keystore.properties'))) {
  console.warn('\n⚠️  No android/keystore.properties: this release build will be UNSIGNED (it will not install, and Google Play will reject it).');
  console.warn('   See "Signing" in README.md. For a quick test build, use: npm run android:apk\n');
}

// Capacitor 8 plugins compile with Java 21. Find a JDK 21+: JAVA21_HOME, JAVA_HOME, or the usual places.
const javaVersion = (home) => {
  try { const m = fs.readFileSync(path.join(home, 'release'), 'utf8').match(/JAVA_VERSION="(\d+)/); return m ? +m[1] : 0; } catch { return 0; }
};
const jdkDirs = (root) => { try { return fs.readdirSync(root).map((d) => path.join(root, d)); } catch { return []; } };
const candidates = [process.env.JAVA21_HOME, process.env.JAVA_HOME,
  ...(process.platform === 'win32'
    ? ['D:/Java', 'C:/Java', 'C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Java', 'C:/Program Files/Microsoft', 'C:/Program Files/Zulu', 'C:/Program Files/Amazon Corretto'].flatMap(jdkDirs)
      .concat(['C:/Program Files/Android/Android Studio/jbr', path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Android Studio', 'jbr')])
    : process.platform === 'darwin'
      ? jdkDirs('/Library/Java/JavaVirtualMachines').map((d) => path.join(d, 'Contents', 'Home')).concat(['/Applications/Android Studio.app/Contents/jbr/Contents/Home'])
      : jdkDirs('/usr/lib/jvm').concat([path.join(os.homedir(), 'android-studio', 'jbr')]))].filter(Boolean);
const jdk = candidates.map((h) => [h, javaVersion(h)]).filter(([, v]) => v >= 21).sort((a, b) => a[1] - b[1])[0]?.[0];
const env = { ...process.env };
const extra = [];
if (jdk) { env.JAVA_HOME = jdk; extra.push(`-Dorg.gradle.java.installations.paths=${jdk}`); console.log(`Java: ${jdk}`); }
else console.warn('⚠️  No Java 21 found. Capacitor 8 needs it: install a JDK 21 (e.g. Eclipse Temurin 21) and/or set JAVA21_HOME.');

// the wrapper by its full path (some Windows setups don't look in the current folder for commands)
const win = process.platform === 'win32';
const wrapper = path.join(android, win ? 'gradlew.bat' : 'gradlew');
const r = spawnSync(win ? `"${wrapper}"` : wrapper, [...extra, ...tasks], { cwd: android, stdio: 'inherit', shell: win, env });
process.exit(r.status ?? 1);
