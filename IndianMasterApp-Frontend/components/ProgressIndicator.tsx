import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  percentage?: number;
  label?: string;
  stepTitle?: string;
  type?: 'default' | 'compact';
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  percentage,
  label,
  stepTitle,
  type = 'default'
}: ProgressIndicatorProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('workerProfile.profileCompletion');
  const displayPercentage = percentage !== undefined
    ? percentage
    : Math.round((currentStep / totalSteps) * 100);

  if (type === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.circleTrack}>
          <View style={[styles.circleFill, { height: `${displayPercentage}%` }]} />
          <Text style={styles.compactText}>{displayPercentage}%</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{resolvedLabel}</Text>
        <Text style={styles.percentageText}>{displayPercentage}%</Text>
      </View>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${displayPercentage}%` }
          ]}
        />
      </View>

      <Text style={styles.stepInfo}>
        {t('stepLabel', { step: currentStep })}: {stepTitle || `${t('section')} ${currentStep}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondaryLight,
    padding: SPACING.md,
    borderRadius: SIZES.radius,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTrack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  circleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary + '20',
  },
  compactText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  stepInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});