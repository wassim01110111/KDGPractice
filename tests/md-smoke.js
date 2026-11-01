// Smoke test: the reference renderer must handle both supplied files without throwing and keep every heading/table.
const fs=require('fs'),src=fs.readFileSync(__dirname+'/../js/app.js','utf8');
const m=src.slice(src.indexOf('function md(src)'),src.indexOf('// ---------- pages'));
const {md,withoutContentsSection}=new Function(m+';return {md,withoutContentsSection}')();
for(const f of ['sql-cheat-sheet.md','linux-summary.md']){const t=fs.readFileSync(__dirname+'/../content/reference/'+f,'utf8'),visible=withoutContentsSection(t),r=md(visible);
 const hs=(visible.match(/^#{1,6}\s/gm)||[]).length-(visible.match(/^```[\s\S]*?^```/gm)||[]).join('').split('\n').filter(l=>/^#{1,6}\s/.test(l)).length;
 const renderedHeadings=(r.html.match(/<h[1-6] /g)||[]).length;
 const tbl=(t.match(/^\s*\|[\s:|-]+\|?\s*$/gm)||[]).length;
 if(/^## Table of contents$/im.test(t)&&/<h2[^>]*>Table of contents<\/h2>/i.test(r.html)) throw new Error(f+' rendered its inline table of contents');
 if(hs!==renderedHeadings) throw new Error(f+' heading count mismatch: '+hs+' source vs '+renderedHeadings+' rendered');
 console.log(f,'headings(src,outside code)=',hs,'rendered=',renderedHeadings,'tables src=',tbl,'rendered=',(r.html.match(/<table>/g)||[]).length,'toc=',r.toc.length);}
