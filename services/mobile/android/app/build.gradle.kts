plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

import java.util.Properties
import java.io.FileInputStream

android {
    // Must match Firebase Android app package_name in google-services.json
    namespace = "trax.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "trax.app"
        minSdk = maxOf(flutter.minSdkVersion, 24)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    signingConfigs {
        // Prefer env PLAY_KEYSTORE_*; else android/key.properties (local, gitignored).
        create("release") {
            val keystorePropertiesFile = rootProject.file("key.properties")
            val keystoreProperties = Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))
            }

            val ksPath = System.getenv("PLAY_KEYSTORE_PATH")
                ?: keystoreProperties.getProperty("storeFile")
            val storePass = System.getenv("PLAY_KEYSTORE_PASSWORD")
                ?: keystoreProperties.getProperty("storePassword")
            val alias = System.getenv("PLAY_KEY_ALIAS")
                ?: keystoreProperties.getProperty("keyAlias")
            val keyPass = System.getenv("PLAY_KEY_PASSWORD")
                ?: keystoreProperties.getProperty("keyPassword")

            if (ksPath != null && storePass != null && alias != null && keyPass != null) {
                val ksFile = file(ksPath)
                if (ksFile.isAbsolute) {
                    storeFile = ksFile
                } else {
                    storeFile = rootProject.file(ksPath)
                }
                storePassword = storePass
                keyAlias = alias
                keyPassword = keyPass
            }
        }
    }

    buildTypes {
        release {
            val hasReleaseSigning = signingConfigs.getByName("release").storeFile != null
            signingConfig = if (hasReleaseSigning) {
                signingConfigs.getByName("release")
            } else {
                // Local smoke only — Play upload requires real upload keystore.
                signingConfigs.getByName("debug")
            }
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
    // Firebase BoM — Analytics (and others via Flutter plugins). Versions from BoM.
    implementation(platform("com.google.firebase:firebase-bom:34.17.0"))
    implementation("com.google.firebase:firebase-analytics")
}
