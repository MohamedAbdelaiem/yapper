import api from '@/src/services/apiClient';
import { extractErrorMessage } from '@/src/utils/errorExtraction';
import {
  IChat,
  IChatMessageItem,
  IChatMessagesData,
  IChatPagination,
  IGetChatsResponse,
  IGetMessagesResponse,
} from '../types';

export interface IGetChatsParams {
  limit?: number;
  cursor?: string;
}

export interface IGetChatsResult {
  chats: IChat[];
  pagination: IChatPagination;
}

// Get paginated list of chats for the authenticated user
export const getChats = async (params?: IGetChatsParams): Promise<IGetChatsResult> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.cursor) {
      queryParams.append('cursor', params.cursor);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/chat?${queryString}` : '/chat';

    const response = await api.get<IGetChatsResponse>(url);

    return {
      chats: response.data.data.data,
      pagination: response.data.data.pagination,
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// Get a specific chat by ID
export const getChatById = async (chatId: string): Promise<IChat> => {
  try {
    const response = await api.get<{ data: IChat }>(`/chat/${chatId}`);
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export interface IGetMessagesParams {
  chatId: string;
  limit?: number;
  cursor?: string;
}

export interface IGetMessagesResult {
  chatId: string;
  sender: IChatMessagesData['sender'];
  messages: IChatMessageItem[];
  pagination: IChatPagination;
}

// Get paginated messages for a specific chat
export const getMessages = async (params: IGetMessagesParams): Promise<IGetMessagesResult> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.cursor) {
      queryParams.append('cursor', params.cursor);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/messages/chats/${params.chatId}/messages?${queryString}`
      : `/messages/chats/${params.chatId}/messages`;

    const response = await api.get<IGetMessagesResponse>(url);

    return {
      chatId: response.data.data.data.chatId,
      sender: response.data.data.data.sender,
      messages: response.data.data.data.messages,
      pagination: response.data.data.pagination,
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
