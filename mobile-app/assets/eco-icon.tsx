import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { ChemistryTheme } from '../src/theme/theme';

interface EcoIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const EcoIcon: React.FC<EcoIconProps> = ({
  width = 24,
  height = 24,
  color = ChemistryTheme.colors.primary,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <G>
        {/* Leaf shape */}
        <Path
          d="M17 8C8 10 5.9 16.17 5.9 16.17c0 0-.06.03-.09.05-.29.14-.4.36-.4.61C5.41 17.43 5.83 18 6.5 18c.54 0 1.02-.35 1.18-.86 0 0 1.88-6.49 9.32-7.14"
          fill={color}
          stroke={color}
          strokeWidth={0.5}
        />
        <Path
          d="M9.45 10.57c-.29 1.26-.45 2.59-.49 3.43h.59c.17-1.3.68-3.09 1.45-4.63"
          fill={color}
        />
        <Path
          d="M17.5 4c-4.56 0-8.33 3.22-9.25 7.5 1.91-2.32 4.29-3.8 7-4.2 0 0-2.25 4.42 0 8.83.42.8 1.4 1.87 2 2.53V20h2v-2c0-.44-.18-1.03-.5-1.8-.18-.41-.39-.83-.62-1.24C17.53 13.39 18 11.87 18 10.5c0-2.1-.86-4.01-2.25-5.38"
          fill={color}
        />
      </G>
    </Svg>
  );
};

export default EcoIcon; 