import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ArticlesScreen from '../screens/ArticlesScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import QuranScreen from '../screens/QuranScreen';
import SurahDetailScreen from '../screens/SurahDetailScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import QiblaScreen from '../screens/QiblaScreen';
import AuthScreen from '../screens/AuthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TermsAgreementScreen, { TERMS_AGREED_KEY } from '../screens/TermsAgreementScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import { View, StyleSheet } from 'react-native';

import { useTheme } from '../context/ThemeContext';

function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.floatingTabBar,
          {
            backgroundColor: theme.glassNav,
            borderColor: theme.glassBorder,
          },
        ],
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Articles') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Quran') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Salah') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Qibla') {
            iconName = focused ? 'compass' : 'compass-outline';
          }

          return (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: theme.primaryTint },
              ]}
            >
              <Ionicons
                name={iconName}
                size={21}
                color={focused ? theme.primary : theme.textTertiary}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Articles" component={ArticlesScreen} />
      <Tab.Screen name="Quran" component={QuranScreen} />
      <Tab.Screen
        name="Salah"
        component={PrayerTimesScreen}
        options={{ tabBarLabel: 'Salah Hub' }}
      />
      <Tab.Screen name="Qibla" component={QiblaScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingTabBar: {
    position: 'absolute',
    bottom: 22,
    left: 18,
    right: 18,
    backgroundColor: Colors.glassNav,
    borderRadius: 36,
    height: 70,
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  tabBarItem: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 26,
    borderRadius: 13,
  },
  iconContainerActive: {
    backgroundColor: Colors.primaryTint,
  },
});

export default function AppNavigator() {
  const [hasAgreedTerms, setHasAgreedTerms] = useState(null);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(TERMS_AGREED_KEY)
      .then((val) => {
        if (isMounted) {
          setHasAgreedTerms(Boolean(val));
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasAgreedTerms(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (hasAgreedTerms === null) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={hasAgreedTerms ? 'MainTabs' : 'TermsAgreement'}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      {!hasAgreedTerms && (
        <Stack.Screen
          name="TermsAgreement"
          options={{ headerShown: false }}
        >
          {(props) => (
            <TermsAgreementScreen
              {...props}
              onAgree={() => setHasAgreedTerms(true)}
            />
          )}
        </Stack.Screen>
      )}
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SurahDetail"
        component={SurahDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Account & Bookmarks' }}
      />
      <Stack.Screen
        name="TermsReview"
        component={TermsAgreementScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
