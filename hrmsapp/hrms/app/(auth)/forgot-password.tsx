/**
 * Forgot Password Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await authService.forgotPassword(data);
      Alert.alert(
        'Email Sent',
        'Please check your email for password reset instructions.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.tint} />
          <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={colors.icon} />}
              />
            )}
          />

          <Button
            title="Send Reset Link"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            fullWidth
            loading={isLoading}
            style={styles.submitButton}
          />

          <Button
            title="Back to Login"
            onPress={() => router.back()}
            variant="outline"
            fullWidth
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
  },
});
