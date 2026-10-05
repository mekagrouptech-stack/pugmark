/**
 * Calendar Strip Component
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface CalendarStripProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onDateSelect,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selected, setSelected] = useState<Date>(selectedDate || new Date());

  const today = new Date();
  const days = [];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Generate 7 days starting from today
  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }

  const handleDateSelect = (date: Date) => {
    setSelected(date);
    onDateSelect?.(date);
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((date, index) => {
        const dayName = dayNames[date.getDay()];
        const dayNumber = date.getDate();
        const isTodayDate = isToday(date);
        const isSelectedDate = isSelected(date);

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayContainer,
              isSelectedDate && {
                backgroundColor: colors.calendarSelected,
                borderRadius: 20,
              },
              isTodayDate && !isSelectedDate && {
                borderWidth: 2,
                borderColor: colors.calendarToday,
                borderRadius: 20,
              },
            ]}
            onPress={() => handleDateSelect(date)}
          >
            <Text
              style={[
                styles.dayName,
                {
                  color: isSelectedDate ? '#FFFFFF' : colors.icon,
                },
              ]}
            >
              {dayName}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                {
                  color: isSelectedDate ? '#FFFFFF' : colors.text,
                },
              ]}
            >
              {dayNumber}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  dayContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 4,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
});
