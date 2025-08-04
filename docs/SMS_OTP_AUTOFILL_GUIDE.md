# SMS OTP Autofill Implementation Guide

This guide explains how SMS OTP autofill has been implemented in the Faith Flow UI app and what the backend needs to support it.

## Features Implemented

### 1. Web OTP API (Android)
- Automatically detects and fills SMS verification codes on Android Chrome
- Works on Chrome 84+ and Edge 84+
- Requires specific SMS format (see below)

### 2. iOS Autofill
- Uses native iOS SMS autofill functionality
- Works automatically when SMS contains a verification code
- Triggered by clicking on OTP input fields

### 3. Fallback Manual Entry
- Custom keypad for manual OTP entry
- Auto-verifies when all 6 digits are entered

## Backend Requirements

### SMS Format for Web OTP API

The SMS message MUST follow this exact format for Web OTP API to work:

```
Your Faith Flow verification code is: 123456

@faithflow.com #123456
```

Key requirements:
1. The last line must start with `@` followed by your domain
2. A space after the domain
3. `#` followed by the OTP code
4. The domain in the SMS must match the domain where the app is hosted

Example implementation:
```javascript
// Backend SMS template
const smsMessage = `Your Faith Flow verification code is: ${otpCode}

@${yourDomain} #${otpCode}`;
```

### SMS Format for iOS

iOS is more flexible and will detect most 6-digit codes automatically. However, including phrases like "verification code" or "code" helps iOS recognize it better.

## How It Works

### 1. User Flow
1. User enters phone number
2. Backend sends SMS with verification code
3. App automatically detects the SMS (if supported)
4. Code is auto-filled and verified

### 2. Technical Implementation

#### Frontend Components:
- **OtpService**: Handles Web OTP API and SMS detection
- **LoginComponent**: Updated with autofill support
- Hidden input with `autocomplete="one-time-code"` for iOS
- Visual OTP display that users can click to trigger iOS autofill

#### Key Features:
- Automatic detection on supported browsers
- Click-to-focus for iOS devices
- Visual indicator when autofill is available
- Graceful fallback to manual entry

### 3. Platform Support

| Platform | Method | Requirements |
|----------|--------|--------------|
| Android Chrome | Web OTP API | Chrome 84+, proper SMS format |
| Android Edge | Web OTP API | Edge 84+, proper SMS format |
| iOS Safari | Native autofill | iOS 12+, any SMS with 6-digit code |
| iOS Chrome | Native autofill | iOS 12+, any SMS with 6-digit code |
| Other | Manual entry | Universal fallback |

## Testing

### Android Testing:
1. Deploy app to HTTPS domain
2. Send SMS in correct format with matching domain
3. OTP should auto-fill when SMS arrives

### iOS Testing:
1. Click on OTP display area
2. iOS keyboard appears with code suggestion
3. Tap suggestion to auto-fill

## Security Considerations

1. **Domain Verification**: Web OTP API only works on HTTPS domains
2. **One-time Use**: Each OTP request creates a new listener
3. **Timeout**: Consider adding timeout to OTP validity
4. **Rate Limiting**: Implement rate limiting on OTP requests

## Troubleshooting

### Web OTP Not Working:
- Check SMS format matches exactly
- Verify domain in SMS matches app domain
- Ensure HTTPS is used
- Check browser console for errors

### iOS Autofill Not Working:
- Ensure iOS 12+ is used
- Check that SMS contains recognizable code pattern
- Try tapping the OTP display area

## Future Enhancements

1. **SMS Retriever API**: For native Android apps via Capacitor plugin
2. **Biometric Verification**: Add fingerprint/face ID after SMS verification
3. **Backup Codes**: Provide backup codes for users without SMS access
4. **Email OTP**: Alternative verification method