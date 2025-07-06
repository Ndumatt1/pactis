import { Role } from "@/enums/role.enum";

export interface IUsers {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: Role
}