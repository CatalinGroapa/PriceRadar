import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEV_MACHINE_IP = '192.168.1.47';

function getExpoHostIp() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    '';

  if (!hostUri) return '';
  return hostUri.split(':')[0];
}

function defaultBaseUrl() {
  if (DEV_MACHINE_IP) {
    return `http://${DEV_MACHINE_IP}:3000`;
  }

  const expoHostIp = getExpoHostIp();
  if (expoHostIp) {
    return `http://${expoHostIp}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const API_BASE_URL = defaultBaseUrl();
