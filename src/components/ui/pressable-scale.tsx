import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { vibrar } from '@/services/haptics';

const APressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; escala?: number; haptic?: boolean };

/** Se encoge al presionar y vuelve con rebote al soltar. */
export function PressableScale({ escala = 0.96, haptic = true, style, onPressIn, onPressOut, onPress, ...rest }: Props) {
  const s = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <APressable
      {...rest}
      onPressIn={(e) => {
        s.value = withSpring(escala, { damping: 15, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, { damping: 7, stiffness: 260 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) vibrar.toque();
        onPress?.(e);
      }}
      style={[style, animado]}
    />
  );
}
