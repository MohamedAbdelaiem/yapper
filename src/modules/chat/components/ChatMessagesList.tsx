import { Theme } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import ChatBubble from '@/src/modules/chat/components/ChatBubble';
import { IChatMessageItem, IChatMessageSender } from '@/src/modules/chat/types';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface ChatMessagesListProps {
  messages: IChatMessageItem[];
  currentUserId?: string;
  sender?: IChatMessageSender | null;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  isOtherUserTyping?: boolean;
}

export default function ChatMessagesList({
  messages,
  currentUserId,
  sender,
  onLoadMore,
  isLoadingMore,
  hasMore,
  isOtherUserTyping,
}: ChatMessagesListProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const flashListRef = React.useRef<FlashListRef<IChatMessageItem> | null>(null);

  React.useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Also scroll when typing indicator appears
  React.useEffect(() => {
    if (isOtherUserTyping) {
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOtherUserTyping]);

  const renderMessage = ({ item }: { item: IChatMessageItem }) => {
    // Determine if message is from current user
    // If senderId exists on message, use it; otherwise use sender info from response
    const isOwn = item.senderId ? item.senderId === currentUserId : sender?.id !== currentUserId;

    return <ChatBubble message={item} isOwn={isOwn} />;
  };

  const renderHeader = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color={theme.colors.accent.bookmark} />
      </View>
    );
  };

  const renderFooter = () => {
    if (!isOtherUserTyping) return null;
    return (
      <View style={styles.typingIndicator}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  const handleStartReached = () => {
    if (hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <FlashList
      ref={flashListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { paddingBottom: theme.spacing.sm }]}
      maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 100,
        startRenderingFromBottom: true,
      }}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      onScrollBeginDrag={handleStartReached}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    listContent: {
      paddingTop: theme.spacing.md,
    },
    loadingHeader: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
    typingIndicator: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xs,
      alignItems: 'flex-start',
    },
    typingBubble: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.text.secondary,
      opacity: 0.6,
    },
    typingDot1: {
      opacity: 0.4,
    },
    typingDot2: {
      opacity: 0.6,
    },
    typingDot3: {
      opacity: 0.8,
    },
  });
