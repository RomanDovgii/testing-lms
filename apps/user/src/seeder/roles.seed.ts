import { DataSource } from 'typeorm';
import { Roles } from '../entities/roles.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Roles);

  const roles = ['администратор', 'студент', 'наставник', 'преподаватель'];

  for (const name of roles) {
    const existing = await roleRepo.findOne({ where: { name } });
    if (!existing) {
      const role = roleRepo.create({ name });
      await roleRepo.save(role);
      console.log(`Role "${name}" created`);
    } else {
      console.log(`Role "${name}" already exists`);
    }
  }
}