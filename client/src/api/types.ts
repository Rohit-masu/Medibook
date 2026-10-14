export type Role = 'mr' | 'admin';

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: Role;
  territory?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Doctor {
  _id: string;
  name: string;
  phone: string;
  specialty: string;
  registrationNo?: string;
  clinicName: string;
  address: string;
  city: string;
  photoUrl: string;
  onboardedBy: Pick<User, '_id' | 'name' | 'phone' | 'territory'>;
  status: 'active' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface NewDoctorInput {
  name: string;
  phone: string;
  specialty: string;
  registrationNo?: string;
  clinicName: string;
  address: string;
  city: string;
  photoUrl: string;
}

export interface AdminStats {
  totalDoctors: number;
  doctorsToday: number;
  doctorsThisWeek: number;
  totalMrs: number;
  activeMrsToday: number;
}

export interface MrSummary extends User {
  doctorsOnboarded: number;
  lastOnboardedAt: string | null;
}
