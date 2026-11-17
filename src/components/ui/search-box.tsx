import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { fonts, radius, shadow, useTheme } from '@/theme';

type Props = { valor: string; onChange: (t: string) => void; placeholder?: string; elevado?: boolean };

export function SearchBox({ valor, onChange, placeholder = 'Buscar parqueadero o barrio', elevado }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.caja,
        { backgroundColor: colors.surface, borderColor: colors.border },
        elevado && shadow(2),
      ]}
    >
      <Ionicons name="search" size={19} color={colors.textMuted} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        accessibilityLabel="Buscar parqueadero"
        style={[styles.input, { color: colors.text }]}
      />
      {valor.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={12} accessibilityLabel="Borrar búsqueda">
          <Ionicons name="close-circle" size={19} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, height: '100%' },
});
