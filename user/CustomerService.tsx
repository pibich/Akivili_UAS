// src/user/CustomerService.tsx
import React from 'react';
import {
  SafeAreaView, View, Text,
  TouchableOpacity, StyleSheet, StatusBar
} from 'react-native';

type Props = { navigation: any };

export default function CustomerService({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>Akivili.</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Customer Service</Text>
        <Text style={styles.subtitle}>
          Bila ada yang perlu dipertanyakan silahkan…
        </Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.csButton}>
            <Text style={styles.csButtonTxt}>Kontak 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.csButton}>
            <Text style={styles.csButtonTxt}>Kontak 2</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { marginTop: 32 }]}>Jam Kerja</Text>
        <Text style={styles.subtitle}>
          Setiap hari pukul 07.00 hingga 23.00, kecuali libur nasional.
        </Text>
        <Text style={[styles.title, { marginTop: 32 }]}>Informasi Penting</Text>
        <Text style={styles.subtitle}>
          Kesalahan input data tidak dapat direfund…
        </Text>
      </View>
    </SafeAreaView>
  );
}

const PRIMARY = '#FFA800';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header:    { height:60, backgroundColor: PRIMARY, justifyContent:'center', paddingHorizontal:20 },
  logo:      { fontSize:24, fontWeight:'bold', color:'#FFF' },
  body:      { flex:1, padding:20 },
  title:     { fontSize:20, fontWeight:'700', textAlign:'center' },
  subtitle:  { fontSize:14, color:'#555', textAlign:'center', marginTop:8, lineHeight:20 },
  buttonsRow:{ flexDirection:'row', justifyContent:'space-evenly', marginTop:16 },
  csButton:  { backgroundColor:PRIMARY, paddingVertical:12, paddingHorizontal:24, borderRadius:100 },
  csButtonTxt:{ fontSize:14, fontWeight:'600', color:'#000' },
});
