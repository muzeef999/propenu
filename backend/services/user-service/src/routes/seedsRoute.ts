import Role from "../models/rolesModel";
import { roles } from "../seeds/role_seeds";

export const seedRoles = async () => {
  const created = [];
  const updated = [];

  for (const role of roles) {
    const exists = await Role.findOne({ name: role.name });

    if (exists) {
      await Role.updateOne({ name: role.name }, { $set: role });
      updated.push(role.name);
    } else {
      await Role.create(role);
      created.push(role.name);
    }
  }

  return { created, updated };
};
