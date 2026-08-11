import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme, fonts } from '../theme/useTheme';
import { useSessionStore } from '../store/sessionStore';
import { useSyncStore } from '../sync/syncService';
import { authApi } from '../api/auth';
import { isBackendConfigured } from '../api/client';
import { Alert } from 'react-native';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const session = useSessionStore((s) => s.session);
  const login = useSessionStore((s) => s.login);
  const register = useSessionStore((s) => s.register);
  const logout = useSessionStore((s) => s.logout);

  const syncStatus = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncNow = useSyncStore((s) => s.syncNow);
  const [isSyncing, setIsSyncing] = useState(false);

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsSyncing(false);
    }
  }

  function handleSignOutEverywhere() {
    Alert.alert(
      'Sign out on all devices?',
      'Every device signed into this account will be signed out, including this one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out everywhere',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.logoutAll();
            } finally {
              // Even if the call failed, dropping the local tokens is the safer end state.
              logout();
            }
          },
        },
      ],
    );
  }

  const syncLine =
    syncStatus === 'offline'
      ? "Can't reach the server — your challenges are safe on this device and will sync later."
      : lastSyncedAt
        ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
        : 'Not synced yet';

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Settings</Text>

      {!isBackendConfigured() ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>THIS DEVICE</Text>
          <Text style={[styles.blurb, { color: colors.text, fontFamily: fonts.body }]}>
            Everything is stored on this phone and works without internet. This build has no server
            configured, so there are no accounts and nothing leaves the device.
          </Text>
        </View>
      ) : session ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>ACCOUNT</Text>
          <Text style={[styles.name, { color: colors.text, fontFamily: fonts.bodyBold }]}>{session.name}</Text>
          <Text style={[styles.email, { color: colors.textMuted, fontFamily: fonts.body }]}>{session.email}</Text>
          <Text style={[styles.syncLine, { color: colors.textMuted, fontFamily: fonts.body }]}>{syncLine}</Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={handleSync}
              disabled={isSyncing}
              style={[styles.actionBtn, { borderColor: colors.border, opacity: isSyncing ? 0.6 : 1 }]}
            >
              <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 13 }}>
                {isSyncing ? 'Syncing…' : 'Sync now'}
              </Text>
            </Pressable>
            <Pressable onPress={logout} style={[styles.actionBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 13 }}>Sign out</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleSignOutEverywhere} style={{ marginTop: 14 }}>
            <Text style={{ color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 13 }}>
              Sign out on all devices
            </Text>
          </Pressable>
          <Text style={[styles.syncLine, { color: colors.textMuted, fontFamily: fonts.body, marginTop: 4 }]}>
            Use this if you lose a device — it immediately invalidates every saved sign-in.
          </Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>SYNC</Text>
          <Text style={[styles.blurb, { color: colors.text, fontFamily: fonts.body }]}>
            Your challenges live on this device and work with no internet at all. Add an account and
            they also sync to the website — edit in either place and the newest change wins.
          </Text>

          <View style={{ gap: 10, marginTop: 14 }}>
            {mode === 'register' && (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text, fontFamily: fonts.body }]}
              />
            )}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text, fontFamily: fonts.body }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text, fontFamily: fonts.body }]}
            />
          </View>

          {error && <Text style={{ color: colors.danger, fontSize: 13, marginTop: 8 }}>{error}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: isSubmitting ? 0.6 : 1 }]}
          >
            <Text style={{ color: colors.accentInk, fontFamily: fonts.bodyBold, fontSize: 14 }}>
              {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 13 }}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  title: { fontSize: 24 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18 },
  label: { fontSize: 11, letterSpacing: 0.5 },
  name: { fontSize: 15, marginTop: 8 },
  email: { fontSize: 13, marginTop: 2 },
  blurb: { fontSize: 13.5, lineHeight: 20, marginTop: 8 },
  syncLine: { fontSize: 12.5, marginTop: 12, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  submitBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
