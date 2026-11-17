import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/text';

/** Marca de ParkNow: una "P" de parqueo con un pin de ubicación. */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#00B4D8" />
          <Stop offset="0.55" stopColor="#0077B6" />
          <Stop offset="1" stopColor="#02368A" />
        </LinearGradient>
      </Defs>
      <Rect width="64" height="64" rx="18" fill="url(#g)" />
      <Path
        d="M22 48V16h12.5c6.9 0 11.5 4.3 11.5 10.6S41.4 37.2 34.5 37.2H29V48h-7Zm7-17h5c3 0 4.9-1.7 4.9-4.4S37 22.2 34 22.2h-5V31Z"
        fill="#FFFFFF"
      />
      <Path d="M46 41.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" fill="#90E0EF" />
    </Svg>
  );
}

export function Logo({ size = 40, claro }: { size?: number; claro?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      <Text variant="title" style={{ fontSize: size * 0.6, color: claro ? '#FFFFFF' : undefined }}>
        Park<Text variant="title" style={{ fontSize: size * 0.6, color: '#00B4D8' }}>Now</Text>
      </Text>
    </View>
  );
}
