import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {API_URL, api} from './src/api';

const Stack = createNativeStackNavigator();
const AuthContext = createContext(null);
const ThemeContext = createContext(null);

const lightColors = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  ink: '#172033',
  muted: '#667085',
  border: '#E4E9F2',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  green: '#15803D',
  greenLight: '#ECFDF3',
  red: '#DC2626',
  redLight: '#FEF2F2',
  input: '#FAFBFD',
  chip: '#F1F4F9',
};

const darkColors = {
  background: '#0B1120',
  surface: '#151E30',
  ink: '#F3F4F6',
  muted: '#A0AEC0',
  border: '#283548',
  primary: '#A5B4FC',
  primaryLight: '#262747',
  green: '#4ADE80',
  greenLight: '#153529',
  red: '#F87171',
  redLight: '#3B2028',
  input: '#101827',
  chip: '#202A3C',
};

const createStyles = colors => ({
  page: {flex: 1, backgroundColor: colors.background},
  pageContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  content: {width: '100%', maxWidth: 700, alignSelf: 'center'},
  authContent: {justifyContent: 'center', paddingVertical: 32},
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    elevation: 3,
    shadowColor: '#172033',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
  },
  brandRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 24},
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  brandMarkText: {color: '#FFFFFF', fontSize: 17, fontWeight: '900'},
  brandEyebrow: {color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.4},
  title: {fontSize: 27, fontWeight: '800', color: colors.ink, letterSpacing: -0.5},
  subtitle: {fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 7, marginBottom: 22},
  sectionTitle: {fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 5},
  sectionSubtitle: {fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 17},
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#172033',
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
  },
  reportCard: {padding: 22},
  input: {
    width: '100%',
    minHeight: 52,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 15,
    marginBottom: 13,
    fontSize: 15,
    color: colors.ink,
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  buttonText: {fontSize: 15, fontWeight: '800'},
  buttonPrimary: {backgroundColor: colors.primary},
  buttonPrimaryText: {color: '#FFFFFF'},
  buttonSuccess: {backgroundColor: colors.greenLight},
  buttonSuccessText: {color: colors.green},
  buttonDanger: {backgroundColor: colors.redLight},
  buttonDangerText: {color: colors.red},
  buttonSecondary: {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border},
  buttonSecondaryText: {color: colors.ink},
  disabled: {opacity: 0.55},
  textButton: {paddingVertical: 12, alignItems: 'center'},
  textButtonLabel: {color: colors.primary, fontSize: 14, fontWeight: '700'},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 12},
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chip,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  chipSelected: {backgroundColor: colors.primaryLight, borderColor: '#C7D2FE'},
  chipText: {fontSize: 12, fontWeight: '700', color: colors.muted},
  chipTextSelected: {color: colors.primary},
  row: {flexDirection: 'row', alignItems: 'center'},
  spaceBetween: {justifyContent: 'space-between'},
  cardTitle: {fontSize: 16, fontWeight: '800', color: colors.ink},
  muted: {fontSize: 13, lineHeight: 19, color: colors.muted},
  small: {fontSize: 11, color: colors.muted, fontWeight: '800', letterSpacing: 0.8},
  statRow: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5},
  statCard: {
    flex: 1,
    minWidth: 145,
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  statValue: {fontSize: 23, fontWeight: '900', color: colors.ink, marginTop: 10},
  balanceCard: {backgroundColor: '#1E1B4B', borderColor: '#1E1B4B'},
  balanceLabel: {color: '#C7D2FE'},
  balanceValue: {fontSize: 29, fontWeight: '900', color: '#FFFFFF', marginTop: 9},
  businessIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  businessIconText: {fontSize: 15, fontWeight: '900', color: colors.primary},
  badge: {backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999},
  badgeText: {fontSize: 10, fontWeight: '800', color: colors.primary},
  emptyState: {alignItems: 'center', paddingVertical: 30, paddingHorizontal: 16},
  emptyMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyMarkText: {fontSize: 22, fontWeight: '800', color: colors.primary},
  emptyTitle: {fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 5},
  center: {alignItems: 'center', justifyContent: 'center', paddingVertical: 28},
  dateRow: {flexDirection: 'row', marginHorizontal: -5, marginBottom: 12},
  dateButton: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  dateButtonLabel: {fontSize: 10, fontWeight: '800', color: colors.muted, marginBottom: 6},
  dateButtonValue: {fontSize: 13, fontWeight: '700', color: colors.ink},
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 32, 51, 0.35)',
    zIndex: 10,
  },
  datePickerBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
  datePickerCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  transactionCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 10,
  },
  transactionMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionMarkText: {fontSize: 17, fontWeight: '900'},
  transactionAmount: {fontSize: 16, fontWeight: '900', textAlign: 'right'},
  transactionMeta: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13},
  transactionTag: {paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999},
  transactionTagText: {fontSize: 10, fontWeight: '800'},
  loadMore: {alignSelf: 'center', marginVertical: 6, paddingHorizontal: 16, paddingVertical: 10},
  loadMoreText: {fontSize: 13, color: colors.primary, fontWeight: '800'},
  listContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  transactionListContent: {paddingHorizontal: 12, alignItems: 'stretch'},
});

const initialStyles = createStyles(lightColors);

function Page({children, contentStyle, keyboardShouldPersistTaps}) {
  const {styles} = useContext(ThemeContext);
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={[styles.pageContent, contentStyle]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize = 'sentences', maxLength}) {
  const {styles} = useContext(ThemeContext);
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#98A2B3"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      autoCorrect={false}
    />
  );
}

