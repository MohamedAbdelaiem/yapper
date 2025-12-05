import { Theme } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import useSpacing from '@/src/hooks/useSpacing';
import ChatHeader from '@/src/modules/chat/components/ChatHeader';
import ChatInput from '@/src/modules/chat/components/ChatInput';
import ChatMessagesList from '@/src/modules/chat/components/ChatMessagesList';
import { useChatConversation } from '@/src/modules/chat/hooks/useChatConversation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

export default function ChatConversationPage() {
  const params = useLocalSearchParams<{ id: string; name?: string; username?: string; avatarUrl?: string }>();
  const { id: chatId } = params;
  const router = useRouter();
  const { theme } = useTheme();
  const { top, bottom } = useSpacing();
  const headerPadding = top - theme.ui.appBarHeight - theme.ui.tabViewHeight;
  const styles = createStyles(theme);

  // Use route params for participant info (passed from chat list)
  const userName = params.name || 'Unknown User';
  const userUsername = params.username || 'unknown';

  // Use custom hook for all chat logic
  const {
    messages,
    sender,
    currentUserId,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    inputText,
    isOtherUserTyping,
    isKeyboardVisible,
    handleTextChange,
    handleSend,
    handleLoadMore,
  } = useChatConversation({ chatId: chatId as string });

  const inputPadding = isKeyboardVisible ? theme.spacing.lg : bottom + theme.spacing.lg;

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: headerPadding }]}>
        <ChatHeader
          name={userName}
          username={userUsername}
          avatarUrl={params.avatarUrl}
          onBack={handleBack}
          onInfo={() => {}}
        />
      </View>
      <View style={styles.messagesContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent.bookmark} />
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load messages</Text>
          </View>
        ) : (
          <ChatMessagesList
            messages={messages}
            currentUserId={currentUserId}
            sender={sender}
            onLoadMore={handleLoadMore}
            isLoadingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            isOtherUserTyping={isOtherUserTyping}
          />
        )}
      </View>
      <ChatInput
        value={inputText}
        onChangeText={handleTextChange}
        onSend={handleSend}
        style={{ paddingBottom: inputPadding }}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      paddingBottom: theme.spacing.lg,
    },
    header: {
      backgroundColor: theme.colors.background.primary,
    },
    messagesContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.secondary,
    },
  });
