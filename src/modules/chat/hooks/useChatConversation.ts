import { useAuthStore } from '@/src/store/useAuthStore';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { getMessages } from '../services/chatService';
import { chatSocketService, INewMessageData, IUserTypingData } from '../services/chatSocketService';
import { IChatMessageItem, IChatMessageSender } from '../types';

const MESSAGES_PER_PAGE = 50;

interface UseChatConversationOptions {
  chatId: string;
}

interface UseChatConversationReturn {
  // Data
  messages: IChatMessageItem[];
  sender: IChatMessageSender | null;
  currentUserId: string | undefined;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;

  // Typing state
  inputText: string;
  isOtherUserTyping: boolean;
  isKeyboardVisible: boolean;

  // Actions
  handleTextChange: (text: string) => void;
  handleSend: () => void;
  handleLoadMore: () => void;
}

export function useChatConversation({ chatId }: UseChatConversationOptions): UseChatConversationReturn {
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch messages with pagination
  const {
    data: messagesData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: ({ pageParam }) => getMessages({ chatId, limit: MESSAGES_PER_PAGE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined),
    enabled: !!chatId,
  });

  // Flatten messages from all pages and get sender info
  const { messages, sender } = useMemo(() => {
    if (!messagesData?.pages.length) {
      return { messages: [], sender: null };
    }
    const senderInfo = messagesData.pages[0]?.sender || null;
    const allMessages = messagesData.pages.flatMap((page) => page.messages);
    return { messages: allMessages, sender: senderInfo };
  }, [messagesData]);

  // Join chat room on mount, leave on unmount
  useEffect(() => {
    if (!chatId) return;

    chatSocketService.joinChat(chatId);

    return () => {
      chatSocketService.leaveChat(chatId);
    };
  }, [chatId]);

  // Handle new incoming messages
  const handleNewMessage = useCallback(
    (data: INewMessageData) => {
      if (data.chatId !== chatId) return;
      refetch();
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    [chatId, refetch, queryClient],
  );

  // Handle message sent confirmation
  const handleMessageSent = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  }, [refetch, queryClient]);

  // Handle typing indicators
  const handleUserTyping = useCallback(
    (data: IUserTypingData) => {
      if (data.chatId === chatId && data.userId !== currentUser?.id) {
        setOtherUserTyping(true);
      }
    },
    [chatId, currentUser?.id],
  );

  const handleUserStoppedTyping = useCallback(
    (data: IUserTypingData) => {
      if (data.chatId === chatId && data.userId !== currentUser?.id) {
        setOtherUserTyping(false);
      }
    },
    [chatId, currentUser?.id],
  );

  // Set up socket listeners
  useEffect(() => {
    chatSocketService.onNewMessage(handleNewMessage);
    chatSocketService.onMessageSent(handleMessageSent);
    chatSocketService.onUserTyping(handleUserTyping);
    chatSocketService.onUserStoppedTyping(handleUserStoppedTyping);

    return () => {
      chatSocketService.offNewMessage(handleNewMessage);
      chatSocketService.offMessageSent(handleMessageSent);
      chatSocketService.offUserTyping(handleUserTyping);
      chatSocketService.offUserStoppedTyping(handleUserStoppedTyping);
    };
  }, [handleNewMessage, handleMessageSent, handleUserTyping, handleUserStoppedTyping]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Handle text input changes with typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);

      if (text.length > 0 && !isTyping) {
        setIsTyping(true);
        chatSocketService.startTyping(chatId);
      } else if (text.length === 0 && isTyping) {
        setIsTyping(false);
        chatSocketService.stopTyping(chatId);
      }
    },
    [chatId, isTyping],
  );

  // Handle sending a message
  const handleSend = useCallback(() => {
    if (inputText.trim() && chatId) {
      const content = inputText.trim();

      chatSocketService.sendMessage(chatId, content);

      if (isTyping) {
        setIsTyping(false);
        chatSocketService.stopTyping(chatId);
      }

      setInputText('');
    }
  }, [chatId, inputText, isTyping]);

  // Handle loading more messages (pagination)
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    messages,
    sender,
    currentUserId: currentUser?.id,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    inputText,
    isOtherUserTyping: otherUserTyping,
    isKeyboardVisible,
    handleTextChange,
    handleSend,
    handleLoadMore,
  };
}
