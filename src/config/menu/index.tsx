import { adminMenu } from "./adminMenu";
import { userMenu } from "./userMenu";
import { auditorMenu } from "./auditorMenu";
import { managerMenu } from "./managerMenu";

export const getMenuByRole = (role: string) => {
  switch (role) {
    case "ADMIN":
      return adminMenu;
    case "USER":
      return userMenu;
    case "AUDITOR":
      return auditorMenu;
    case "MANAGER":
      return managerMenu;
    default:
      return [];
  }
};
