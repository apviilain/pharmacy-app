import { localLabTests, localMedicineOrders } from './localUiData';

export type PatientRecord = {
  id: string;
  name?: string;
  age?: number;
  [key: string]: unknown;
};

export type LabTest = {
  id: string;
  name?: string;
  status?: string;
  orderedAt?: string;
  results?: unknown;
  [key: string]: unknown;
};

export type MedicineOrder = {
  id: string;
  medicationName?: string;
  dosage?: string;
  status?: string;
  [key: string]: unknown;
};

export const patientService = {
  getMyPatientRecord: async (): Promise<PatientRecord> => ({
    id: 'local-patient',
    name: 'Local User',
  }),

  getLabTests: async (_patientId: string = 'me'): Promise<LabTest[]> =>
    localLabTests.map(item => ({ ...item })),

  getMedicineOrders: async (
    _patientId: string = 'me',
  ): Promise<MedicineOrder[]> => localMedicineOrders.map(item => ({ ...item })),

  placeMedicineOrder: async (payload: {
    patientId?: string;
    medicationName: string;
    dosage: string;
  }): Promise<MedicineOrder> => ({
    id: `med-${Date.now()}`,
    medicationName: payload.medicationName,
    dosage: payload.dosage,
    status: 'pending',
  }),
};
