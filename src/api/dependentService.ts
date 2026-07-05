import { localDependentsStore } from './localUiData';

export type Dependent = {
  _id?: string;
  id?: string;
  userId: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  isActive: boolean;
  [key: string]: any;
};

export const dependentService = {
  getDependentsByUser: async (_userId: string): Promise<Dependent[]> =>
    localDependentsStore.list(),

  createDependent: async (payload: Partial<Dependent>): Promise<Dependent> => {
    const dependents = await localDependentsStore.list();
    const created: Dependent = {
      id: payload.id || `dep-${Date.now()}`,
      _id: payload._id || payload.id || `dep-${Date.now()}`,
      userId: payload.userId || 'self',
      name: payload.name || '',
      relationship: payload.relationship || 'Family',
      age: Number(payload.age) || 0,
      gender: payload.gender || '',
      phone: payload.phone || '',
      email: payload.email || '',
      dateOfBirth: payload.dateOfBirth || '',
      bloodGroup: payload.bloodGroup || '',
      address: payload.address || '',
      isActive: payload.isActive ?? true,
    };
    await localDependentsStore.save([...dependents, created]);
    return created;
  },

  updateDependent: async (
    id: string,
    _userId: string,
    payload: Partial<Dependent>,
  ): Promise<Dependent> => {
    const dependents = await localDependentsStore.list();
    const updatedList = dependents.map(item =>
      (item.id || item._id) === id ? { ...item, ...payload } : item,
    );
    await localDependentsStore.save(updatedList);
    return updatedList.find(item => (item.id || item._id) === id) as Dependent;
  },

  deleteDependent: async (id: string, _userId: string): Promise<void> => {
    const dependents = await localDependentsStore.list();
    await localDependentsStore.save(
      dependents.filter(item => (item.id || item._id) !== id),
    );
  },
};
