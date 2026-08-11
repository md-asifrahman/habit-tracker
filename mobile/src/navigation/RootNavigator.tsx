import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, fonts } from '../theme/useTheme';
import TodayScreen from '../screens/TodayScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import AddChallengeScreen from '../screens/AddChallengeScreen';
import { TodayIcon, ChallengesIcon, SettingsIcon } from '../components/icons';

export type RootStackParamList = {
  Tabs: undefined;
  ChallengeDetail: { challengeId: string };
  /** Doubles as the edit flow when a challengeId is passed. */
  AddChallenge: { challengeId?: string };
};

export type TabParamList = {
  Today: undefined;
  Challenges: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 10 },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarIcon: ({ color, size }) => <TodayIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{ tabBarIcon: ({ color, size }) => <ChallengesIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { colors, scheme } = useTheme();
  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.surface,
      border: colors.border,
      text: colors.text,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="AddChallenge" component={AddChallengeScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
