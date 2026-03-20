import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SalarySliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

export default function SalarySlider({ min, max, step = 1000, value, onValueChange }: SalarySliderProps) {
  const { t } = useTranslation();
  const [sliderWidth, setSliderWidth] = useState(0);
  const [minValue, setMinValue] = useState(value[0]);
  const [maxValue, setMaxValue] = useState(value[1]);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const sliderRef = useRef<View>(null);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  const snapToStep = (val: number) => {
    const snapped = Math.round(val / step) * step;
    return Math.max(min, Math.min(max, snapped));
  };

  const handleTouchStart = useCallback((thumb: 'min' | 'max') => {
    setActiveThumb(thumb);
  }, []);

  const handleTouchMove = useCallback((event: any) => {
    if (!activeThumb || sliderWidth === 0) return;

    const touch = event.nativeEvent.touches[0];
    sliderRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const touchX = touch.pageX - pageX;
      const percentage = Math.max(0, Math.min(100, (touchX / width) * 100));
      const rawValue = (percentage / 100) * (max - min) + min;
      const newValue = snapToStep(rawValue);

      if (activeThumb === 'min') {
        const constrainedValue = Math.min(newValue, maxValue - step);
        setMinValue(constrainedValue);
        onValueChange([constrainedValue, maxValue]);
      } else {
        const constrainedValue = Math.max(newValue, minValue + step);
        setMaxValue(constrainedValue);
        onValueChange([minValue, constrainedValue]);
      }
    });
  }, [activeThumb, sliderWidth, minValue, maxValue, min, max, step, onValueChange]);

  const handleTouchEnd = useCallback(() => {
    setActiveThumb(null);
  }, []);

  const minPercent = getPercentage(minValue);
  const maxPercent = getPercentage(maxValue);

  const minPos = (minPercent / 100) * sliderWidth;
  const maxPos = (maxPercent / 100) * sliderWidth;
  const activeWidth = maxPos - minPos;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{t('expectedSalary')}</Text>
        <Text style={styles.valueText}>
          ₹{minValue.toLocaleString()} - ₹{maxValue.toLocaleString()}
        </Text>
      </View>

      <View
        ref={sliderRef}
        style={styles.sliderContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      >
        {/* Background Track */}
        <View style={styles.trackBackground} />

        {/* Active Track */}
        <View
          style={[
            styles.trackActive,
            {
              left: minPos,
              width: activeWidth
            }
          ]}
        />

        {/* Min Thumb */}
        <View
          style={[
            styles.thumbContainer,
            { left: minPos - 25 },
            activeThumb === 'min' && styles.thumbActive
          ]}
          onTouchStart={() => handleTouchStart('min')}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <View style={[styles.thumb, activeThumb === 'min' && styles.thumbPressed]} />
        </View>

        {/* Max Thumb */}
        <View
          style={[
            styles.thumbContainer,
            { left: maxPos - 25 },
            activeThumb === 'max' && styles.thumbActive
          ]}
          onTouchStart={() => handleTouchStart('max')}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <View style={[styles.thumb, activeThumb === 'max' && styles.thumbPressed]} />
        </View>
      </View>

      <View style={styles.labels}>
        <Text style={styles.minMax}>₹{min.toLocaleString()}</Text>
        <Text style={styles.minMax}>₹{max.toLocaleString()}+</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sliderContainer: {
    height: 50,
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  trackBackground: {
    height: TRACK_HEIGHT,
    backgroundColor: COLORS.borderLight,
    borderRadius: TRACK_HEIGHT / 2,
    width: '100%',
    position: 'absolute',
  },
  trackActive: {
    height: TRACK_HEIGHT,
    backgroundColor: COLORS.primary,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
  },
  thumbContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    marginLeft: -25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
      }
    }),
  },
  thumbActive: {
    zIndex: 20,
  },
  thumbPressed: {
    transform: [{ scale: 1.15 }],
    borderWidth: 5,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  minMax: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});