function Primary({title, onPress, variant = 'primary', disabled = false, loading = false}) {
  const {colors, styles} = useContext(ThemeContext);
  const variantName = variant[0].toUpperCase() + variant.slice(1);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        styles[`button${variantName}`],
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={[styles.buttonText, styles[`button${variantName}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

function Chip({label, selected, onPress}) {
  const {styles} = useContext(ThemeContext);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({title, message, mark = '+'}) {
  const {styles} = useContext(ThemeContext);
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>{mark}</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={[styles.muted, {textAlign: 'center'}]}>{message}</Text>
    </View>
  );
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function formatDate(value) {
  return value ? value.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Any date';
}

function AuthScreen({navigation, route}) {
  const {colors, styles} = useContext(ThemeContext);
  const {setToken} = useContext(AuthContext);
  const signup = route.name === 'SignUp';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password || (signup && !name.trim())) {
      return Alert.alert('Required', 'Please complete all fields.');
    }
    setBusy(true);
    try {
      const {data} = await api.post(`/auth/${signup ? 'signup' : 'login'}`, {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await AsyncStorage.setItem('token', data.token);
      setToken(data.token);
    } catch (error) {
      Alert.alert(
        'Sign in failed',
        error.response?.data?.message ||
          `Cannot reach ${API_URL}. Keep the backend running and connect your phone to the same Wi-Fi network.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page contentStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <View style={styles.authCard}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>BM</Text></View>
            <View>
              <Text style={styles.brandEyebrow}>BUSINESS TOOLS</Text>
              <Text style={{fontSize: 17, fontWeight: '800', color: colors.ink}}>Business Manager</Text>
            </View>
          </View>
          <Text style={styles.title}>{signup ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {signup ? 'Set up your account and keep your business organized.' : 'Sign in to manage your businesses and finances.'}
          </Text>
          {signup && <Field value={name} onChangeText={setName} placeholder="Full name" />}
          <Field
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
          />
          <Primary
            title={signup ? 'Create account' : 'Sign in'}
            onPress={submit}
            loading={busy}
            disabled={busy}
          />
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.textButton}
            onPress={() => navigation.navigate(signup ? 'Login' : 'SignUp')}>
            <Text style={styles.textButtonLabel}>
              {signup ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Text>
          </TouchableOpacity>
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}

function SettingsScreen({navigation}) {
  const {colors, styles, darkMode, setDarkMode} = useContext(ThemeContext);
  const {setToken} = useContext(AuthContext);
  const text = {
    title: 'Settings',
    subtitle: 'Manage your account and app preferences.',
    profile: 'Profile',
    profileDetails: 'View or update your name and email',
    appearance: 'Appearance',
    darkMode: 'Dark mode',
    darkDescription: 'Use a darker color theme',
    language: 'Language',
    languageDescription: 'Settings language',
    about: 'About application',
    aboutDescription: 'App information and version',
    signOut: 'Sign out',
    signOutError: 'Could not sign out. Please try again.',
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setToken(null);
    } catch {
      Alert.alert('Error', text.signOutError);
    }
  };

  return (
    <Page>
      <Text style={styles.brandEyebrow}>{text.appearance.toUpperCase()}</Text>
      <Text style={[styles.title, {marginTop: 5}]}>{text.title}</Text>
      <Text style={styles.subtitle}>{text.subtitle}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.card}
        onPress={() => navigation.navigate('Profile')}>
        <View style={[styles.row, styles.spaceBetween]}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={styles.cardTitle}>{text.profile}</Text>
            <Text style={[styles.muted, {marginTop: 4}]}>{text.profileDetails}</Text>
          </View>
          <Text style={{fontSize: 22, color: colors.primary}}>›</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{text.appearance}</Text>
        <View style={[styles.row, styles.spaceBetween, {marginTop: 8}]}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={styles.cardTitle}>{text.darkMode}</Text>
            <Text style={[styles.muted, {marginTop: 4}]}>{text.darkDescription}</Text>
          </View>
          <Switch
            accessibilityLabel={text.darkMode}
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{false: colors.border, true: colors.primaryLight}}
            thumbColor={darkMode ? colors.primary : '#F4F3F4'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{text.language}</Text>
        <Text style={[styles.muted, {marginBottom: 12}]}>{text.languageDescription}</Text>
        <Text style={styles.cardTitle}>English</Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.card}
        onPress={() => navigation.navigate('About')}>
        <View style={[styles.row, styles.spaceBetween]}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={styles.cardTitle}>{text.about}</Text>
            <Text style={[styles.muted, {marginTop: 4}]}>{text.aboutDescription}</Text>
          </View>
          <Text style={{fontSize: 22, color: colors.primary}}>›</Text>
        </View>
      </TouchableOpacity>

      <Primary title={text.signOut} onPress={signOut} variant="danger" />
    </Page>
  );
}

function ProfileScreen() {
  const {styles} = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    api.get('/auth/profile')
      .then(({data}) => {
        if (active) {
          setProfile(data);
          setName(data.name);
        }
      })
      .catch(error => {
        if (active) Alert.alert('Error', error.response?.data?.message || 'Could not load profile');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []));

  const save = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Enter your name.');
    setSaving(true);
    try {
      const {data} = await api.patch('/auth/profile', {name: name.trim()});
      setProfile(data);
      setName(data.name);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const text = {title: 'Profile', subtitle: 'View and update your account details.', name: 'Full name', email: 'Email address', save: 'Save changes'};

  return (
    <Page>
      <Text style={styles.title}>{text.title}</Text>
      <Text style={styles.subtitle}>{text.subtitle}</Text>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : profile ? (
        <View style={styles.card}>
          <Text style={[styles.small, {marginBottom: 9}]}>{text.name.toUpperCase()}</Text>
          <Field value={name} onChangeText={setName} placeholder={text.name} maxLength={100} />
          <Text style={[styles.small, {marginBottom: 9}]}>{text.email.toUpperCase()}</Text>
          <Text style={[styles.cardTitle, {marginBottom: 18}]}>{profile.email}</Text>
          <Primary title={text.save} onPress={save} loading={saving} disabled={saving} />
        </View>
      ) : (
        <View style={styles.card}>
          <EmptyState title="Profile unavailable" message="Go back and try again." mark="!" />
        </View>
      )}
    </Page>
  );
}

function AboutScreen() {
  const {styles} = useContext(ThemeContext);

  return (
    <Page>
      <Text style={styles.title}>About application</Text>
      <Text style={styles.subtitle}>
        A simple way to organize your business and finances.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Business Manager</Text>
        <Text style={[styles.muted, {marginTop: 8}]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.muted, {marginTop: 16}]}>
          Manage businesses, record income and expenses, and review transaction reports.
        </Text>
      </View>
    </Page>
  );
}

