import React from 'react';
import { AppHeader } from '../../components/AppHeader';

type Props = {
  title: string;
  right?: React.ReactNode;
};

export const TelehealthHeader: React.FC<Props> = ({ title, right }) => {
  return <AppHeader title={title} right={right} statusBarStyle="dark-content" />;
};
