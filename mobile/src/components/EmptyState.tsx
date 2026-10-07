/**
 * حالت خالی
 * وقتی لیست خالیه به کاربر میگه چیکار کنه، نه فقط «خالیه».
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}

export function EmptyState({ icon, title, body }: Props) {
  const { palette } = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={palette.textMuted} />
      <Text style={[typography.heading, { color: palette.text, textAlign: 'center' }]}>{title}</Text>
      <Text style={[typography.body, { color: palette.textMuted, textAlign: 'center' }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingTop: 80 },
});
