// Shared by the admin download and the private daily workbook export.
function serviceCategory(r){
 if(r.status==='pending'||r.status==='confirmed')return '尚未完成';
 if(r.status==='cancelled'||r.outcome==='cancelled_before_service'||r.outcome==='cancelled_during_service')return '已取消';
 return r.status==='completed'&&(!r.outcome||r.outcome==='normal')?'正常服務':'尚未完成';
}
function taiwanDay(value){const d=new Date(value);return Number.isFinite(d.getTime())?new Date(d.getTime()+28800000).toISOString().slice(0,10):''}
function weekStart(day){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)}
function revenueReport(records,now=new Date()){
 const today=taiwanDay(now),week=weekStart(today),month=today.slice(0,7),daily=new Map(),weekly=new Map(),monthly=new Map();let total=0;
 for(const r of records){if(serviceCategory(r)!=='正常服務')continue;const day=taiwanDay(r.starts_at),amount=Number(r.price_ntd??r.price);if(!day||!Number.isFinite(amount))throw Error('正常服務紀錄缺少有效日期或費用，請先檢查資料。');const w=weekStart(day),m=day.slice(0,7);total+=amount;daily.set(day,(daily.get(day)||0)+amount);weekly.set(w,(weekly.get(w)||0)+amount);monthly.set(m,(monthly.get(m)||0)+amount)}
 const sorted=m=>[...m].sort((a,b)=>a[0].localeCompare(b[0]));
 return {today,week,month,total,todayTotal:daily.get(today)||0,weekTotal:weekly.get(week)||0,monthTotal:monthly.get(month)||0,daily:sorted(daily),weekly:sorted(weekly),monthly:sorted(monthly)};
}
function revenueWorkbookSheets(records,now=new Date()){
 const report=revenueReport(records,now),rows=[['鬆沐收入統計'],['更新日期（臺灣）',report.today],['正常服務總費用',report.total],['今日收入',report.todayTotal],['本週收入（週一至週日）',report.weekTotal],['本月收入',report.monthTotal],['計算方式','僅正常完成服務，按預約日期（臺灣）統計；取消及尚未完成不計收入。'],[],['每日日期','收入（NT$）','','每週起始日（週一）','收入（NT$）','','月份','收入（NT$）']];
 for(let i=0;i<Math.max(1,report.daily.length,report.weekly.length,report.monthly.length);i++)rows.push([...(report.daily[i]||['—',0]),'',...(report.weekly[i]||['—',0]),'',...(report.monthly[i]||['—',0])]);
 const states={pending:'待確認',confirmed:'已確認',completed:'已完成',cancelled:'已取消'},outcomes={normal:'正常完成',cancelled_before_service:'服務前取消',cancelled_during_service:'服務中取消'};
 const details=[['姓名','手機','服務','預約時間（臺灣）','服務費用（NT$）','服務結果','正常服務收入（NT$）','預約狀態','處理結果','處理備註','處理時間（臺灣）','症狀','客人備註','申請編號','LINE ID']];
 for(const r of records){const category=serviceCategory(r);details.push([r.submitted_name||r.name||r.customers?.name||'',r.submitted_phone||r.phone||r.customers?.phone||'',r.service_name||r.service||'',r.starts_at?new Date(new Date(r.starts_at).getTime()+28800000):'',Number(r.price_ntd??r.price??0),category,category==='正常服務'?Number(r.price_ntd??r.price):0,states[r.status]||r.status,category==='尚未完成'?'尚未處理':outcomes[r.outcome||'normal']||'',r.outcome_note||'',r.outcome_at?new Date(new Date(r.outcome_at).getTime()+28800000):'',r.symptoms||'',r.notes||'',r.id||'',r.line_id||r.customers?.line_id||''])}
 return [{name:'收入統計',rows},{name:'客人與預約資料',rows:details}];
}
