---
description: Build the Android application using EAS
---

1. Ensure you are logged in to EAS
   // turbo
2. Run the build command for Android (Preview)

```bash
npx eas-cli build --platform android --profile preview
```

If you want a production build (AAB for Play Store), use:

```bash
npx eas-cli build --platform android --profile production
```