function BusinessesScreen({navigation}) {
  const {colors, styles} = useContext(ThemeContext);
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('HOTEL');
  const [customType, setCustomType] = useState('');
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [addBusinessExpanded, setAddBusinessExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    api.get('/businesses')
      .then(response => {
        if (active) {
          setItems(response.data);
          if (!response.data.length) setAddBusinessExpanded(true);
        }
      })
      .catch(error => {
        if (active) {
          setLoadError(true);
          Alert.alert('Error', error.response?.data?.message || 'Could not load businesses');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refresh]);

  const add = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Enter a business name to continue.');
    const businessType = type === 'CUSTOM' ? customType.trim() : type;
    if (!businessType) return Alert.alert('Required', 'Enter a business type to continue.');
    if (businessType.length > 64) return Alert.alert('Invalid business type', 'Business type must be 64 characters or fewer.');
    setAdding(true);
    try {
      await api.post('/businesses', {name: name.trim(), type: businessType, address: address.trim()});
      setName('');
      setAddress('');
      setType('HOTEL');
      setCustomType('');
      setAddBusinessExpanded(false);
      setRefresh(current => current + 1);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not create business');
    } finally {
      setAdding(false);
    }
  };

  const types = ['HOTEL', 'HOSTEL', 'HOME', 'COMPANY', 'CUSTOM'];
  const filteredItems = items.filter(item =>
    `${item.name} ${item.type} ${item.address || ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <Page>
      <Text style={styles.brandEyebrow}>YOUR WORKSPACE</Text>
      <Text style={[styles.title, {marginTop: 5}]}>My businesses</Text>
      <Text style={styles.subtitle}>Keep your properties and business finances in one place.</Text>

      {addBusinessExpanded ? (
        <View style={styles.card}>
          <View style={[styles.row, styles.spaceBetween, {marginBottom: 12}]}>
            <Text style={styles.sectionTitle}>Add a business</Text>
            {items.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setAddBusinessExpanded(false)}
                style={{padding: 5}}>
                <Text style={styles.textButtonLabel}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>Start by adding a business or property to your workspace.</Text>
          <Field value={name} onChangeText={setName} placeholder="Business name" />
          <Text style={[styles.small, {marginBottom: 9}]}>BUSINESS TYPE</Text>
          <View style={styles.chipRow}>
            {types.map(item => (
              <Chip
                key={item}
                label={item === 'CUSTOM' ? 'OTHER' : item}
                selected={type === item}
                onPress={() => setType(item)}
              />
            ))}
          </View>
          {type === 'CUSTOM' && (
            <Field
              value={customType}
              onChangeText={setCustomType}
              placeholder="Enter your business type"
              maxLength={64}
            />
          )}
          <Field value={address} onChangeText={setAddress} placeholder="Address (optional)" />
          <Primary title="Add business" onPress={add} loading={adding} disabled={adding} />
        </View>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.card, {paddingVertical: 13, marginBottom: 12}]}
          onPress={() => setAddBusinessExpanded(true)}>
          <View style={[styles.row, styles.spaceBetween]}>
            <Text style={styles.cardTitle}>Add a business</Text>
            <Text style={[styles.textButtonLabel, {fontSize: 20}]}>+</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.row, styles.spaceBetween, {marginBottom: 12, marginTop: 8}]}>
        <View>
          <Text style={styles.sectionTitle}>Your businesses</Text>
          <Text style={styles.muted}>{items.length} {items.length === 1 ? 'business' : 'businesses'}</Text>
        </View>
        {items.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{items.length} TOTAL</Text>
          </View>
        )}
      </View>

      {items.length > 0 && (
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, type, or address"
          autoCapitalize="none"
        />
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : loadError ? (
        <View style={styles.card}>
          <EmptyState title="Couldn't load businesses" message="Check your connection, then try again." mark="!" />
          <Primary title="Try again" onPress={() => setRefresh(current => current + 1)} variant="secondary" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.card}>
          <EmptyState title="Your workspace is ready" message="Add your first business above to get started." />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.card}>
          <EmptyState title="No matches found" message="Try a different name, business type, or address." mark="⌕" />
        </View>
      ) : (
        filteredItems.map(business => (
          <TouchableOpacity
            accessibilityRole="button"
            key={business.id}
            style={styles.card}
            onPress={() => navigation.navigate('Dashboard', {business})}>
            <View style={styles.row}>
              <View style={styles.businessIcon}>
                <Text style={styles.businessIconText}>{business.name?.trim()?.[0]?.toUpperCase() || 'B'}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>{business.name}</Text>
                <Text style={[styles.muted, {marginTop: 3}]}>{business.address || 'No address added'}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>{business.type}</Text></View>
            </View>
            <View style={[styles.row, styles.spaceBetween, {marginTop: 17}]}>
              <Text style={[styles.muted, {color: colors.primary, fontWeight: '700'}]}>View financial dashboard</Text>
              <Text style={{fontSize: 18, color: colors.primary}}>›</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </Page>
  );
}

function DashboardScreen({route, navigation}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business} = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    api.get(`/dashboard/${business.id}`)
      .then(response => {
        if (active) setData(response.data);
      })
      .catch(() => {
        if (active) Alert.alert('Error', 'Could not load dashboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [business.id]));

  const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
  const maxMonthlyAmount = Math.max(
    1,
    ...(data?.monthlyInsights || []).flatMap(month => [month.income, month.expenses]),
  );
  const canEdit = business.role !== 'VIEWER';

  return (
    <Page>
      <Text style={styles.brandEyebrow}>BUSINESS OVERVIEW</Text>
      <Text style={[styles.title, {marginTop: 5}]}>{business.name}</Text>
      <Text style={styles.subtitle}>{business.type} · Your financial snapshot</Text>

      {loading ? (
        <View style={styles.card}><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></View>
      ) : data ? (
        <>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.small}>TOTAL INCOME</Text>
              <Text style={[styles.statValue, {color: colors.green}]}>{money(data.income)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.small}>TOTAL EXPENSES</Text>
              <Text style={[styles.statValue, {color: colors.red}]}>{money(data.expenses)}</Text>
            </View>
          </View>
          <View style={[styles.card, styles.balanceCard]}>
            <Text style={[styles.small, styles.balanceLabel]}>CURRENT BALANCE</Text>
            <Text style={styles.balanceValue}>{money(data.balance)}</Text>
            <Text style={[styles.muted, {color: '#C7D2FE', marginTop: 5}]}>Income minus expenses</Text>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <EmptyState title="Dashboard unavailable" message="Go back and try opening this business again." mark="!" />
        </View>
      )}

      <Text style={[styles.sectionTitle, {marginTop: 8, marginBottom: 12}]}>Quick actions</Text>
      {canEdit && (
        <>
          <Primary
            title="+  Add income"
            variant="success"
            onPress={() => navigation.navigate('AddTransaction', {business, type: 'INCOME'})}
          />
          <Primary
            title="−  Add expense"
            variant="danger"
            onPress={() => navigation.navigate('AddTransaction', {business, type: 'EXPENSE'})}
          />
        </>
      )}
      <Primary
        title="View transaction history"
        variant="secondary"
        onPress={() => navigation.navigate('Transactions', {business})}
      />
      <Primary title="Recurring transactions" variant="secondary" onPress={() => navigation.navigate('Recurring', {business})} />
      <Primary title="Invoices & receipts" variant="secondary" onPress={() => navigation.navigate('Invoices', {business})} />
      <Primary title="Budgets & alerts" variant="secondary" onPress={() => navigation.navigate('Budgets', {business})} />
      <Primary title="Team access" variant="secondary" onPress={() => navigation.navigate('Team', {business})} />
      <Primary title="Backup & data export" variant="secondary" onPress={() => navigation.navigate('DataTools', {business})} />
      {data && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Monthly insights</Text>
          <Text style={[styles.muted, {marginBottom: 14}]}>Income and expenses over the last six months.</Text>
          {(data.monthlyInsights || []).map(month => (
            <View key={month.month} style={{marginBottom: 13}}>
              <View style={[styles.row, styles.spaceBetween, {marginBottom: 6}]}>
                <Text style={styles.small}>{month.label.toUpperCase()}</Text>
                <Text style={styles.muted}>{money(month.income - month.expenses)} net</Text>
              </View>
              <View style={{height: 7, borderRadius: 5, backgroundColor: colors.border}}>
                <View style={{height: 7, width: `${Math.max(month.income, 1) / maxMonthlyAmount * 100}%`, borderRadius: 5, backgroundColor: colors.green}} />
              </View>
              <View style={{height: 7, borderRadius: 5, backgroundColor: colors.border, marginTop: 4}}>
                <View style={{height: 7, width: `${Math.max(month.expenses, 1) / maxMonthlyAmount * 100}%`, borderRadius: 5, backgroundColor: colors.red}} />
              </View>
            </View>
          ))}
          <Text style={styles.muted}>Green: income · Red: expenses</Text>
        </View>
      )}

    </Page>
  );
}

function AddTransactionScreen({route, navigation}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business, type} = route.params;
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const isIncome = type === 'INCOME';

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) setTransactionDate(selectedDate);
    if (Platform.OS === 'android') setDatePickerVisible(false);
  };

  const chooseAttachments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const selected = result.assets || [];
      if (attachments.length + selected.length > 5)
        return Alert.alert('Too many files', 'You can attach up to 5 photos or PDFs to a transaction.');
      const unsupported = selected.find(file =>
        !['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'].includes(file.mimeType),
      );
      if (unsupported)
        return Alert.alert('Unsupported file', 'Choose a PDF, JPEG, PNG, WebP, HEIC, or AVIF file.');
      const oversized = selected.find(file => file.size > 10 * 1024 * 1024);
      if (oversized)
        return Alert.alert('File too large', 'Each attachment must be 10 MB or smaller.');
      setAttachments(current => [...current, ...selected]);
    } catch (error) {
      Alert.alert('Attachment selection failed', error.message || 'Could not select files.');
    }
  };

  const save = async () => {
    const numericAmount = Number(amount);
    if (!category.trim() || !amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return Alert.alert('Check your details', 'Enter a category and an amount greater than zero.');
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('businessId', business.id);
      formData.append('type', type);
      formData.append('category', category.trim());
      formData.append('amount', String(numericAmount));
      formData.append('description', description.trim());
      formData.append('date', transactionDate.toISOString());
      attachments.forEach((file, index) => {
        formData.append('attachments', {
          uri: file.uri,
          name: file.name || `attachment-${index + 1}`,
          type: file.mimeType || 'application/octet-stream',
        });
      });
      await api.post('/transactions', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      Alert.alert('Saved', `${type === 'INCOME' ? 'Income' : 'Expense'} recorded successfully`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page contentStyle={styles.authContent} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={[styles.badge, {alignSelf: 'flex-start', marginBottom: 16}, isIncome ? {backgroundColor: colors.greenLight} : {backgroundColor: colors.redLight}]}>
          <Text style={[styles.badgeText, isIncome ? {color: colors.green} : {color: colors.red}]}>
            {isIncome ? 'NEW INCOME' : 'NEW EXPENSE'}
          </Text>
        </View>
        <Text style={styles.title}>Add {isIncome ? 'income' : 'expense'}</Text>
        <Text style={styles.subtitle}>{business.name} · Record a transaction in INR.</Text>
        <Field
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount in INR"
          keyboardType="decimal-pad"
          autoCapitalize="none"
        />
        <Field value={category} onChangeText={setCategory} placeholder="Category (e.g. rent, salary)" />
        <Text style={[styles.small, {marginBottom: 8}]}>TRANSACTION DATE</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Transaction date, ${formatDate(transactionDate)}`}
          style={[styles.dateButton, {marginHorizontal: 0, marginBottom: 13}]}
          onPress={() => setDatePickerVisible(true)}>
          <Text style={styles.dateButtonValue}>{formatDate(transactionDate)}</Text>
        </TouchableOpacity>
        {datePickerVisible && Platform.OS === 'android' && (
          <DateTimePicker
            value={transactionDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        <Field value={description} onChangeText={setDescription} placeholder="Description (optional)" />
        <Text style={[styles.small, {marginBottom: 8}]}>ATTACHMENTS (UP TO 5 FILES, 10 MB EACH)</Text>
        <Primary title="Choose photos or PDFs" variant="secondary" onPress={chooseAttachments} disabled={saving} />
        {attachments.map((file, index) => (
          <View key={`${file.uri}-${index}`} style={[styles.row, styles.spaceBetween, {marginBottom: 10}]}>
            <Text numberOfLines={1} style={[styles.muted, {flex: 1, paddingRight: 10}]}>{file.name}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setAttachments(current => current.filter((_item, itemIndex) => itemIndex !== index))}>
              <Text style={{color: colors.red, fontWeight: '700'}}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Primary title="Save transaction" onPress={save} loading={saving} disabled={saving} />
      </View>
      <Modal
        visible={datePickerVisible && Platform.OS === 'ios'}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}>
        <View style={styles.datePickerOverlay}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.datePickerBackdrop}
            onPress={() => setDatePickerVisible(false)}
          />
          <View style={styles.datePickerCard}>
            <View style={[styles.row, styles.spaceBetween]}>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={{paddingVertical: 10, paddingRight: 18}}>
                <Text style={styles.textButtonLabel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.cardTitle}>Transaction date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={{paddingVertical: 10, paddingLeft: 18}}>
                <Text style={styles.textButtonLabel}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={transactionDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
            />
          </View>
        </View>
      </Modal>
    </Page>
  );
}

function TransactionsScreen({route}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business} = route.params;
  const [rows, setRows] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoadError, setTeamLoadError] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [picker, setPicker] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    Promise.allSettled([
      api.get('/transactions', {params: {businessId: business.id}}),
      api.get(`/team/${business.id}`),
    ]).then(([transactionsResult, teamResult]) => {
      if (!active) return;
      if (transactionsResult.status === 'fulfilled') {
        setRows(transactionsResult.value.data);
      } else {
        setLoadError(true);
        Alert.alert('Error', transactionsResult.reason.response?.data?.message || 'Could not load transactions');
      }
      if (teamResult.status === 'fulfilled') {
        const {owner, members} = teamResult.value.data;
        setTeamMembers([
          ...(owner ? [{...owner, role: 'OWNER'}] : []),
          ...members.map(member => ({...member.user, role: member.role})),
        ]);
        setTeamLoadError(false);
      } else {
        setTeamLoadError(true);
        setTeamMembers([]);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [business.id]);

  const dateRangeInvalid = fromDate && toDate &&
    new Date(fromDate).setHours(0, 0, 0, 0) > new Date(toDate).setHours(0, 0, 0, 0);
  const sortedRows = [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredRows = sortedRows.filter(item => {
    if (filter !== 'ALL' && item.type !== filter) return false;
    if (memberFilter === 'UNKNOWN' ? Boolean(item.createdById) : memberFilter !== 'ALL' && item.createdById !== memberFilter) return false;
    const transactionDate = new Date(item.date);
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      if (transactionDate < start) return false;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      if (transactionDate > end) return false;
    }
    return true;
  });
  const activeFilteredRows = filteredRows.filter(item => !item.deletedAt);
  const membersForFilter = [
    ...teamMembers,
    ...(rows.some(item => !item.createdById) ? [{id: 'UNKNOWN', name: 'Unknown / legacy', role: ''}] : []),
  ];
  const visibleRows = filteredRows.slice(0, visibleCount);
  const incomeTotal = activeFilteredRows.reduce(
    (total, item) => total + (item.type === 'INCOME' ? Number(item.amount) : 0),
    0,
  );
  const expenseTotal = activeFilteredRows.reduce(
    (total, item) => total + (item.type === 'EXPENSE' ? Number(item.amount) : 0),
    0,
  );
  const filters = [
    {label: 'All', value: 'ALL'},
    {label: 'Income', value: 'INCOME'},
    {label: 'Expenses', value: 'EXPENSE'},
  ];

  const exportCsv = async () => {
    if (dateRangeInvalid)
      return Alert.alert('Invalid date range', 'The start date must be on or before the end date.');
    setExporting(true);
    try {
      const params = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        params.fromDate = start.toISOString();
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        params.toDate = end.toISOString();
      }
      if (memberFilter !== 'ALL') params.createdById = memberFilter;
      const {data} = await api.get(`/backup/csv/${business.id}`, {params, responseType: 'text'});
      const file = `${FileSystem.cacheDirectory}transactions-${business.id}-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(file, data, {encoding: FileSystem.EncodingType.UTF8});
      if (!(await Sharing.isAvailableAsync()))
        return Alert.alert('Sharing unavailable', 'File sharing is not available on this device.');
      await Sharing.shareAsync(file, {mimeType: 'text/csv', dialogTitle: 'Share filtered transaction CSV'});
    } catch (error) {
      Alert.alert('CSV export failed', error.response?.data?.message || error.message || 'Could not export transactions.');
    } finally {
      setExporting(false);
    }
  };

  const deleteTransaction = item => Alert.alert(
    'Delete transaction?',
    `${item.category} · ₹${Number(item.amount).toLocaleString('en-IN', {maximumFractionDigits: 2})} will remain in history as deleted and no longer count toward totals.`,
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const {data} = await api.delete(`/transactions/${item.id}`);
          setRows(current => current.map(row =>
            row.id === item.id ? {...row, ...data} : row,
          ));
        } catch (error) {
          if (error.response?.status === 404) {
            try {
              const {data} = await api.get('/transactions', {params: {businessId: business.id}});
              setRows(data);
              Alert.alert('History refreshed', 'This transaction is no longer available and the history has been refreshed.');
              return;
            } catch (refreshError) {
              Alert.alert(
                'Could not refresh history',
                refreshError.response?.data?.message || 'The transaction was not found and history could not be refreshed.',
              );
              return;
            }
          }
          Alert.alert('Could not delete transaction', error.response?.data?.message || 'Could not delete transaction.');
        }
      }},
    ],
  );

  const shareAttachment = async attachment => {
    try {
      const token = await AsyncStorage.getItem('token');
      const extension = attachment.fileName.includes('.')
        ? attachment.fileName.slice(attachment.fileName.lastIndexOf('.'))
        : '';
      const destination = `${FileSystem.cacheDirectory}transaction-attachment-${attachment.id}${extension}`;
      await FileSystem.downloadAsync(
        `${API_URL}/transactions/attachments/${encodeURIComponent(attachment.id)}`,
        destination,
        {headers: token ? {Authorization: `Bearer ${token}`} : {}},
      );
      if (!(await Sharing.isAvailableAsync()))
        return Alert.alert('Sharing unavailable', 'File sharing is not available on this device.');
      await Sharing.shareAsync(destination, {
        mimeType: attachment.mimeType,
        dialogTitle: attachment.fileName,
      });
    } catch (error) {
      Alert.alert('Attachment unavailable', error.response?.data?.message || error.message || 'Could not download attachment.');
    }
  };

  const openDatePicker = field => {
    setPickerDate((field === 'from' ? fromDate : toDate) || new Date());
    setPicker(field);
  };

  const applyPickedDate = (event, selectedDate) => {
    if (Platform.OS === 'ios') {
      if (selectedDate) setPickerDate(selectedDate);
      return;
    }
    if (event.type === 'set' && selectedDate) {
      if (picker === 'from') setFromDate(selectedDate);
      if (picker === 'to') setToDate(selectedDate);
      setVisibleCount(15);
    }
    setPicker(null);
  };

  const confirmPickedDate = () => {
    if (picker === 'from') setFromDate(pickerDate);
    if (picker === 'to') setToDate(pickerDate);
    setVisibleCount(15);
    setPicker(null);
  };

  const exportPdf = async () => {
    if (dateRangeInvalid) {
      return Alert.alert('Invalid date range', 'The start date must be on or before the end date.');
    }
    if (!filteredRows.length) {
      return Alert.alert('No transactions', 'There are no transactions matching the selected filters and date range.');
    }
    setExporting(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'PDF sharing is not available on this device.');
        return;
      }

      const tableRows = filteredRows.map(item => {
        const isIncome = item.type === 'INCOME';
        return `<tr>
          <td>${escapeHtml(new Date(item.date).toLocaleDateString('en-IN'))}</td>
          <td>${escapeHtml(item.category)}</td>
          <td>${escapeHtml(item.description || '—')}</td>
          <td class="${isIncome ? 'income' : 'expense'}">${isIncome ? 'Income' : 'Expense'}</td>
          <td>${item.deletedAt ? 'Deleted' : 'Active'}</td>
          <td>${escapeHtml(item.createdBy?.name || 'Unknown')}</td>
          <td>${escapeHtml(item.deletedBy?.name || '')}</td>
          <td class="amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}₹${escapeHtml(Number(item.amount).toLocaleString('en-IN', {maximumFractionDigits: 2}))}</td>
        </tr>`;
      }).join('');
      const rangeLabel = `${formatDate(fromDate)} – ${formatDate(toDate)}`;
      const html = `<!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { margin: 24px 16px; }
              body { font-family: Arial, sans-serif; color: #172033; font-size: 11px; }
              h1 { margin: 0 0 5px; font-size: 23px; }
              .subtitle { color: #667085; font-size: 12px; }
              .summary { display: flex; gap: 12px; margin: 20px 0; }
              .metric { flex: 1; min-width: 0; padding: 17px 14px; border: 1px solid #e4e9f2; border-radius: 10px; }
              .label { color: #667085; font-size: 10px; font-weight: bold; text-transform: uppercase; }
              .value { margin-top: 8px; font-size: 20px; font-weight: bold; }
              .income { color: #15803d; }
              .expense { color: #dc2626; }
              table { width: 100%; border-collapse: collapse; }
              th { padding: 9px 6px; text-align: left; color: #667085; background: #f5f7fb; font-size: 9px; text-transform: uppercase; }
              td { padding: 9px 6px; border-bottom: 1px solid #e4e9f2; vertical-align: top; }
              .amount { text-align: right; white-space: nowrap; font-weight: bold; }
              .footer { margin-top: 18px; color: #667085; font-size: 9px; }
            </style>
          </head>
          <body>
            <h1>Transaction report</h1>
            <div class="subtitle">${escapeHtml(business.name)} · ${escapeHtml(business.type || 'Business')}</div>
            <div class="subtitle">Period: ${escapeHtml(rangeLabel)} · ${filteredRows.length} transactions</div>
            <div class="summary">
              <div class="metric"><div class="label">Total income</div><div class="value income">₹${escapeHtml(incomeTotal.toLocaleString('en-IN', {maximumFractionDigits: 2}))}</div></div>
              <div class="metric"><div class="label">Total expenses</div><div class="value expense">₹${escapeHtml(expenseTotal.toLocaleString('en-IN', {maximumFractionDigits: 2}))}</div></div>
              <div class="metric"><div class="label">Net balance</div><div class="value">₹${escapeHtml((incomeTotal - expenseTotal).toLocaleString('en-IN', {maximumFractionDigits: 2}))}</div></div>
            </div>
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Type</th><th>Status</th><th>Added by</th><th>Deleted by</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
            <div class="footer">Generated ${escapeHtml(new Date().toLocaleString('en-IN'))} · Business Manager</div>
          </body>
        </html>`;
      const {uri} = await Print.printToFileAsync({html});
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save or share transaction report',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('PDF export failed', error.message || 'Could not create or share the transaction report.');
    } finally {
      setExporting(false);
    }
  };

  const clearDates = () => {
    setFromDate(null);
    setToDate(null);
    setVisibleCount(15);
  };

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        style={styles.page}
        contentContainerStyle={[styles.listContent, styles.transactionListContent]}
        data={visibleRows}
        keyExtractor={item => String(item.id)}
        initialNumToRender={15}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.content}>
            <Text style={styles.brandEyebrow}>ACTIVITY</Text>
            <Text style={[styles.title, {marginTop: 5}]}>Transactions</Text>
            <Text style={styles.subtitle}>{business.name} · {rows.length} total transactions</Text>

            <View style={[styles.card, styles.reportCard]}>
              <View style={[styles.row, styles.spaceBetween, {marginBottom: 14}]}>
                <View style={{flex: 1, paddingRight: 8}}>
                  <Text style={styles.sectionTitle}>Export a custom report</Text>
                  <Text style={styles.muted}>Choose dates, then save or share as PDF.</Text>
                </View>
                {(fromDate || toDate) && (
                  <TouchableOpacity onPress={clearDates} style={{padding: 5}}>
                    <Text style={styles.textButtonLabel}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('from')}>
                  <Text style={styles.dateButtonLabel}>FROM</Text>
                  <Text numberOfLines={1} style={styles.dateButtonValue}>{formatDate(fromDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('to')}>
                  <Text style={styles.dateButtonLabel}>TO</Text>
                  <Text numberOfLines={1} style={styles.dateButtonValue}>{formatDate(toDate)}</Text>
                </TouchableOpacity>
              </View>
              {dateRangeInvalid && (
                <Text style={[styles.muted, {color: colors.red, marginBottom: 8}]}>
                  The start date must be on or before the end date.
                </Text>
              )}
              <Primary
                title="Download / share PDF"
                onPress={exportPdf}
                loading={exporting}
                disabled={exporting || loading || loadError}
              />
              <Primary
                title="Download / share CSV"
                variant="secondary"
                onPress={exportCsv}
                loading={exporting}
                disabled={exporting || loading || loadError}
              />
              <Text style={[styles.small, {marginTop: 6, marginBottom: 8}]}>FILTER BY TEAM MEMBER</Text>
              <View style={styles.chipRow}>
                <Chip label="Everyone" selected={memberFilter === 'ALL'} onPress={() => { setMemberFilter('ALL'); setVisibleCount(15); }} />
                {membersForFilter.map(member => (
                  <Chip
                    key={member.id}
                    label={member.role ? `${member.name} · ${member.role}` : member.name}
                    selected={memberFilter === member.id}
                    onPress={() => { setMemberFilter(member.id); setVisibleCount(15); }}
                  />
                ))}
              </View>
              {teamLoadError && (
                <Text style={[styles.muted, {marginBottom: 8}]}>Team names are unavailable; transactions still show their recorded creator where available.</Text>
              )}
              {picker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="default"
                  onChange={applyPickedDate}
                />
              )}
            </View>

            <View style={[styles.row, styles.spaceBetween, {marginBottom: 8}]}>
              <View>
                <Text style={styles.sectionTitle}>Transaction activity</Text>
                <Text style={styles.muted}>
                  {filteredRows.length
                    ? `Showing ${Math.min(visibleCount, filteredRows.length)} of ${filteredRows.length}`
                    : 'No matching transactions'}
                </Text>
              </View>
            </View>
            <View style={styles.chipRow}>
              {filters.map(item => (
                <Chip
                  key={item.value}
                  label={item.label}
                  selected={filter === item.value}
                  onPress={() => {
                    setFilter(item.value);
                    setVisibleCount(15);
                  }}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.content, styles.card]}>
            {loading ? (
              <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : loadError ? (
              <EmptyState title="Couldn't load transactions" message="Check your connection, then reopen this screen." mark="!" />
            ) : (
              <EmptyState
                title={rows.length ? 'No transactions in this range' : 'No transactions yet'}
                message={rows.length ? 'Try another filter or choose a wider date range.' : 'Income and expenses will appear here once recorded.'}
                mark={rows.length ? '⌕' : '₹'}
              />
            )}
          </View>
        }
        ListFooterComponent={
          filteredRows.length > visibleCount ? (
            <View style={[styles.content, {alignItems: 'center'}]}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.loadMore}
                onPress={() => setVisibleCount(count => count + 15)}>
                <Text style={styles.loadMoreText}>Show 15 more · {filteredRows.length - visibleCount} remaining</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({item}) => {
          const income = item.type === 'INCOME';
          return (
            <View style={[
              styles.content,
              styles.transactionCard,
              item.deletedAt && {backgroundColor: colors.redLight, borderColor: colors.red},
            ]}>
              <View style={styles.row}>
                <View style={[styles.transactionMark, income ? {backgroundColor: colors.greenLight} : {backgroundColor: colors.redLight}]}>
                  <Text style={[styles.transactionMarkText, income ? {color: colors.green} : {color: colors.red}]}>
                    {income ? '+' : '−'}
                  </Text>
                </View>
                <View style={{flex: 1, minWidth: 0}}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{item.category}</Text>
                  <Text numberOfLines={1} style={[styles.muted, {marginTop: 3}]}>
                    {item.description || (income ? 'Income recorded' : 'Expense recorded')}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, {color: item.deletedAt ? colors.muted : income ? colors.green : colors.red}]}>
                  {income ? '+' : '−'}₹{Number(item.amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                </Text>
              </View>
              <View style={styles.transactionMeta}>
                <View style={[styles.transactionTag, income ? {backgroundColor: colors.greenLight} : {backgroundColor: colors.redLight}]}>
                  <Text style={[styles.transactionTagText, income ? {color: colors.green} : {color: colors.red}]}>
                    {income ? 'INCOME' : 'EXPENSE'}
                  </Text>
                </View>
                {item.deletedAt && (
                  <View style={[styles.transactionTag, {backgroundColor: colors.red}]}>
                    <Text style={[styles.transactionTagText, {color: '#FFFFFF'}]}>DELETED</Text>
                  </View>
                )}
                <Text style={styles.small}>{new Date(item.date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}</Text>
              </View>
              <Text style={[styles.muted, {marginTop: 8}]}>
                Added by {item.createdBy?.name || 'Unknown'}
              </Text>
              {item.deletedAt && (
                <Text style={[styles.muted, {marginTop: 4}]}>
                  Deleted by {item.deletedBy?.name || 'Unknown'}
                </Text>
              )}
              {item.attachments?.map(attachment => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={attachment.id}
                  style={[styles.badge, {alignSelf: 'flex-start', marginTop: 10}]}
                  onPress={() => shareAttachment(attachment)}>
                  <Text style={styles.badgeText}>Open {attachment.fileName}</Text>
                </TouchableOpacity>
              ))}
              {!item.deletedAt && business.role !== 'VIEWER' && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => deleteTransaction(item)}
                  style={{alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4}}>
                  <Text style={{color: colors.red, fontWeight: '700'}}>Delete transaction</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
      {picker && Platform.OS === 'ios' && (
        <View style={styles.datePickerOverlay}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.datePickerBackdrop}
            onPress={() => setPicker(null)}
          />
          <View style={styles.datePickerCard}>
            <View style={[styles.row, styles.spaceBetween]}>
              <TouchableOpacity onPress={() => setPicker(null)} style={{paddingVertical: 10, paddingRight: 18}}>
                <Text style={styles.textButtonLabel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.cardTitle}>{picker === 'from' ? 'Start date' : 'End date'}</Text>
              <TouchableOpacity onPress={confirmPickedDate} style={{paddingVertical: 10, paddingLeft: 18}}>
                <Text style={styles.textButtonLabel}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              onChange={applyPickedDate}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function RecurringScreen({route}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business} = route.params;
  const [rules, setRules] = useState([]);
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [nextRunAt, setNextRunAt] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const canEdit = business.role !== 'VIEWER';

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    api.get(`/recurring/${business.id}`)
      .then(({data}) => { if (active) setRules(data); })
      .catch(error => Alert.alert('Error', error.response?.data?.message || 'Could not load recurring transactions'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [business.id, refresh]));

  const createRule = async () => {
    const parsedAmount = Number(amount);
    const parsedDate = new Date(`${nextRunAt}T00:00:00.000Z`);
    if (!category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 ||
        Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== nextRunAt)
      return Alert.alert('Check your details', 'Enter a category, positive amount, and valid first run date (YYYY-MM-DD).');
    setSaving(true);
    try {
      await api.post(`/recurring/${business.id}`, {
        type,
        category: category.trim(),
        amount: parsedAmount,
        description: description.trim(),
        frequency,
        nextRunAt: parsedDate.toISOString(),
      });
      setCategory('');
      setAmount('');
      setDescription('');
      setRefresh(current => current + 1);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not create recurring transaction');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async rule => {
    try {
      await api.patch(`/recurring/${business.id}/${rule.id}`, {active: !rule.active});
      setRefresh(current => current + 1);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update recurring transaction');
    }
  };

  return (
    <Page keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Recurring transactions</Text>
      <Text style={styles.subtitle}>{business.name} · Automatically record weekly or monthly entries.</Text>
      {canEdit && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add a recurring transaction</Text>
          <View style={styles.chipRow}>
            <Chip label="Expense" selected={type === 'EXPENSE'} onPress={() => setType('EXPENSE')} />
            <Chip label="Income" selected={type === 'INCOME'} onPress={() => setType('INCOME')} />
          </View>
          <Field value={category} onChangeText={setCategory} placeholder="Category (e.g. rent, salary)" />
          <Field value={amount} onChangeText={setAmount} placeholder="Amount in INR" keyboardType="decimal-pad" autoCapitalize="none" />
          <Field value={description} onChangeText={setDescription} placeholder="Description (optional)" />
          <Text style={[styles.small, {marginBottom: 8}]}>FREQUENCY</Text>
          <View style={styles.chipRow}>
            <Chip label="Weekly" selected={frequency === 'WEEKLY'} onPress={() => setFrequency('WEEKLY')} />
            <Chip label="Monthly" selected={frequency === 'MONTHLY'} onPress={() => setFrequency('MONTHLY')} />
          </View>
          <Field value={nextRunAt} onChangeText={setNextRunAt} placeholder="First run date (YYYY-MM-DD)" maxLength={10} />
          <Text style={[styles.muted, {marginBottom: 10}]}>The API server creates due transactions automatically.</Text>
          <Primary title="Save recurring transaction" onPress={createRule} loading={saving} disabled={saving} />
        </View>
      )}
      <Text style={[styles.sectionTitle, {marginTop: 8}]}>Scheduled entries</Text>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : rules.length === 0 ? (
        <View style={styles.card}><EmptyState title="No recurring transactions" message="Add regular income or expenses to have them recorded automatically." /></View>
      ) : rules.map(rule => (
        <View key={rule.id} style={styles.card}>
          <View style={[styles.row, styles.spaceBetween]}>
            <View style={{flex: 1, paddingRight: 12}}>
              <Text style={styles.cardTitle}>{rule.category} · ₹{Number(rule.amount).toLocaleString('en-IN')}</Text>
              <Text style={[styles.muted, {marginTop: 4}]}>
                {rule.type} · {rule.frequency.toLowerCase()} · Next {new Date(rule.nextRunAt).toLocaleDateString('en-IN')}
              </Text>
              {!!rule.description && <Text style={[styles.muted, {marginTop: 4}]}>{rule.description}</Text>}
            </View>
            <Switch
              accessibilityLabel={`Schedule ${rule.category}`}
              value={rule.active}
              onValueChange={() => toggleRule(rule)}
              disabled={!canEdit}
            />
          </View>
          <View style={[styles.badge, {alignSelf: 'flex-start', marginTop: 10}]}>
            <Text style={styles.badgeText}>{rule.active ? 'ACTIVE' : 'PAUSED'}</Text>
          </View>
        </View>
      ))}
    </Page>
  );
}

function InvoicesScreen({route}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business} = route.params;
  const [invoices, setInvoices] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const canEdit = business.role !== 'VIEWER';

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    api.get(`/invoices/${business.id}`)
      .then(({data}) => { if (active) setInvoices(data); })
      .catch(error => Alert.alert('Error', error.response?.data?.message || 'Could not load invoices'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [business.id, refresh]));

  const createInvoice = async () => {
    if (!customerName.trim() || !description.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0)
      return Alert.alert('Check your details', 'Enter a customer, description, and positive invoice amount.');
    setSaving(true);
    try {
      await api.post(`/invoices/${business.id}`, {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        description: description.trim(),
        amount: Number(amount),
        dueDate: dueDate.trim() || null,
      });
      setCustomerName('');
      setCustomerEmail('');
      setDescription('');
      setAmount('');
      setDueDate('');
      setRefresh(current => current + 1);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not create invoice');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (invoice, status) => {
    try {
      await api.patch(`/invoices/${business.id}/${invoice.id}/status`, {status});
      setRefresh(current => current + 1);
      if (status === 'PAID') Alert.alert('Payment recorded', 'The invoice payment was added to business income.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update invoice');
    }
  };

  const shareInvoice = async invoice => {
    try {
      if (!(await Sharing.isAvailableAsync())) return Alert.alert('Sharing unavailable', 'PDF sharing is not available on this device.');
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;color:#172033;padding:32px}
        h1{color:#4f46e5} .muted{color:#667085} .amount{font-size:24px;font-weight:bold}
        .box{margin-top:24px;padding:18px;border:1px solid #e4e9f2;border-radius:12px}
      </style></head><body>
        <h1>Invoice</h1><p class="muted">${escapeHtml(business.name)} · ${escapeHtml(business.type)}</p>
        <div class="box"><p><b>Invoice:</b> ${escapeHtml(invoice.invoiceNumber)}</p>
        <p><b>Customer:</b> ${escapeHtml(invoice.customerName)}</p>
        <p><b>Email:</b> ${escapeHtml(invoice.customerEmail || '—')}</p>
        <p><b>Description:</b> ${escapeHtml(invoice.description)}</p>
        <p><b>Due date:</b> ${escapeHtml(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Not set')}</p>
        <p class="amount">Amount due: ₹${escapeHtml(Number(invoice.amount).toLocaleString('en-IN', {maximumFractionDigits: 2}))}</p>
        <p>Status: ${escapeHtml(invoice.status)}</p></div></body></html>`;
      const {uri} = await Print.printToFileAsync({html});
      await Sharing.shareAsync(uri, {mimeType: 'application/pdf', dialogTitle: 'Share invoice'});
    } catch (error) {
      Alert.alert('Invoice export failed', error.message || 'Could not create or share this invoice.');
    }
  };

  return (
    <Page keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Invoices & receipts</Text>
      <Text style={styles.subtitle}>{business.name} · Create shareable invoices and record payments.</Text>
      {canEdit && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Create invoice</Text>
          <Field value={customerName} onChangeText={setCustomerName} placeholder="Customer name" maxLength={150} />
          <Field value={customerEmail} onChangeText={setCustomerEmail} placeholder="Customer email (optional)" keyboardType="email-address" autoCapitalize="none" />
          <Field value={description} onChangeText={setDescription} placeholder="Description" maxLength={500} />
           <Field value={amount} onChangeText={setAmount} placeholder="Amount in INR" keyboardType="decimal-pad" autoCapitalize="none" />
          <Field value={dueDate} onChangeText={setDueDate} placeholder="Due date (YYYY-MM-DD, optional)" maxLength={10} />
          <Primary title="Create invoice" onPress={createInvoice} loading={saving} disabled={saving} />
        </View>
      )}
      <Text style={[styles.sectionTitle, {marginTop: 8}]}>Invoice history</Text>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : invoices.length === 0 ? (
        <View style={styles.card}><EmptyState title="No invoices yet" message="Create an invoice to share a professional PDF with your customer." /></View>
      ) : invoices.map(invoice => (
        <View key={invoice.id} style={styles.card}>
          <View style={[styles.row, styles.spaceBetween]}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Text style={styles.cardTitle}>{invoice.invoiceNumber}</Text>
              <Text style={[styles.muted, {marginTop: 4}]}>{invoice.customerName} · {invoice.description}</Text>
              <Text style={[styles.cardTitle, {marginTop: 8}]}>₹{Number(invoice.amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}</Text>
            </View>
            <View style={styles.badge}><Text style={styles.badgeText}>{invoice.status}</Text></View>
          </View>
          <Primary title="Share PDF" variant="secondary" onPress={() => shareInvoice(invoice)} />
          {canEdit && invoice.status !== 'PAID' && (
            <Primary
              title={invoice.status === 'DRAFT' ? 'Mark as sent' : 'Record payment'}
              variant={invoice.status === 'DRAFT' ? 'primary' : 'success'}
              onPress={() => setStatus(invoice, invoice.status === 'DRAFT' ? 'SENT' : 'PAID')}
            />
          )}
        </View>
      ))}
    </Page>
  );
}

function BudgetsScreen({route}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business} = route.params;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [monthInput, setMonthInput] = useState(currentMonth);
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [warned, setWarned] = useState(false);
  const canEdit = business.role !== 'VIEWER';

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    api.get(`/budgets/${business.id}`, {params: {month}})
      .then(({data}) => {
        if (active) {
          setBudgets(data);
          const warning = data.find(item => item.percent >= 80);
          if (warning && !warned) {
            setWarned(true);
            Alert.alert(
              warning.percent >= 100 ? 'Budget limit reached' : 'Budget running low',
              `${warning.category} has used ${warning.percent}% of its ${month} budget.`,
            );
          }
        }
      })
      .catch(error => Alert.alert('Error', error.response?.data?.message || 'Could not load budgets'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [business.id, month, refresh, warned]));

  const saveBudget = async () => {
    if (monthInput !== month) return Alert.alert('Load selected month', 'Load the selected month before saving its budget.');
    if (!category.trim() || !Number.isFinite(Number(limit)) || Number(limit) <= 0)
      return Alert.alert('Check your details', 'Enter a category and a positive monthly limit.');
    setSaving(true);
    try {
      await api.post(`/budgets/${business.id}`, {category: category.trim(), month, limit: Number(limit)});
      setCategory('');
      setLimit('');
      setRefresh(current => current + 1);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Budgets & alerts</Text>
      <Text style={styles.subtitle}>{business.name} · Track expense categories against a monthly limit.</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Budget month · {month}</Text>
        <Field value={monthInput} onChangeText={setMonthInput} placeholder="YYYY-MM" maxLength={7} />
        <Primary
          title="Load month"
          variant="secondary"
          onPress={() => {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput)) return Alert.alert('Invalid month', 'Enter a month in YYYY-MM format.');
            setWarned(false);
            setMonth(monthInput);
          }}
        />
        <Text style={[styles.muted, {marginBottom: 12}]}>An in-app alert appears when a category reaches 80% of its limit.</Text>
        {canEdit && (
          <>
            <Text style={styles.sectionTitle}>Set a category limit</Text>
            <Field value={category} onChangeText={setCategory} placeholder="Expense category (e.g. rent)" maxLength={100} />
            <Field value={limit} onChangeText={setLimit} placeholder="Monthly limit in INR" keyboardType="decimal-pad" autoCapitalize="none" />
            <Primary title="Save budget" onPress={saveBudget} loading={saving} disabled={saving} />
          </>
        )}
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : budgets.length === 0 ? (
        <View style={styles.card}><EmptyState title="No budgets for this month" message="Set a category limit to start tracking expenses." /></View>
      ) : budgets.map(item => (
        <View key={item.id} style={styles.card}>
          <View style={[styles.row, styles.spaceBetween]}>
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={[styles.cardTitle, {color: item.percent >= 100 ? colors.red : colors.primary}]}>{item.percent}%</Text>
          </View>
          <Text style={[styles.muted, {marginTop: 6}]}>
            ₹{Number(item.spent).toLocaleString('en-IN', {maximumFractionDigits: 2})} spent of ₹{Number(item.limit).toLocaleString('en-IN', {maximumFractionDigits: 2})}
          </Text>
          <View style={{height: 8, borderRadius: 5, backgroundColor: colors.border, marginTop: 12}}>
            <View style={{height: 8, width: `${Math.min(item.percent, 100)}%`, borderRadius: 5, backgroundColor: item.percent >= 100 ? colors.red : colors.primary}} />
          </View>
        </View>
      ))}
    </Page>
  );
}

function TeamScreen({route}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business} = route.params;
  const [team, setTeam] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [isOwner, setIsOwner] = useState(business.role === 'OWNER');
  const [loadError, setLoadError] = useState('');
  const [addMemberExpanded, setAddMemberExpanded] = useState(false);
  const canManage = isOwner || business.role === 'ADMIN';

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    Promise.allSettled([
      api.get('/auth/profile'),
      api.get(`/team/${business.id}`),
    ]).then(([profileResult, teamResult]) => {
      if (!active) return;
      if (profileResult.status === 'fulfilled') {
        setIsOwner(profileResult.value.data.id === business.ownerId || business.role === 'OWNER');
      } else {
        setIsOwner(business.role === 'OWNER');
      }

      if (teamResult.status === 'fulfilled') {
        setTeam(teamResult.value.data);
        if (!teamResult.value.data.members.length) setAddMemberExpanded(true);
      } else {
        const error = teamResult.reason;
        const status = error.response?.status;
        const message = status === 404
          ? 'Team Access is not available on the running API server. Restart the backend from this project, then retry.'
          : status === 500
            ? 'The backend could not read team data. Apply the Prisma schema update, regenerate Prisma Client, and restart the backend.'
            : status === 401
              ? 'Your session has expired. Sign out and sign in again.'
              : error.response?.data?.message ||
                'Could not reach the API. Check that the backend is running and your device can connect to it.';
        setTeam(null);
        setLoadError(message);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [business.id, business.ownerId, business.role, refresh]));

  const addMember = async () => {
    if (!email.trim()) return Alert.alert('Required', 'Enter the email of an existing account.');
    setSaving(true);
    try {
      await api.post(`/team/${business.id}`, {email: email.trim(), role});
      setEmail('');
      setAddMemberExpanded(false);
      setRefresh(current => current + 1);
    } catch (error) {
      Alert.alert('Could not add team member', error.response?.data?.message || 'Could not add this team member');
    } finally {
      setSaving(false);
    }
  };

  const updateMemberRole = async (member, nextRole) => {
    if (member.role === nextRole) return;
    try {
      await api.patch(`/team/${business.id}/${member.id}`, {role: nextRole});
      setRefresh(current => current + 1);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update team role');
    }
  };

  const removeMember = member => Alert.alert(
    'Remove team member',
    `Remove ${member.user.name} from ${business.name}?`,
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/team/${business.id}/${member.id}`);
          setRefresh(current => current + 1);
        } catch (error) {
          Alert.alert('Error', error.response?.data?.message || 'Could not remove team member');
        }
      }},
    ],
  );

  return (
    <Page keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Team access</Text>
      <Text style={styles.subtitle}>{business.name} · Invite existing accounts and choose their permissions.</Text>
      {!canManage && (
        <View style={styles.card}><Text style={styles.muted}>Only the business owner and admins can manage team access.</Text></View>
      )}
      {canManage && (
        addMemberExpanded ? (
          <View style={styles.card}>
            <View style={[styles.row, styles.spaceBetween, {marginBottom: 12}]}>
              <Text style={styles.sectionTitle}>Add a team member</Text>
              {team?.members.length > 0 && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setAddMemberExpanded(false)}
                  style={{padding: 5}}>
                  <Text style={styles.textButtonLabel}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.muted, {marginBottom: 12}]}>The person must already have a Business Manager account.</Text>
            <Field value={email} onChangeText={setEmail} placeholder="Account email" keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.chipRow}>
              {['ADMIN', 'EDITOR', 'VIEWER'].map(item => (
                <Chip key={item} label={item} selected={role === item} onPress={() => setRole(item)} />
              ))}
            </View>
            <Primary title="Add member" onPress={addMember} loading={saving} disabled={saving} />
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.card, {paddingVertical: 13, marginBottom: 12}]}
            onPress={() => setAddMemberExpanded(true)}>
            <View style={[styles.row, styles.spaceBetween]}>
              <Text style={styles.cardTitle}>Add a team member</Text>
              <Text style={[styles.textButtonLabel, {fontSize: 20}]}>+</Text>
            </View>
          </TouchableOpacity>
        )
      )}
      <Text style={[styles.sectionTitle, {marginTop: 8}]}>Members</Text>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : loadError ? (
        <View style={styles.card}>
          <EmptyState title="Couldn't load team access" message={loadError} mark="!" />
          <Primary title="Retry" variant="secondary" onPress={() => setRefresh(current => current + 1)} />
        </View>
      ) : team ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{team.owner?.name || 'Owner'} · OWNER</Text>
            <Text style={[styles.muted, {marginTop: 4}]}>{team.owner?.email}</Text>
          </View>
          {team.members.map(member => (
            <View key={member.id} style={styles.card}>
              <Text style={styles.cardTitle}>{member.user.name} · {member.role}</Text>
              <Text style={[styles.muted, {marginTop: 4}]}>{member.user.email}</Text>
              {canManage && (
                <>
                  <View style={[styles.chipRow, {marginTop: 10}]}>
                    {['ADMIN', 'EDITOR', 'VIEWER'].map(item => (
                      <Chip key={item} label={item} selected={member.role === item} onPress={() => updateMemberRole(member, item)} />
                    ))}
                  </View>
                  <Primary title="Remove member" variant="danger" onPress={() => removeMember(member)} />
                </>
              )}
            </View>
          ))}
          {team.members.length === 0 && (
            <View style={styles.card}><Text style={styles.muted}>No other members have access to this business yet.</Text></View>
          )}
        </>
      ) : null}
    </Page>
  );
}

function DataToolsScreen({route}) {
  const {styles} = useContext(ThemeContext);
  const {business} = route.params;
  const [working, setWorking] = useState(false);

  const shareFile = async (path, mimeType, title) => {
    if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is not available on this device.');
    await Sharing.shareAsync(path, {mimeType, dialogTitle: title});
  };

  const exportBackup = async () => {
    setWorking(true);
    try {
      const {data} = await api.get('/backup');
      const file = `${FileSystem.cacheDirectory}business-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      await FileSystem.writeAsStringAsync(file, JSON.stringify(data, null, 2), {encoding: FileSystem.EncodingType.UTF8});
      await shareFile(file, 'application/json', 'Save or share full data backup');
    } catch (error) {
      Alert.alert('Backup failed', error.response?.data?.message || error.message || 'Could not create a data backup.');
    } finally {
      setWorking(false);
    }
  };

  const exportCsv = async () => {
    setWorking(true);
    try {
      const {data} = await api.get(`/backup/csv/${business.id}`, {responseType: 'text'});
      const file = `${FileSystem.cacheDirectory}transactions-${business.id}.csv`;
      await FileSystem.writeAsStringAsync(file, data, {encoding: FileSystem.EncodingType.UTF8});
      await shareFile(file, 'text/csv', 'Export transactions as CSV');
    } catch (error) {
      Alert.alert('Export failed', error.response?.data?.message || error.message || 'Could not export transactions.');
    } finally {
      setWorking(false);
    }
  };

  const restoreBackup = async () => {
    setWorking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const contents = await FileSystem.readAsStringAsync(result.assets[0].uri, {encoding: FileSystem.EncodingType.UTF8});
      const backup = JSON.parse(contents);
      if (backup.format !== 'business-manager-backup' || backup.version !== 1)
        throw new Error('This file is not a supported Business Manager backup.');
      Alert.alert(
        'Merge backup?',
        'Existing records will be kept. Missing businesses and records from this backup will be added.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Restore', onPress: async () => {
            try {
              const {data} = await api.post('/backup/restore', backup);
              Alert.alert('Restore complete', `${data.message}\nBusinesses: ${data.restored.businesses} · Transactions: ${data.restored.transactions}`);
            } catch (error) {
              Alert.alert('Restore failed', error.response?.data?.message || 'Could not restore this backup.');
            }
          }},
        ],
      );
    } catch (error) {
      Alert.alert('Restore failed', error.message || 'Could not read the selected backup file.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <Page>
      <Text style={styles.title}>Backup & data export</Text>
      <Text style={styles.subtitle}>Save a full account backup or export this business's transactions.</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Full account backup</Text>
        <Text style={[styles.muted, {marginBottom: 14}]}>Includes owned businesses, transactions, invoices, budgets, and recurring schedules.</Text>
        <Primary title="Create and share JSON backup" onPress={exportBackup} loading={working} disabled={working} />
        <Primary title="Restore from JSON backup" variant="secondary" onPress={restoreBackup} disabled={working} />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Transaction export</Text>
        <Text style={[styles.muted, {marginBottom: 14}]}>{business.name} · CSV format, compatible with spreadsheet apps.</Text>
        <Primary title="Export transactions as CSV" variant="secondary" onPress={exportCsv} disabled={working} />
      </View>
      <Text style={[styles.muted, {marginBottom: 12}]}>Restore merges missing records and does not delete existing data. Team memberships are not included in account backups.</Text>
    </Page>
  );
}

function MainNavigator() {
  const {colors} = useContext(ThemeContext);
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: {backgroundColor: colors.surface},
      headerTintColor: colors.ink,
      headerTitleStyle: {fontWeight: '800'},
      headerShadowVisible: false,
      contentStyle: {backgroundColor: colors.background},
    }}>
      <Stack.Screen
        name="Businesses"
        component={BusinessesScreen}
        options={({navigation}) => ({
          title: 'Workspace',
          headerRight: () => (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('Settings')}
              style={{paddingVertical: 8, paddingLeft: 12}}>
              <Text style={{color: colors.primary, fontWeight: '700'}}>Settings</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{title: 'Profile'}} />
      <Stack.Screen name="About" component={AboutScreen} options={{title: 'About'}} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{title: 'Overview'}} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{title: 'New transaction'}} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} options={{title: 'History'}} />
      <Stack.Screen name="Recurring" component={RecurringScreen} options={{title: 'Recurring'}} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} options={{title: 'Invoices'}} />
      <Stack.Screen name="Budgets" component={BudgetsScreen} options={{title: 'Budgets'}} />
      <Stack.Screen name="Team" component={TeamScreen} options={{title: 'Team access'}} />
      <Stack.Screen name="DataTools" component={DataToolsScreen} options={{title: 'Backup & export'}} />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={AuthScreen} />
      <Stack.Screen name="SignUp" component={AuthScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet(['token', 'dark_mode'])
      .then(entries => {
        if (active) {
          const stored = Object.fromEntries(entries);
          setToken(stored.token);
          setDarkMode(stored.dark_mode === 'true');
        }
      })
      .catch(() => Alert.alert('Error', 'Could not read saved app settings. Please restart the app.'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const updateDarkMode = async value => {
    try {
      await AsyncStorage.setItem('dark_mode', String(value));
      setDarkMode(value);
    } catch {
      Alert.alert('Error', 'Could not save your appearance preference.');
    }
  };
  const colors = darkMode ? darkColors : lightColors;
  const theme = useMemo(() => ({
    colors,
    styles: createStyles(colors),
    darkMode,
    setDarkMode: updateDarkMode,
  }), [darkMode]);

  if (loading) {
    return (
      <SafeAreaView style={[initialStyles.page, initialStyles.center]}>
        <ActivityIndicator size="large" color={lightColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <AuthContext.Provider value={{setToken}}>
      <ThemeContext.Provider value={theme}>
        <NavigationContainer>
          {token ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
