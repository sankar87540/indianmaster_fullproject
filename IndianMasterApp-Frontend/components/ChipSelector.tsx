import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

interface ChipSelectorProps {
  options: string[];
  selectedOptions: string[];
  onSelectionChange: (selected: string[]) => void;
  multiSelect?: boolean;
  style?: any;
}

export default function ChipSelector({
  options,
  selectedOptions,
  onSelectionChange,
  multiSelect = true,
  style
}: ChipSelectorProps) {
  const handlePress = (option: string) => {
    if (multiSelect) {
      if (selectedOptions.includes(option)) {
        onSelectionChange(selectedOptions.filter(item => item !== option));
      } else {
        onSelectionChange([...selectedOptions, option]);
      }
    } else {
      onSelectionChange([option]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.chip,
              isSelected ? styles.selectedChip : styles.unselectedChip
            ]}
            onPress={() => handlePress(option)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.chipText,
              isSelected ? styles.selectedText : styles.unselectedText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unselectedChip: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    color: COLORS.white,
  },
  unselectedText: {
    color: COLORS.textSecondary,
  },
});