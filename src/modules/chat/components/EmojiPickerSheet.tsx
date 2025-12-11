import emojiData from '@/assets/emojis.json';
import CustomBottomSheet from '@/src/components/CustomBottomSheet';
import { Theme } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Emoji {
  emoji: string;
  name: string;
  keywords: string[];
}

interface EmojiCategory {
  title: string;
  data: Emoji[];
}

interface EmojiPickerSheetProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Transform the raw data into a flat list of categories if needed,
// but フラットリスト handles section data well if flattened or using sticky headers.
// The provided JSON is Array<{ title: string, data: Emoji[] }>
const typedEmojiData = emojiData as EmojiCategory[];

export default function EmojiPickerSheet({ onSelect, onClose }: EmojiPickerSheetProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Snap points for the sheet
  const snapPoints = useMemo(() => ['50%', '80%'], []);

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  // Filter emojis based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return typedEmojiData.flatMap((category) => [
        { type: 'header', title: category.title } as const,
        ...category.data.map((emoji) => ({ type: 'emoji', ...emoji }) as const),
      ]);
    }

    const query = searchQuery.toLowerCase();
    const matches: (Emoji & { type: 'emoji' })[] = [];

    for (const category of typedEmojiData) {
      for (const emoji of category.data) {
        if (emoji.name.includes(query) || emoji.keywords.some((k) => k.includes(query))) {
          matches.push({ type: 'emoji', ...emoji });
        }
      }
    }
    return matches;
  }, [searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === 'header') {
        return <Text style={styles.sectionHeader}>{formatCategoryTitle(item.title)}</Text>;
      }

      return (
        <TouchableOpacity
          style={styles.emojiItem}
          onPress={() => {
            onSelect(item.emoji);
            bottomSheetModalRef.current?.dismiss();
          }}
        >
          <Text style={styles.emojiText}>{item.emoji}</Text>
        </TouchableOpacity>
      );
    },
    [onSelect, styles],
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) => (item.type === 'header' ? `header-${item.title}` : item.emoji + index),
    [],
  );

  return (
    <CustomBottomSheet
      bottomSheetModalRef={bottomSheetModalRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enableContentPanningGesture={false}
    >
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder="Search emojis..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.listContainer}>
          <BottomSheetFlatList
            data={filteredData}
            renderItem={renderItem}
            numColumns={8}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            keyExtractor={keyExtractor}
            ListFooterComponent={<View style={{ height: theme.spacing.xxxxxl }} />}
          />
        </View>
      </View>
    </CustomBottomSheet>
  );
}

function formatCategoryTitle(title: string) {
  return title
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      height: 48,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
      height: '100%',
    },
    listContainer: {
      flex: 1,
      minHeight: 2,
    },
    sectionHeader: {
      fontSize: theme.typography.sizes.sm,
      fontFamily: theme.typography.fonts.bold,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      width: '100%',
      paddingLeft: theme.spacing.xs,
    },
    emojiItem: {
      flex: 1,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
    },
    emojiText: {
      fontSize: 28,
    },
  });
