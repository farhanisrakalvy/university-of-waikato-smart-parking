import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestApp() {
  console.log('🧪 TEST APP: Loading without Supabase...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test App</Text>
      <Text style={styles.text}>If you see this, the basic app is working!</Text>
      <Text style={styles.text}>No Supabase connection attempted.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});