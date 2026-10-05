/**
 * Web Map Component - Renders actual map using DOM manipulation
 * Only used on web platform
 */

import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

interface WebMapProps {
  latitude: number;
  longitude: number;
  address?: string;
}

export const WebMap: React.FC<WebMapProps> = ({ latitude, longitude, address }) => {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current && typeof document !== 'undefined') {
      const container = containerRef.current;
      
      // Clear previous content
      if (container._iframe) {
        container.removeChild(container._iframe);
      }

      // Create iframe element
      const iframe = document.createElement('iframe');
      const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
      
      iframe.src = mapUrl;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.frameBorder = '0';
      iframe.scrolling = 'no';
      iframe.marginHeight = '0';
      iframe.marginWidth = '0';
      iframe.title = 'Location Map';
      
      container.appendChild(iframe);
      container._iframe = iframe;

      return () => {
        if (container._iframe && container.contains(container._iframe)) {
          container.removeChild(container._iframe);
        }
      };
    }
  }, [latitude, longitude, address]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View
      ref={containerRef}
      style={styles.container}
      // @ts-ignore
      collapsable={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    minHeight: 250,
  },
});
