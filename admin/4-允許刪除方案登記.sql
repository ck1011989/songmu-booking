-- 讓管理員可以在後台刪除「登記錯誤、尚未扣次」的鬆活方案。只調整權限，不會改動任何資料。
-- 權限沿用既有規則：只有已登入的管理員可以刪除（客人與未登入者不行）。
grant delete on public.member_packages to authenticated;
notify pgrst, 'reload schema';

-- 執行後檢查（結果應該是 can_delete = true）：
select has_table_privilege('authenticated', 'public.member_packages', 'DELETE') as can_delete;
