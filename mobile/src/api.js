import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the computer's Wi-Fi IP so physical devices on the same network can reach the API.
export const API_URL = 'http://192.168.1.4:4000/api';
export const api = axios.create({ baseURL: API_URL, timeout: 20000 });
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
