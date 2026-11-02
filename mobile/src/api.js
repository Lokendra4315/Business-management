import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set EXPO_PUBLIC_API_URL when your development computer's LAN address changes.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:4000/api';
export const api = axios.create({ baseURL: API_URL, timeout: 20000 });
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
