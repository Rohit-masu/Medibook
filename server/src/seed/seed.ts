import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Image } from '../models/Image.js';

const daysAgo = (n: number, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 15, 0, 0);
  return d;
};

const portrait = (gender: 'men' | 'women', n: number) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

async function seed() {
  await connectDb();

  // Idempotent: wipe and recreate demo data.
  await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Image.deleteMany({})]);

  const [, rahul, priya] = await User.create([
    { name: 'Admin', phone: '9999900000', role: 'admin' },
    { name: 'Rahul Sharma', phone: '9999900001', role: 'mr', territory: 'Mumbai West' },
    { name: 'Priya Verma', phone: '9999900002', role: 'mr', territory: 'Pune' },
  ]);

  const doctors = [
    {
      name: 'Anil Mehta',
      phone: '9820011223',
      specialty: 'Cardiologist',
      registrationNo: 'MMC-2009-11872',
      clinicName: 'Mehta Heart Care',
      address: '12, Linking Road, Bandra West',
      city: 'Mumbai',
      photoUrl: portrait('men', 52),
      onboardedBy: rahul._id,
      createdAt: daysAgo(6),
    },
    {
      name: 'Sneha Kulkarni',
      phone: '9820044556',
      specialty: 'Pediatrician',
      registrationNo: 'MMC-2014-20431',
      clinicName: 'Little Steps Child Clinic',
      address: 'Shop 4, Sai Krupa CHS, SV Road, Andheri West',
      city: 'Mumbai',
      photoUrl: portrait('women', 44),
      onboardedBy: rahul._id,
      createdAt: daysAgo(4),
    },
    {
      name: 'Imran Shaikh',
      phone: '9820077889',
      specialty: 'General Physician',
      clinicName: 'Shifa Family Clinic',
      address: '2nd Floor, Jogeshwari Market, Jogeshwari West',
      city: 'Mumbai',
      photoUrl: portrait('men', 75),
      onboardedBy: rahul._id,
      createdAt: daysAgo(1, 16),
    },
    {
      name: 'Rohini Deshpande',
      phone: '9890012345',
      specialty: 'Gynecologist',
      registrationNo: 'MMC-2011-15520',
      clinicName: 'Matrutva Women’s Hospital',
      address: '45, FC Road, Shivajinagar',
      city: 'Pune',
      photoUrl: portrait('women', 68),
      onboardedBy: priya._id,
      createdAt: daysAgo(5),
    },
    {
      name: 'Vikram Joshi',
      phone: '9890067890',
      specialty: 'Diabetologist',
      clinicName: 'Sugar Care Diabetes Centre',
      address: 'Office 7, Kumar Plaza, Kothrud',
      city: 'Pune',
      photoUrl: portrait('men', 33),
      onboardedBy: priya._id,
      createdAt: daysAgo(3),
    },
    {
      name: 'Kavita Nair',
      phone: '9890054321',
      specialty: 'Dermatologist',
      registrationNo: 'MMC-2016-30988',
      clinicName: 'SkinFirst Clinic',
      address: 'B-12, Phoenix Market City, Viman Nagar',
      city: 'Pune',
      photoUrl: portrait('women', 26),
      onboardedBy: priya._id,
      createdAt: daysAgo(2),
    },
  ];

  // insertMany keeps our backdated createdAt values.
  await Doctor.insertMany(doctors.map((d) => ({ ...d, status: 'active', updatedAt: d.createdAt })));

  console.log('Seeded: 3 users, %d doctors', doctors.length);
  console.log('Logins (OTP 123456): Admin 9999900000 | Rahul 9999900001 | Priya 9999900002');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
