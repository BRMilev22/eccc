import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface SchoolLogoProps {
  width?: number;
  height?: number;
  size?: number;
}

const SchoolLogoIcon: React.FC<SchoolLogoProps> = ({
  width,
  height,
  size = 40
}) => {
  const imageSize = {
    width: width || size,
    height: height || size
  };

  return (
    <View style={[styles.container, imageSize]}>
      <Image
        source={require('./vscpi-logo.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  }
});

export default SchoolLogoIcon; 