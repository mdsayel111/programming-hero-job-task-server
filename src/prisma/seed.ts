import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    const mentorPassword = await bcrypt.hash('Mentor123!', 10);
    const studentPassword = await bcrypt.hash('Student123!', 10);

    // 1. Seed or find mentor
    const existingMentor = await db.orm.public.User
      .where((u) => u.email.eq('mentor@programming-hero.com'))
      .first();

    let mentorId: number;
    if (!existingMentor) {
      const mentor = await db.orm.public.User.create({
        name: 'Main Mentor',
        email: 'mentor@programming-hero.com',
        password: mentorPassword,
        role: 'MENTOR',
      });
      console.log('✅ Created Mentor:', mentor.email);
      mentorId = mentor.id;
    } else {
      console.log('ℹ️ Mentor already exists:', existingMentor.email);
      mentorId = existingMentor.id;
    }

    // 2. Seed or find student
    const existingStudent = await db.orm.public.User
      .where((u) => u.email.eq('student@programming-hero.com'))
      .first();

    let studentId: number;
    if (!existingStudent) {
      const student = await db.orm.public.User.create({
        name: 'Rahim Ahmed',
        email: 'student@programming-hero.com',
        password: studentPassword,
        role: 'STUDENT',
      });
      console.log('✅ Created Student:', student.email);
      studentId = student.id;
    } else {
      console.log('ℹ️ Student already exists:', existingStudent.email);
      studentId = existingStudent.id;
    }

    // 3. Seed sample submissions if none exist
    const existingSubmissions = await db.orm.public.Submission
      .where((s) => s.studentId.eq(studentId))
      .all();

    if (existingSubmissions.length === 0) {
      await db.orm.public.Submission.create({
        projectName: 'Smart Logistics Tracker',
        repoUrl: 'https://github.com/rahimahmed/smart-logistics-tracker',
        liveLink: 'https://smart-logistics-tracker.vercel.app',
        description: 'Real-time GPS parcel and logistics delivery tracking system with WebSockets and Redis caching.',
        status: 'PENDING',
        studentId: studentId,
      });

      await db.orm.public.Submission.create({
        projectName: 'DevCourse Learning Hub',
        repoUrl: 'https://github.com/rahimahmed/devcourse-hub',
        liveLink: 'https://devcourse-hub.netlify.app',
        description: 'Interactive coding tutorial platform with embedded sandbox editor and automated code assessment.',
        status: 'APPROVED',
        feedback: 'Excellent component design and responsive layout! Clean TypeScript code.',
        studentId: studentId,
      });

      await db.orm.public.Submission.create({
        projectName: 'Crypto Wallet Manager',
        repoUrl: 'https://github.com/rahimahmed/crypto-wallet-manager',
        liveLink: 'https://crypto-wallet-preview.web.app',
        description: 'Decentralized multi-chain portfolio manager. (Demo with mock testnet data)',
        status: 'REJECTED',
        feedback: 'Live link returns 404 on inner routes. Please fix client routing and re-submit.',
        studentId: studentId,
      });

      console.log('✅ Seeded 3 sample submissions (Pending, Approved, Rejected).');
    } else {
      console.log(`ℹ️ Existing submissions found (${existingSubmissions.length}), skipping submissions seed.`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await db.close();
  }
}

seed();
