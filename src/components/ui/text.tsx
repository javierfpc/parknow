import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { fonts, useTheme, type ThemeColors } from '@/theme';

const variantes = {
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type Variante = keyof typeof variantes;

type Props = TextProps & { variant?: Variante; color?: keyof ThemeColors | (string & {}); center?: boolean };

export function Text({ variant = 'body', color = 'text', center, style, ...rest }: Props) {
  const { colors } = useTheme();
  const c = (colors as Record<string, unknown>)[color];
  return (
    <RNText
      {...rest}
      style={[variantes[variant], { color: typeof c === 'string' ? c : color }, center && { textAlign: 'center' }, style]}
    />
  );
}
