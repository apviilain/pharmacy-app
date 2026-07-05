import { ImageSourcePropType } from 'react-native';

export type TelehealthDoctor = {
  id: string;
  name: string;
  specialty: string;
  degree: string;
  rating: number;
  expYears: number;
  patients: string;
  fee: number;
  avatarUri: string;
  about: string;
  languages: string[];
};

export type TelehealthMember = {
  id: string;
  name: string;
  relation: string;
  gender: string;
  age: string;
  contact: string;
  email: string;
  isMe?: boolean;
};

export const doctors: TelehealthDoctor[] = [
  {
    id: 'd1',
    name: 'Dr. Priya Sharma',
    specialty: 'General Physician',
    degree: 'MBBS, MD',
    rating: 4.9,
    expYears: 12,
    patients: '2.4k',
    fee: 499,
    avatarUri:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=60',
    about:
      'Dr. Priya Sharma is a board-certified General Physician with 12 years of experience in internal medicine and preventive care. MBBS, MD from AIIMS, New Delhi.',
    languages: ['English', 'Hindi', 'Kannada'],
  },
  {
    id: 'd2',
    name: 'Dr. Rajesh Menon',
    specialty: 'Cardiologist',
    degree: 'MBBS, DM',
    rating: 4.9,
    expYears: 12,
    patients: '2.4k',
    fee: 799,
    avatarUri:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&q=60',
    about:
      'Experienced cardiologist focused on preventive cardiology and lifestyle-based interventions.',
    languages: ['English', 'Hindi'],
  },
  {
    id: 'd3',
    name: 'Dr. Anita Gupta',
    specialty: 'Dermatologist',
    degree: 'MBBS, DVD',
    rating: 4.9,
    expYears: 12,
    patients: '2.4k',
    fee: 599,
    avatarUri:
      'https://images.unsplash.com/photo-1580281658628-8c61b1c63c58?auto=format&fit=crop&w=256&q=60',
    about:
      'Dermatologist with a special interest in acne management, pigmentation, and hair care.',
    languages: ['English', 'Hindi'],
  },
];

export const initialMembers: TelehealthMember[] = [
  {
    id: 'm1',
    name: 'Vanshitha',
    relation: 'Me',
    gender: 'Female',
    age: '23',
    contact: '73579 97899',
    email: 'vanshitha@gmail.com',
    isMe: true,
  },
  {
    id: 'm2',
    name: 'Rohith',
    relation: 'Father',
    gender: 'Male',
    age: '50',
    contact: '73579 97899',
    email: 'rohith@gmail.com',
  },
];

export const categories = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'dermatologist', label: 'Dermatologist' },
  { id: 'cardio', label: 'Cardio' },
];

