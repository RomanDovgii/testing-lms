import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Roles } from '../entities/roles.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Roles);
  const salt = '$2b$10$1234567890123456789012';

  const adminEmail = 'admin@example.com';
  const adminGithub = 'adminGithub';
  const adminPassword = '89037839344Rd';

  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`Администратор с email "${adminEmail}" уже существует`);
    return;
  }

  const adminRole = await roleRepo.findOne({ where: { name: 'администратор' } });
  if (!adminRole) {
    throw new Error('Роль "администратор" не найдена. Сначала выполните сидер для ролей.');
  }

  const now = new Date();
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  const admin = userRepo.create({
    email: adminEmail,
    password: hashedPassword,
    name: 'Админ',
    surname: 'Системы',
    github: adminGithub,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    role: adminRole,
  });

  await userRepo.save(admin);
  console.log(`Администратор "${adminEmail}" успешно создан`);
}