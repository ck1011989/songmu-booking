// Inline string cells preserve phone leading zeroes and never evaluate customer text as formulas.
function makeXlsx(rows){
 const enc=new TextEncoder(),xml=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const files={
 '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
 '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="客人與預約資料" sheetId="1" r:id="rId1"/></sheets></workbook>',
 'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/worksheets/sheet1.xml':'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+rows.map((row,i)=>'<row r="'+(i+1)+'">'+row.map(v=>'<c t="inlineStr"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData></worksheet>'
 };let chunks=[],central=[],offset=0;
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0};
 const record=(size)=>{const a=new Uint8Array(size),v=new DataView(a.buffer);return {a,u16:(n,x)=>v.setUint16(n,x,true),u32:(n,x)=>v.setUint32(n,x,true)}};
 for(const [name,text] of Object.entries(files)){const n=enc.encode(name),b=enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+text),sum=crc(b),l=record(30);l.u32(0,0x04034b50);l.u16(4,20);l.u32(14,sum);l.u32(18,b.length);l.u32(22,b.length);l.u16(26,n.length);chunks.push(l.a,n,b);const c=record(46);c.u32(0,0x02014b50);c.u16(4,20);c.u16(6,20);c.u32(16,sum);c.u32(20,b.length);c.u32(24,b.length);c.u16(28,n.length);c.u32(42,offset);central.push(c.a,n);offset+=30+n.length+b.length}
 const size=central.reduce((n,b)=>n+b.length,0),e=record(22);e.u32(0,0x06054b50);e.u16(8,5);e.u16(10,5);e.u32(12,size);e.u32(16,offset);return new Blob([...chunks,...central,e.a],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function downloadXlsx(rows,name){const blob=makeXlsx(rows),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}

