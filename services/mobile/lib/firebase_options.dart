// Trax Firebase options — trax-ae (same project as Next.js web).
// Generated for mobile; keep in sync with web NEXT_PUBLIC_FIREBASE_*.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return web;
      default:
        return android;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAn53rxOqZzUMmcnDqsRrc7RCj-W2jb46o',
    appId: '1:651185247129:web:75c1a8bfd7821ca89ef908',
    messagingSenderId: '651185247129',
    projectId: 'trax-ae',
    authDomain: 'trax-ae.firebaseapp.com',
    storageBucket: 'trax-ae.firebasestorage.app',
    measurementId: 'G-QD1KMM7KTF',
  );

  /// Android uses the web app id until a dedicated Android app is registered
  /// in Firebase Console (then drop google-services.json + update appId).
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAn53rxOqZzUMmcnDqsRrc7RCj-W2jb46o',
    appId: '1:651185247129:web:75c1a8bfd7821ca89ef908',
    messagingSenderId: '651185247129',
    projectId: 'trax-ae',
    authDomain: 'trax-ae.firebaseapp.com',
    storageBucket: 'trax-ae.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAn53rxOqZzUMmcnDqsRrc7RCj-W2jb46o',
    appId: '1:651185247129:web:75c1a8bfd7821ca89ef908',
    messagingSenderId: '651185247129',
    projectId: 'trax-ae',
    authDomain: 'trax-ae.firebaseapp.com',
    storageBucket: 'trax-ae.firebasestorage.app',
    iosBundleId: 'com.trax.employee',
  );
}
