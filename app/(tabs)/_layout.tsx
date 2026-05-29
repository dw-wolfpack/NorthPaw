import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { TAB_HOME_TITLE, TAB_LIBRARY_TITLE } from '@/constants/NavCopy';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 12;
  const barHeight = 64 + bottomPadding;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ route }) => {
        const title = route.name === 'index' ? TAB_HOME_TITLE :
                      route.name === 'library' ? TAB_LIBRARY_TITLE :
                      route.name === 'checklists' ? 'Checklists' :
                      route.name === 'settings' ? 'Settings' : '';
        return {
          tabBarActiveTintColor: colorScheme === 'dark' ? '#EAEAEA' : '#0F7A3B',
          tabBarInactiveTintColor: colorScheme === 'dark' ? 'rgba(234, 234, 234, 0.52)' : 'rgba(13, 27, 20, 0.52)',
          headerShown: false,
          tabBarLabel: ({ focused, color }) => focused ? (
            <Text style={{
              fontSize: 9,
              fontWeight: '700',
              color,
              marginTop: 2,
            }}>
              {title}
            </Text>
          ) : null,
          tabBarBackground: () => (
            <BlurView
              intensity={80}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }]}
            />
          ),
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: barHeight,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: colorScheme === 'dark' ? 'rgba(8, 16, 12, 0.74)' : 'rgba(240, 245, 242, 0.74)',
            borderWidth: 1,
            borderBottomWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderTopWidth: 1,
            borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 0,
            paddingBottom: bottomPadding,
          },
          tabBarItemStyle: {
            height: 64,
            justifyContent: 'center',
            alignItems: 'center',
          },
        };
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: TAB_HOME_TITLE,
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: TAB_LIBRARY_TITLE,
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: 'Checklists',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-ul" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
