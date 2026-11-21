import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useStrings } from '@/i18n';
import { colors } from '@/theme/tokens';

import { T } from './T';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Hoja modal (pageSheet en iOS; se cierra deslizando hacia abajo). */
export function Sheet({ visible, title, onClose, children }: Props) {
  const s = useStrings();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <View style={styles.side} />
          <T size={17} weight={600}>
            {title}
          </T>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose} style={styles.side}>
            <T size={15} weight={600} color={colors.lilac} style={styles.done}>
              {s.common.done}
            </T>
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#17132F' },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginTop: 8, backgroundColor: 'rgba(201,182,255,0.3)' },
  header: { height: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { width: 60 },
  done: { textAlign: 'right' },
});
