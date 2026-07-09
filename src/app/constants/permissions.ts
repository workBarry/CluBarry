import { UserRole } from '../types/club.models';

export const roleOrder: UserRole[] = ['Visitor', 'Member', 'Officer', 'Admin'];

export const permissionMatrix = [
  { feature: '查看首頁', Visitor: true, Member: true, Officer: true, Admin: true },
  { feature: '查看公告', Visitor: true, Member: true, Officer: true, Admin: true },
  { feature: '查看活動', Visitor: true, Member: true, Officer: true, Admin: true },
  { feature: '活動報名', Visitor: false, Member: true, Officer: true, Admin: true },
  { feature: '查看自己的報名', Visitor: false, Member: true, Officer: true, Admin: true },
  { feature: '新增活動', Visitor: false, Member: false, Officer: true, Admin: true },
  { feature: '修改活動', Visitor: false, Member: false, Officer: true, Admin: true },
  { feature: '刪除活動', Visitor: false, Member: false, Officer: false, Admin: true },
  { feature: '公告管理', Visitor: false, Member: false, Officer: true, Admin: true },
  { feature: '社員管理', Visitor: false, Member: false, Officer: false, Admin: true },
  { feature: '權限管理', Visitor: false, Member: false, Officer: false, Admin: true },
];
