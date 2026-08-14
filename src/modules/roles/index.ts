export { RolesView } from "./components/roles-view";
export { RolesTable } from "./components/roles-table";
export { RoleFormModal } from "./components/role-form-modal";
export { RolePermissionsModal } from "./components/role-permissions-modal";
export { useRoles } from "./hooks/use-roles";
export {
  listRoles,
  createRole,
  updateRole,
  toggleRoleStatus,
  getPermissionsCatalog,
  getRolePermissions,
  syncRolePermissions,
} from "./services/roles.service";
export type {
  RoleItem,
  RoleFormValues,
  RoleStatus,
  PermisoItem,
  ListRolesParams,
  ListRolesResult,
  RolesFeedback,
} from "./types/roles.types";