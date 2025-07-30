import { Request } from 'express';
import { IPatient } from '../models/Patient';
import { IDoctor } from '../models/Doctor';

export interface AuthRequest extends Request {
  user: IPatient | IDoctor;
  role: 'doctor' | 'patient';
}

