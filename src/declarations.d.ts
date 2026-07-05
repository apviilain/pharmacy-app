declare module "*.svg" {
  import React from 'react';
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '@env' {
  export const BASE_URL: string;
  export const API_TIMEOUT: string;
  export const AUTH_TOKEN_KEY: string;
}
