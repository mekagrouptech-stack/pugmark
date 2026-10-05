/**
 * Login — Refined Indigo design system
 * Gradient hero with atmospheric orbs and a floating glass card.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Gradients, Radius, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { loginSchema } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';

interface LoginFormData {
  email: string;
  password: string;
}

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    }
  };

  if (isLoading) {
    return <Loading message="Signing you in..." />;
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Atmospheric orbs */}
      <View style={[styles.orb, styles.orbA]} />
      <View style={[styles.orb, styles.orbB]} />
      <View style={[styles.orb, styles.orbC]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.brand}>
            <View style={styles.logoChip}>
              <Image
                source={require('../../assets/images/logo.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>HRMS</Text>
            <Text style={styles.brandSubtitle}>Human Resource Management</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInDown.delay(140).duration(600)}
            style={[styles.card, { backgroundColor: colors.surface }, Shadows.lifted]}
          >
            <Text style={[styles.welcome, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>
              Sign in to continue to your workspace
            </Text>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@company.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry={!showPassword}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
                    rightIcon={
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.textMuted}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                )}
              />

              <Button
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                size="large"
                fullWidth
                loading={isLoading}
                style={styles.loginButton}
                icon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
              />

              <Button
                title="Forgot password?"
                onPress={() => router.push('/(auth)/forgot-password')}
                variant="ghost"
                fullWidth
              />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeIn.delay(400)} style={styles.footer}>
            Powered by Pugmark · Secure sign-in
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#4338CA' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 48,
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.16 },
  orbA: {
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: '#A78BFA',
    top: -width * 0.4,
    right: -width * 0.3,
  },
  orbB: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: '#38BDF8',
    bottom: -width * 0.25,
    left: -width * 0.3,
  },
  orbC: {
    width: width * 0.45,
    height: width * 0.45,
    backgroundColor: '#F0ABFC',
    top: width * 0.5,
    left: -width * 0.2,
    opacity: 0.1,
  },
  brand: { alignItems: 'center', marginBottom: 28 },
  logoChip: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lifted,
  },
  logo: { width: 62, height: 62, borderRadius: 14 },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 18,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13.5,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: Radius.xxl,
    padding: 24,
    paddingTop: 26,
  },
  welcome: { fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  welcomeSub: { fontSize: 14, marginTop: 4 },
  form: { marginTop: 22 },
  loginButton: { marginTop: 6, marginBottom: 4 },
  footer: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 26,
    letterSpacing: 0.3,
  },
});
