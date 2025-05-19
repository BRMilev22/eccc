import React from 'react';
import Svg, { Path, G, Circle } from 'react-native-svg';

interface ChemistryIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ChemistryIcon: React.FC<ChemistryIconProps> = ({
  width = 24,
  height = 24,
  color = '#3b5998',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <G>
        {/* Flask/beaker */}
        <Path
          d="M9 3h6v2c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V3z"
          fill={color}
          strokeWidth={1}
          stroke={color}
        />
        <Path
          d="M8 5v3L4 18c-.4 1 .4 2 1.5 2h13c1.1 0 1.9-1 1.5-2L16 8V5"
          fill="none"
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Bubbles */}
        <Circle cx="10" cy="14" r="1" fill={color} />
        <Circle cx="14" cy="16" r="1.5" fill={color} />
        <Circle cx="12" cy="11" r="1" fill={color} />
      </G>
    </Svg>
  );
};

export default ChemistryIcon; 