import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const users = [
  { email: "student@thesis.ac.th", name: "นายทดสอบ ระบบ", role: Role.STUDENT, studentId: "64010001" },
  { email: "advisor@thesis.ac.th", name: "รศ.ดร.อาจารย์ ที่ปรึกษา", role: Role.ADVISOR },
  { email: "chair@thesis.ac.th", name: "ผศ.ดร.ประธาน หลักสูตร", role: Role.PROGRAM_CHAIR },
  { email: "committee@thesis.ac.th", name: "ดร.กรรมการ สอบ", role: Role.EXAM_COMMITTEE },
  { email: "staff@thesis.ac.th", name: "นางสาวเจ้าหน้าที่ ภาควิชา", role: Role.DEPT_STAFF },
  { email: "dean@thesis.ac.th", name: "ศ.ดร.คณบดี คณะ", role: Role.FACULTY_DEAN },
  { email: "grad@thesis.ac.th", name: "นางบัณฑิตวิทยาลัย วิทยาเขต", role: Role.GRADUATE_SCHOOL },
];

async function main() {
  console.log("Seeding database...");
  const hash = await bcrypt.hash("password123", 12);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: hash },
    });
  }

  console.log("Seed complete. All users use password: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
