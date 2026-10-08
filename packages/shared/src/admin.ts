/** Indicators of the ADMIN dashboard (`GET /api/admin/dashboard`). */
export type AdminDashboardStats = {
  users: number;
  items: {
    total: number;
    published: number;
  };
};
