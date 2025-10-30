import { View, StyleSheet } from 'react-native';
import React, { useMemo, useState } from 'react';
import TopBar from '@/src/modules/auth/components/shared/TopBar';
import AuthInput from '@/src/modules/auth/components/shared/AuthInput';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

const BirthDateScreen = () => {
  const [birthDate, setBirthDate] = useState('');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar without exit button */}
      <TopBar showExitButton={false} />

      <View style={styles.content}>
        <AuthInput
          title={t('auth.birthDate.title')}
          description={t('auth.birthDate.description')}
          label={t('auth.birthDate.label')}
          value={birthDate}
          onChange={setBirthDate}
          type="date"
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      justifyContent: 'center',
    },
  });

export default BirthDateScreen;
