import axios from 'axios';
import { customers, services, staff, appointments } from './demo-data';
import type { Customer, Service, Staff, Appointment } from './demo-data';
export type Reward = {
  id: string;
  name: string;
  points: number;
  description: string;
  active: boolean;
};
export type WorkspaceData = {
  customers: Customer[];
  services: Service[];
  staff: Staff[];
  appointments: Appointment[];
  rewards: Reward[];
  settings: {
    name: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    timezone: string;
    confirmation: boolean;
    reminders: boolean;
    loyalty: boolean;
    pointsPerDollar: number;
    plan: string;
  };
};
export const initialData: WorkspaceData = {
  customers,
  services,
  staff,
  appointments,
  rewards: [
    {
      id: 'r1',
      name: '$10 off your next visit',
      points: 500,
      description: 'A little thank you for coming back.',
      active: true,
    },
    {
      id: 'r2',
      name: 'Complimentary gel manicure',
      points: 1500,
      description: 'A finishing touch, on us.',
      active: true,
    },
    {
      id: 'r3',
      name: 'Signature facial experience',
      points: 2500,
      description: 'An hour of well-deserved self-care.',
      active: true,
    },
  ],
  settings: {
    name: 'Serenity Spa & Salon',
    email: 'hello@serenity.com',
    phone: '+95 9 250 111 000',
    address: '42 Inya Road, Kamayut, Yangon',
    currency: 'USD',
    timezone: 'Asia/Yangon',
    confirmation: true,
    reminders: true,
    loyalty: true,
    pointsPerDollar: 4,
    plan: 'Pro',
  },
};
// UI-only adapter. Replace this adapter with the authenticated NestJS API integration.
// Tenant isolation must be enforced by the backend; this demo is not an auth boundary.
let demoData = structuredClone(initialData);
export const api = axios.create({
  baseURL: '/api/tenants/serenity',
  adapter: async (config) => {
    if (config.method === 'put')
      demoData = JSON.parse(config.data) as WorkspaceData;
    return {
      data: structuredClone(demoData),
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  },
});
export const workspaceKey = ['tenant', 'serenity', 'workspace'] as const;
export const getWorkspace = async () =>
  (await api.get<WorkspaceData>('/workspace')).data;
export const saveWorkspace = async (data: WorkspaceData) =>
  (await api.put<WorkspaceData>('/workspace', data)).data;
