const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-voice',
  'voice',
  'android',
  'build.gradle',
);

if (!fs.existsSync(buildGradlePath)) {
  process.exit(0);
}

const patchedContents = `apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
  return rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

repositories {
  google()
  mavenCentral()
}

android {
  namespace "com.wenkesj.voice"
  compileSdk safeExtGet('compileSdkVersion', 36)

  defaultConfig {
    minSdkVersion safeExtGet('minSdkVersion', 24)
    targetSdkVersion safeExtGet('targetSdkVersion', 35)
    versionCode 1
    versionName "1.0"
  }

  compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
  }

  buildTypes {
    release {
      minifyEnabled false
    }
  }
}

dependencies {
  implementation fileTree(dir: 'libs', include: ['*.jar'])
  implementation "androidx.appcompat:appcompat:1.7.0"
  implementation "com.facebook.react:react-android"
}
`;

const currentContents = fs.readFileSync(buildGradlePath, 'utf8');

if (currentContents !== patchedContents) {
  fs.writeFileSync(buildGradlePath, patchedContents);
}
