import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {api} from './src/api';

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
      Alert.alert('Error', error.response?.data?.message || 'Cannot connect to API. Check backend and API_URL.');
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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    api.get('/businesses')
      .then(response => {
        if (active) setItems(response.data);
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add a business</Text>
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
      <Primary
        title="View transaction history"
        variant="secondary"
        onPress={() => navigation.navigate('Transactions', {business})}
      />
    </Page>
  );
}

function AddTransactionScreen({route, navigation}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business, type} = route.params;
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const isIncome = type === 'INCOME';

  const save = async () => {
    const numericAmount = Number(amount);
    if (!category.trim() || !amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return Alert.alert('Check your details', 'Enter a category and an amount greater than zero.');
    }
    setSaving(true);
    try {
      await api.post('/transactions', {
        businessId: business.id,
        type,
        category: category.trim(),
        amount: numericAmount,
        description: description.trim(),
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
        <Field value={category} onChangeText={setCategory} placeholder="Category (e.g. rent, salary)" />
        <Field
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount in INR"
          keyboardType="decimal-pad"
          autoCapitalize="none"
        />
        <Field value={description} onChangeText={setDescription} placeholder="Description (optional)" />
        <Primary title="Save transaction" onPress={save} loading={saving} disabled={saving} />
      </View>
    </Page>
  );
}

function TransactionsScreen({route}) {
  const {colors, styles} = useContext(ThemeContext);
  const {business} = route.params;
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('ALL');
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
    api.get('/transactions', {params: {businessId: business.id}})
      .then(response => {
        if (active) setRows(response.data);
      })
      .catch(() => {
        if (active) {
          setLoadError(true);
          Alert.alert('Error', 'Could not load transactions');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [business.id]);

  const dateRangeInvalid = fromDate && toDate &&
    new Date(fromDate).setHours(0, 0, 0, 0) > new Date(toDate).setHours(0, 0, 0, 0);
  const sortedRows = [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredRows = sortedRows.filter(item => {
    if (filter !== 'ALL' && item.type !== filter) return false;
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
  const visibleRows = filteredRows.slice(0, visibleCount);
  const incomeTotal = filteredRows.reduce(
    (total, item) => total + (item.type === 'INCOME' ? Number(item.amount) : 0),
    0,
  );
  const expenseTotal = filteredRows.reduce(
    (total, item) => total + (item.type === 'EXPENSE' ? Number(item.amount) : 0),
    0,
  );
  const filters = [
    {label: 'All', value: 'ALL'},
    {label: 'Income', value: 'INCOME'},
    {label: 'Expenses', value: 'EXPENSE'},
  ];

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
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
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
            <View style={[styles.content, styles.transactionCard]}>
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
                <Text style={[styles.transactionAmount, {color: income ? colors.green : colors.red}]}>
                  {income ? '+' : '−'}₹{Number(item.amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                </Text>
              </View>
              <View style={styles.transactionMeta}>
                <View style={[styles.transactionTag, income ? {backgroundColor: colors.greenLight} : {backgroundColor: colors.redLight}]}>
                  <Text style={[styles.transactionTagText, income ? {color: colors.green} : {color: colors.red}]}>
                    {income ? 'INCOME' : 'EXPENSE'}
                  </Text>
                </View>
                <Text style={styles.small}>{new Date(item.date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}</Text>
              </View>
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
