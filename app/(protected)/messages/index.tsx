import FloatingActionButton from '@/src/components/FloatingActionButton';
import AppBar from '@/src/components/shell/AppBar';
import { Theme } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import useSpacing from '@/src/hooks/useSpacing';
import MessagesList from '@/src/modules/chat/components/MessagesList';
import { getChats } from '@/src/modules/chat/services/chatService';
import { chatSocketService, INewMessageData, IUnreadChatsSummary } from '@/src/modules/chat/services/chatSocketService';
import { IChat } from '@/src/modules/chat/types';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MailPlus, SettingsIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHATS_PER_PAGE = 20;

export default function MessagesPage() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bottom } = useSpacing();
  const styles = createStyles(theme);
  const [searchQuery] = React.useState('');
  const top = insets.top + theme.ui.appBarHeight;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['chats'],
      queryFn: ({ pageParam }) => getChats({ limit: CHATS_PER_PAGE, cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined),
    });

  // Handle new message - refresh chat list to show updated last message
  const handleNewMessage = useCallback(
    (_data: INewMessageData) => {
      // Invalidate chats query to refresh the list with new message
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    [queryClient],
  );

  // Handle unread chats summary (sent on connection)
  const handleUnreadSummary = useCallback(
    (_data: IUnreadChatsSummary) => {
      // Refresh chat list to update unread counts
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    [queryClient],
  );

  // Set up socket listeners
  useEffect(() => {
    chatSocketService.onNewMessage(handleNewMessage);
    chatSocketService.onUnreadChatsSummary(handleUnreadSummary);

    return () => {
      chatSocketService.offNewMessage(handleNewMessage);
      chatSocketService.offUnreadChatsSummary(handleUnreadSummary);
    };
  }, [handleNewMessage, handleUnreadSummary]);

  // Flatten all pages into a single array
  const chats = useMemo(() => {
    return data?.pages.flatMap((page) => page.chats) ?? [];
  }, [data]);

  // Filter chats by search query (client-side)
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.participant.name?.toLowerCase().includes(query) || chat.participant.username.toLowerCase().includes(query),
    );
  }, [chats, searchQuery]);

  const handleChatPress = (chat: IChat) => {
    router.push({
      pathname: `/messages/${chat.id}` as const,
      params: {
        name: chat.participant.name || chat.participant.username,
        username: chat.participant.username,
        avatarUrl: chat.participant.avatarUrl || '',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  const handleWriteMessage = () => {
    // TODO: Open new message composer modal
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <View style={styles.container}>
      <View style={styles.appBarWrapper}>
        <AppBar rightElement={<SettingsIcon color={theme.colors.text.primary} />}>
          <Text style={styles.title}>Messages</Text>
        </AppBar>
      </View>
      <View style={{ marginTop: top }} />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.bookmark} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load messages</Text>
        </View>
      ) : (
        <MessagesList
          chats={filteredChats}
          onChatPress={handleChatPress}
          onWriteMessage={handleWriteMessage}
          onLoadMore={handleLoadMore}
          onRefresh={handleRefresh}
          isLoadingMore={isFetchingNextPage}
          isRefreshing={isRefetching}
          hasMore={hasNextPage && !searchQuery.trim()}
        />
      )}
      <FloatingActionButton
        onPress={handleWriteMessage}
        icon={<MailPlus color={theme.colors.text.primary} size={24} strokeWidth={2.5} />}
        style={{ bottom: bottom + theme.spacing.lg, right: theme.spacing.lg }}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    appBarWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontFamily: theme.typography.fonts.bold,
      color: theme.colors.text.primary,
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
