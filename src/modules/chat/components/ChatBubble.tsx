import { Theme } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { IChatMessageItem } from '@/src/modules/chat/types';
import { formatMessageTime } from '@/src/modules/chat/utils/formatters';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ChatBubbleProps {
  message: IChatMessageItem;
  isOwn: boolean;
}

export default function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>{message.content}</Text>
      </View>
      <Text style={styles.timestamp}>{formatMessageTime(message.createdAt)}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
    },
    ownContainer: {
      alignItems: 'flex-end',
    },
    otherContainer: {
      alignItems: 'flex-start',
    },
    bubble: {
      maxWidth: '75%',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
    },
    ownBubble: {
      backgroundColor: theme.colors.accent.bookmark,
    },
    otherBubble: {
      backgroundColor: theme.colors.background.secondary,
    },
    text: {
      fontSize: theme.typography.sizes.md,
      lineHeight: theme.typography.sizes.md * theme.typography.lineHeights.relaxed,
    },
    ownText: {
      color: theme.colors.text.inverse,
    },
    otherText: {
      color: theme.colors.text.primary,
    },
    timestamp: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xxs,
    },
  });
