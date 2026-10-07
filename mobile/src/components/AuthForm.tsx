/**
 * فرم ورود و ثبت‌نام (یک کامپوننت برای هر دو صفحه)
 * قبل از ارسال، ایمیل و رمز تو خود اپ بررسی میشن.
 * خطاهای سرور به پیام ترجمه‌شده تبدیل میشن.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { describeError } from '@/utils/errors';
import { isStrongPassword, isValidEmail } from '@/utils/validation';
import { Button } from './Button';
import { Screen } from './Screen';
import { TextField } from './TextField';

interface Props {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: Props) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  // خطاها فقط بعد از اولین تلاش برای ارسال نشون داده میشن
  const emailError = submitted && !isValidEmail(email) ? t('errors.emailInvalid') : undefined;
  const passwordError =
    submitted && isRegister && !isStrongPassword(password) ? t('errors.passwordWeak') : undefined;

  const handleSubmit = async () => {
    setSubmitted(true);
    setFormError(null);

    const passwordOk = isRegister ? isStrongPassword(password) : password.length > 0;
    if (!isValidEmail(email) || !passwordOk) return;

    setLoading(true);
    try {
      // بعد از موفقیت، گارد مسیرها خودش کاربر رو به صفحه‌ی اصلی میبره
      await (isRegister ? signUp : signIn)(email.trim().toLowerCase(), password);
    } catch (error) {
      setFormError(describeError(error, t, mode));
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* نشان برند */}
          <View style={[styles.mark, { backgroundColor: palette.accent }]}>
            <Ionicons name="sync" size={30} color={palette.onAccent} />
          </View>

          <View style={styles.heading}>
            <Text style={[typography.title, { color: palette.text }]} accessibilityRole="header">
              {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
            </Text>
            <Text style={[typography.body, { color: palette.textMuted }]}>
              {isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
            </Text>
          </View>

          <View style={styles.fields}>
            <TextField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              inputRef={passwordRef}
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              hint={isRegister ? t('auth.passwordHint') : undefined}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              textContentType={isRegister ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              trailing={
                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={palette.textMuted} />
                </Pressable>
              }
            />
          </View>

          {formError ? (
            <Text style={[typography.body, { color: palette.danger }]} accessibilityLiveRegion="polite">
              {formError}
            </Text>
          ) : null}

          <Button
            label={isRegister ? t('auth.registerButton') : t('auth.loginButton')}
            onPress={handleSubmit}
            loading={loading}
          />

          {/* رفتن به صفحه‌ی دیگه */}
          <View style={styles.switchRow}>
            <Text style={[typography.body, { color: palette.textMuted }]}>
              {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
            </Text>
            <Pressable
              onPress={() => router.replace(isRegister ? '/login' : '/register')}
              hitSlop={10}
              accessibilityRole="link"
            >
              <Text style={[typography.bodyStrong, { color: palette.accent }]}>
                {isRegister ? t('auth.goLogin') : t('auth.goRegister')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  mark: { width: 60, height: 60, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: spacing.sm },
  fields: { gap: spacing.lg },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
});
