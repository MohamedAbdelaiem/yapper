import { Theme } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const REACTIONS = ['❤️', '😂', '😮', '😢', '😠', '👍'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const PICKER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 250);

interface ReactionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onReactionSelect: (emoji: string) => void;
  onMorePress?: () => void;
  selectedEmoji?: string;
  messageContent?: string;
  isOwnMessage?: boolean;
  touchY?: number;
}

export default function ReactionPickerModal({
  visible,
  onClose,
  onReactionSelect,
  onMorePress,
  selectedEmoji,
  touchY,
}: ReactionPickerModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  const handleReactionPress = (emoji: string) => {
    onReactionSelect(emoji);
    onClose();
  };

  const getPositionStyle = () => {
    if (!touchY) return {};

    const isTopThird = touchY < SCREEN_HEIGHT * 0.3;
    const offset = 20;

    if (isTopThird) {
      return {
        position: 'absolute' as const,
        top: touchY - offset,
      };
    }

    return {
      position: 'absolute' as const,
      bottom: SCREEN_HEIGHT - touchY + offset,
    };
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.contentWrapper, getPositionStyle()]}>
          {/* Reaction picker bar */}
          <View style={styles.pickerContainer}>
            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                style={({ pressed }) => [
                  styles.reactionButton,
                  pressed && styles.reactionButtonPressed,
                  emoji === selectedEmoji && styles.selectedReaction,
                ]}
                onPress={() => handleReactionPress(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [
                styles.reactionButton,
                styles.moreButton,
                pressed && styles.reactionButtonPressed,
              ]}
              onPress={() => {
                onMorePress?.();
                onClose();
              }}
            >
              <Plus color={theme.colors.text.secondary} size={20} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // Lighter overlay since we position contextually
    },
    contentWrapper: {
      alignItems: 'center',
      alignSelf: 'center', // Center horizontally
      paddingHorizontal: theme.spacing.lg,
      maxWidth: '85%',
      // Default center if no position
      marginTop: 'auto',
      marginBottom: 'auto',
    },
    pickerContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.full, // Pill shape
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
      width: PICKER_WIDTH,
      justifyContent: 'space-evenly',
    },
    reactionButton: {
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
    },
    reactionButtonPressed: {
      backgroundColor: theme.colors.background.secondary,
      transform: [{ scale: 1.2 }],
    },
    reactionEmoji: {
      fontSize: 24,
    },
    moreButton: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.xs,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      paddingLeft: theme.spacing.sm,
    },
    selectedReaction: {
      backgroundColor: theme.colors.accent.bookmark + '30',
      borderRadius: theme.borderRadius.full,
    },
    // ... removed unused message bubble styles
  });
