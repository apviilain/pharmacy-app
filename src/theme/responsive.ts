import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const wp = (widthPercent: string | number) => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((width * elemWidth) / 100);
};

export const hp = (heightPercent: string | number) => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((height * elemHeight) / 100);
};

export const responsiveFontSize = (f: number) => {
  // A simple heuristic for font size, assuming f is roughly a percentage of height or a scale factor
  return Math.round(PixelRatio.roundToNearestPixel(scale(f)));
};

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
