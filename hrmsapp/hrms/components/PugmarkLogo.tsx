/**
 * Pugmark Logo Component
 * Displays the Pugmark brand logo
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

const logoXml = `
<svg width="200" height="120" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Paw Print -->
  <g id="paw-print">
    <!-- Central Pad (Dark Grey) -->
    <ellipse cx="100" cy="90" rx="35" ry="25" fill="#4B5563"/>
    
    <!-- Toes (Colored) -->
    <!-- Red (Leftmost) -->
    <ellipse cx="70" cy="50" rx="18" ry="22" fill="#EF4444"/>
    
    <!-- Orange (Second from left) -->
    <ellipse cx="90" cy="45" rx="18" ry="22" fill="#F59E0B"/>
    
    <!-- Green (Second from right) -->
    <ellipse cx="110" cy="45" rx="18" ry="22" fill="#10B981"/>
    
    <!-- Blue (Rightmost) -->
    <ellipse cx="130" cy="50" rx="18" ry="22" fill="#3B82F6"/>
  </g>
  
  <!-- Text: pugmark -->
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#4B5563" text-anchor="middle" letter-spacing="2">pugmark</text>
</svg>
`;

interface PugmarkLogoProps {
  width?: number;
  height?: number;
  style?: any;
}

export const PugmarkLogo: React.FC<PugmarkLogoProps> = ({ 
  width = 200, 
  height = 120, 
  style 
}) => {
  return (
    <View style={[styles.container, { width, height }, style]}>
      <SvgXml xml={logoXml} width={width} height={height} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
