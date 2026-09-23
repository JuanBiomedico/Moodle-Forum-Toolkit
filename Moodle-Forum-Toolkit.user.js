// ==UserScript==
// @name         Moodle Forum Toolkit - Gestor y Consolidador de Foros
// @namespace    moodle-forum-toolkit
// @version      1.10.1
// @description  Consolida foros Moodle, prioriza respuestas por antigüedad, permite respuesta directa con imágenes, adjuntos y mensajería masiva multi-aula.
// @author       Juan Pablo Moreno Ortiz
// @license      MIT
// @homepageURL  https://github.com/JuanBiomedico/Moodle-Forum-Toolkit
// @supportURL   https://github.com/JuanBiomedico/Moodle-Forum-Toolkit/issues
// @downloadURL  https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/main/Moodle-Forum-Toolkit.user.js
// @updateURL    https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/main/Moodle-Forum-Toolkit.user.js
// @match        *://*/mod/forum/view.php*
// @match        *://*/mod/forum/post.php*
// @match        *://*/*/mod/forum/view.php*
// @match        *://*/*/mod/forum/post.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * Moodle Forum Toolkit
 * Autor: Juan Pablo Moreno Ortiz
 * Licencia: MIT
 *
 * Herramienta independiente y no oficial. No está afiliada ni respaldada
 * por Moodle Pty Ltd ni por una institución educativa específica.
 *
 * Si esta herramienta resulta útil, las donaciones voluntarias son
 * bienvenidas a la Llave: @moreno3666
 */

(function () {
'use strict';

if (window.frameElement?.dataset?.mftUploader === '1') return;

const VERSION = '1.10.1';
const AUTHOR = 'Juan Pablo Moreno Ortiz';
const DONATION_KEY = '@moreno3666';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const RESPONSE_LIMIT = 48 * HOUR;
const REQUEST_PAUSE = 220;
const MASS_PAUSE_DEFAULT = 3;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png','image/jpeg','image/gif','image/webp']);

const K = {
  quickText: 'mft_quick_reply_text',
  useQuick: 'mft_use_quick_reply_text',
  pendingReply: 'mft_pending_reply',
  classrooms: 'mft_configured_forums',
  massDraft: 'mft_mass_draft',
  massSecurity: 'mft_mass_security',
  massPause: 'mft_mass_pause_seconds',
  optimizeYoutube: 'mft_optimize_youtube',
  campaignPrefix: 'mft_campaign_'
};

const COLOR = {
  blue: '#0d6efd', green: '#198754', purple: '#6f42c1',
  orange: '#fd7e14', red: '#dc3545', gray: '#6c757d'
};

const DEFAULT_MASS_MESSAGE = `Estimados estudiantes:\n\nReciban un cordial saludo. Comparto este mensaje de apoyo para orientar el desarrollo de las actividades del curso.\n\n- Revise cuidadosamente la guía de aprendizaje.\n- Participe oportunamente en el foro.\n- Comparta sus avances para recibir retroalimentación.\n- Evite dejar las actividades para el último momento.\n\nMuchos éxitos en el desarrollo de sus actividades.`;

/* ========================= Utilities ========================= */

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = v => String(v ?? '').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n\s*\n\s*\n+/g,'\n\n').trim();
const norm = v => clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const normName = v => clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const absoluteUrl = (href, base=location.href) => { try { return href ? new URL(href, base).href : ''; } catch { return ''; } };
const forumId = (url=location.href) => { try { return new URL(url, location.href).searchParams.get('id') || ''; } catch { return ''; } };
const userId = href => { try { return new URL(href, location.origin).searchParams.get('id') || ''; } catch { return ''; } };
const docFromHtml = html => new DOMParser().parseFromString(html, 'text/html');

function hash(str) {
  let h = 2166136261;
  for (let i=0;i<str.length;i++) {
    h ^= str.charCodeAt(i);
    h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);
  }
  return (h>>>0).toString(16);
}

function titleCaseWord(v) {
  v = clean(v);
  return v ? v[0].toUpperCase()+v.slice(1).toLowerCase() : '';
}

function firstTwoNames(name) {
  const p = clean(name).split(/\s+/).filter(Boolean);
  if (!p.length) return 'estudiante';
  return p.slice(0,2).map(titleCaseWord).join(' ');
}

function button(text, color=null) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.style.cssText = `border:1px solid ${color||'#999'};background:${color||'white'};color:${color?'white':'#222'};padding:6px 10px;border-radius:5px;cursor:pointer;font-size:12px;`;
  return b;
}

function linkButton(text, href, color=COLOR.blue) {
  const a = document.createElement('a');
  a.textContent = text; a.href = href; a.target = '_blank'; a.rel='noopener noreferrer';
  a.style.cssText = `display:inline-block;padding:5px 8px;background:${color};color:white;text-decoration:none;border-radius:4px;font-size:12px;white-space:nowrap;`;
  return a;
}

async function fetchPage(url, options={}) {
  const response = await fetch(url, {credentials:'same-origin', cache:'no-store', ...options});
  const html = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return {response, html, doc: docFromHtml(html), finalUrl: response.url};
}

/* ========================= Dates / 48 h ========================= */

const MONTHS_ES = {enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11};

function parseSpanishDate(text) {
  const t = String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const m = t.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})\s*,?\s*(\d{1,2}):(\d{2})/i);
  if (!m) return null;
  const ts = new Date(+m[3], MONTHS_ES[m[2]], +m[1], +m[4], +m[5], 0, 0).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function extractDate(post) {
  const time = post.querySelector('time');
  const datetime = clean(time?.getAttribute('datetime')||'');
  const timeText = clean(time?.textContent||'');
  const authorText = clean(post.querySelector('.author')?.textContent||'');
  let ts = null;
  if (datetime) { const p = Date.parse(datetime); if (Number.isFinite(p)) ts=p; }
  if (ts===null && timeText) { const p=Date.parse(timeText); ts=Number.isFinite(p)?p:parseSpanishDate(timeText); }
  if (ts===null && authorText) ts=parseSpanishDate(authorText);
  return {raw: datetime||timeText||authorText, timestamp: ts};
}

function formatDate(ts, fallback='') {
  if (!Number.isFinite(Number(ts))) return clean(fallback)||'Fecha no disponible';
  try {
    return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(Number(ts))).replace(/\./g,'');
  } catch { return new Date(Number(ts)).toLocaleString(); }
}

function shortDuration(ms) {
  ms=Math.max(0,Number(ms)||0);
  const d=Math.floor(ms/DAY), h=Math.floor((ms%DAY)/HOUR), m=Math.floor((ms%HOUR)/60000);
  if (d>0) return `${d} d ${h} h`;
  if (h>0) return `${h} h ${m} min`;
  return `${m} min`;
}

function postAge(post) {
  return Number.isFinite(Number(post?.dateTimestamp)) ? Math.max(0,Date.now()-Number(post.dateTimestamp)) : null;
}

function sla(post) {
  if (!post || post.role!=='Estudiante' || post.directAnswered) return null;
  const age=postAge(post);
  if (age===null) return {code:'unknown',icon:'⚪',color:COLOR.gray,text:'Pendiente · fecha no disponible',age:null};
  if (age>=RESPONSE_LIMIT) return {code:'overdue',icon:'🔴',color:COLOR.red,text:`Pendiente ${shortDuration(age)} · supera 48 h`,age};
  if (age>=DAY) return {code:'priority',icon:'🟠',color:COLOR.orange,text:`Pendiente ${shortDuration(age)} · quedan ${shortDuration(RESPONSE_LIMIT-age)}`,age};
  return {code:'recent',icon:'🟢',color:COLOR.green,text:`Pendiente ${shortDuration(age)} · quedan ${shortDuration(RESPONSE_LIMIT-age)}`,age};
}

function oldestPending(posts) {
  const pending=posts.filter(p=>p.role==='Estudiante'&&!p.directAnswered);
  const dated=pending.filter(p=>Number.isFinite(Number(p.dateTimestamp))).sort((a,b)=>Number(a.dateTimestamp)-Number(b.dateTimestamp));
  return dated[0]||pending[0]||null;
}

/* ========================= Classroom configuration ========================= */

function normalizeForumUrl(url) {
  let u;
  try { u=new URL(String(url||'').trim(),location.href); } catch { throw new Error('URL no válida.'); }
  if (u.origin!==location.origin) throw new Error('Por seguridad, las aulas configuradas deben pertenecer a la misma instalación Moodle/origen que la página actual.');
  if (!/\/mod\/forum\/view\.php$/i.test(u.pathname)) throw new Error('La URL debe corresponder a mod/forum/view.php.');
  const id=u.searchParams.get('id');
  if (!/^\d+$/.test(id||'')) throw new Error('La URL debe contener un parámetro id numérico.');
  const cleanUrl=new URL(u.origin+u.pathname); cleanUrl.searchParams.set('id',id); return cleanUrl.href;
}

function classroomUid(url) { return `forum_${hash(normalizeForumUrl(url))}`; }

function configuredClassrooms() {
  let data=[];
  try { data=JSON.parse(localStorage.getItem(K.classrooms)||'[]'); } catch { data=[]; }
  if (!Array.isArray(data)) data=[];
  const seen=new Set(), out=[];
  for (const x of data) {
    try {
      const url=normalizeForumUrl(x.url); if (seen.has(url)) continue; seen.add(url);
      out.push({uid:x.uid||classroomUid(url),name:clean(x.name)||`Foro ${forumId(url)}`,url,forumId:forumId(url),active:x.active!==false});
    } catch {}
  }
  return out;
}

function saveClassrooms(list) { localStorage.setItem(K.classrooms,JSON.stringify(list)); updatePanelMeta(); }

function addClassroom(url,name='',active=true) {
  const normalized=normalizeForumUrl(url), list=configuredClassrooms();
  let existing=list.find(x=>x.url===normalized);
  if (existing) { if (name) existing.name=clean(name); existing.active=active; saveClassrooms(list); return existing; }
  existing={uid:classroomUid(normalized),name:clean(name)||`Foro ${forumId(normalized)}`,url:normalized,forumId:forumId(normalized),active};
  list.push(existing); saveClassrooms(list); return existing;
}

function detectForumName(doc=document) {
  for (const s of ['.page-header-headings h1','#page-header h1','[data-region="page-header"] h1','h1']) {
    const t=clean(doc.querySelector(s)?.textContent||''); if (t) return t;
  }
  return clean(doc.title)||`Foro ${forumId()}`;
}

function ensureCurrentClassroom() {
  if (!/\/mod\/forum\/view\.php$/i.test(location.pathname) || configuredClassrooms().length) return;
  try { addClassroom(location.href,detectForumName(document),true); } catch {}
}

function activeClassrooms() { return configuredClassrooms().filter(x=>x.active); }

function groupSelector(doc) {
  return doc.querySelector('select[name="group"]') || [...doc.querySelectorAll('select')].find(s=>[...s.options].some(o=>/^\d+$/.test(String(o.value||''))&&String(o.value)!=='0') && [...s.options].some(o=>/grupo|group|\d{6}_\d+/i.test(clean(o.textContent)))) || null;
}

async function classroomUnits(classroom) {
  const page=await fetchPage(classroom.url), selector=groupSelector(page.doc), units=[];
  if (selector) {
    for (const opt of [...selector.options]) {
      const id=String(opt.value||''), name=clean(opt.textContent);
      if (!/^\d+$/.test(id)||id==='0'||/todos|all participants/i.test(name)) continue;
      const u=new URL(classroom.url); u.searchParams.set('group',id);
      units.push({key:`${classroom.uid}::${id}`,classroomUid:classroom.uid,classroomName:classroom.name,forumId:classroom.forumId,id,name:name||`Grupo ${id}`,single:false,url:u.href});
    }
  }
  if (!units.length) units.push({key:`${classroom.uid}::single`,classroomUid:classroom.uid,classroomName:classroom.name,forumId:classroom.forumId,id:`single-${classroom.forumId}`,name:'Grupo único',single:true,url:classroom.url});
  return units;
}

async function allUnits(classrooms,onStatus=()=>{}) {
  const units=[], errors=[];
  for (let i=0;i<classrooms.length;i++) {
    try { onStatus(`Leyendo ${classrooms[i].name} (${i+1}/${classrooms.length})...`); units.push(...await classroomUnits(classrooms[i])); }
    catch(error){ errors.push({classroom:classrooms[i],error}); }
  }
  return {units,errors};
}

/* ========================= Tutor identity ========================= */

function tutorIdentity() {
  let name='';
  for (const s of ['.usermenu .usertext','[data-region="usermenu"] .usertext','.usermenu .userbutton','.logininfo a']) {
    const e=document.querySelector(s); if (clean(e?.textContent||'')) { name=clean(e.textContent); break; }
  }
  let id='',profile='';
  for (const a of document.querySelectorAll('[data-region="usermenu"] a[href*="/user/"],.usermenu a[href*="/user/"],.logininfo a[href*="/user/"]')) {
    const x=userId(a.getAttribute('href')); if (x){ id=x; profile=absoluteUrl(a.getAttribute('href')); break; }
  }
  return {name,id,profile};
}

function isTutor(author,tutor) {
  if (author.userId && tutor.id) return author.userId===tutor.id;
  const a=normName(author.name), t=normName(tutor.name); return !!a && !!t && a===t;
}

/* ========================= Forum parsing ========================= */

function discussionUrls(doc) {
  const m=new Map();
  for (const a of doc.querySelectorAll('a[href*="/mod/forum/discuss.php?d="]')) {
    try { const u=new URL(a.getAttribute('href'),location.origin), d=u.searchParams.get('d'); if(!d||m.has(d))continue; const c=new URL(u.origin+u.pathname); c.searchParams.set('d',d); m.set(d,c.href); } catch {}
  }
  return [...m.values()];
}

function postNodes(doc) {
  const selectors=['article[data-post-id]','[data-region="post"][data-post-id]','.forumpost[id^="p"]','.forumpost'];
  let nodes=[]; for (const s of selectors){nodes=[...doc.querySelectorAll(s)];if(nodes.length)break;}
  const seen=new Set(); return nodes.filter((p,i)=>{const id=getPostId(p,i);if(seen.has(id))return false;seen.add(id);return true;});
}

function getPostId(p,i=0) {
  const d=p.getAttribute('data-post-id'); if(d)return String(d);
  const m=(p.id||'').match(/p(\d+)/i)||(p.id||'').match(/(\d+)$/); return m?m[1]:(p.id||`post_${i}`);
}

function explicitParent(p) {
  for (const a of ['data-parent-id','data-parent','data-parent-post-id','data-parentpostid']) { const v=p.getAttribute(a); if(/^\d+$/.test(v||'')&&v!=='0')return v; }
  const links=[...p.querySelectorAll('a[href]')];
  const previous=links.find(a=>{const t=norm(a.textContent);return t.includes('mostrar mensaje anterior')||t.includes('show parent')||t==='mensaje anterior';});
  if (previous) {
    try { const u=new URL(previous.getAttribute('href'),location.origin), pa=u.searchParams.get('parent'); if(/^\d+$/.test(pa||'')&&pa!=='0')return pa; const m=u.hash.match(/#p(\d+)/i);if(m)return m[1]; } catch {}
  }
  for (const a of links) { const h=a.getAttribute('href')||''; if(!/[?&]parent=\d+/i.test(h))continue; try { const pa=new URL(h,location.origin).searchParams.get('parent');if(/^\d+$/.test(pa||'')&&pa!=='0')return pa;}catch{} }
  return '';
}

function indentLevel(p) { let n=0,e=p.parentElement; while(e&&e.tagName!=='BODY'){if(e.classList?.contains('indent'))n++;e=e.parentElement;} return n; }

function authorInfo(p) {
  const a=p.querySelector('.author a[href*="/user/"],a[href*="/user/view.php"],a[href*="/user/profile.php"]');
  if (a) { const h=a.getAttribute('href'); return {name:clean(a.textContent),profile:absoluteUrl(h),userId:userId(h)}; }
  const au=p.querySelector('.author'); return {name:clean(au?.textContent||'').replace(/,\s*(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo).*$/i,'').trim(),profile:'',userId:''};
}

function postSubject(p) { return clean((p.querySelector('.subject')||p.querySelector('[data-region="post-subject"]'))?.textContent||''); }
function postContent(p) { for(const s of ['.post-content-container','.posting','[data-region="post-content"]','.post-content','.content']){const e=p.querySelector(s);if(e)return clean(e.innerText||e.textContent);} return ''; }

function postAttachments(p) {
  const m=new Map();
  for (const a of p.querySelectorAll('a[href*="/pluginfile.php/"]')) {
    const url=absoluteUrl(a.getAttribute('href')); if(!url||m.has(url))continue;
    let name=clean(a.textContent); if(!name){try{name=decodeURIComponent(new URL(url).pathname.split('/').pop()||'Archivo adjunto');}catch{name='Archivo adjunto';}}
    m.set(url,{name,url});
  }
  return [...m.values()];
}

function permanentLink(p,discussionUrl) {
  const a=[...p.querySelectorAll('a[href]')].find(x=>/enlace permanente|permalink/i.test(clean(x.textContent)));
  if(a){const h=absoluteUrl(a.getAttribute('href'),discussionUrl);if(h)return h;} return p.id?`${discussionUrl}#${p.id}`:discussionUrl;
}

function replyLink(p,discussionUrl) {
  const a=[...p.querySelectorAll('a[href]')].find(x=>/[?&]reply=\d+/i.test(x.getAttribute('href')||'')||['responder','reply'].some(k=>norm(x.textContent).includes(k)));
  return a?absoluteUrl(a.getAttribute('href'),discussionUrl):'';
}

function parseDiscussion(doc,unit,discussionUrl,tutor) {
  const nodes=postNodes(doc), out=[], stack=[];
  nodes.forEach((p,i)=>{
    const author=authorInfo(p), content=postContent(p); if(!author.name||!content)return;
    const id=getPostId(p,i), level=indentLevel(p), explicit=explicitParent(p), fallback=level>0&&stack[level-1]?stack[level-1].postId:'';
    let parent=explicit||fallback; if(parent===id)parent='';
    const dt=extractDate(p), attachments=postAttachments(p), role=isTutor(author,tutor)?'Tutor':'Estudiante';
    const row={classroomUid:unit.classroomUid,classroomName:unit.classroomName,forumId:unit.forumId,unitKey:unit.key,group:unit.name,groupId:unit.id,role,status:role==='Tutor'?'Intervención del tutor':'Respuesta de estudiante',author:author.name,authorId:author.userId,dateRaw:dt.raw,dateTimestamp:dt.timestamp,subject:postSubject(p),content,attachments,profile:author.profile,link:permanentLink(p,discussionUrl),replyUrl:replyLink(p,discussionUrl),discussionUrl,postId:id,parentPostId:parent,parentSource:explicit?'Moodle':(fallback?'Sangría':''),directAnswered:false,tutorInBranch:false};
    out.push(row); stack[level]=row; stack.length=level+1;
  });
  analyzeAnswers(out); return out;
}

function analyzeAnswers(posts) {
  const children=new Map();
  for(const p of posts){if(!p.parentPostId||p.parentPostId===p.postId)continue;if(!children.has(p.parentPostId))children.set(p.parentPostId,[]);children.get(p.parentPostId).push(p);}
  const tutorBelow=(id,seen=new Set())=>{if(seen.has(id))return false;seen.add(id);for(const h of children.get(id)||[]){if(h.role==='Tutor'||tutorBelow(h.postId,seen))return true;}return false;};
  for(const p of posts){if(p.role!=='Estudiante')continue;const hs=children.get(p.postId)||[];p.directAnswered=hs.some(h=>h.role==='Tutor');p.tutorInBranch=!p.directAnswered&&tutorBelow(p.postId);}
}

function findRootPost(doc) {
  const ps=postNodes(doc); if(!ps.length)return null; const ids=new Set(ps.map((p,i)=>String(getPostId(p,i))));
  return ps.find((p,i)=>{const id=String(getPostId(p,i)),pa=String(explicitParent(p)||'');return !pa||pa===id||!ids.has(pa);})||ps[0];
}

/* ========================= Attachments UI ========================= */

function attachmentAction(file) {
  const n=(file?.name||'').toLowerCase();
  if(/\.pdf$/.test(n))return ['📄','Abrir PDF'];
  if(/\.(png|jpe?g|gif|webp|svg)$/.test(n))return ['🖼️','Ver imagen'];
  if(/\.(docx?|odt|rtf)$/.test(n))return ['📘','Descargar Word'];
  if(/\.(xlsx?|xlsm|ods|csv)$/.test(n))return ['📊','Descargar Excel'];
  if(/\.(pptx?|odp)$/.test(n))return ['📽️','Descargar PowerPoint'];
  if(/\.(zip|rar|7z|tar|gz|tgz)$/.test(n))return ['📦','Descargar archivo'];
  return ['📎','Abrir archivo'];
}

function attachmentsUi(post) {
  if(!post.attachments?.length)return null;
  const d=document.createElement('details'),s=document.createElement('summary'),box=document.createElement('div');
  s.textContent=`📎 Adjuntos (${post.attachments.length})`; s.style.cssText='cursor:pointer;padding:5px 8px;border:1px solid #777;border-radius:4px;display:inline-block;font-size:12px;';
  box.style.cssText='margin-top:6px;padding:8px;border:1px solid #ccc;border-radius:6px;background:white;min-width:280px;';
  for(const f of post.attachments){const row=document.createElement('div'),a=document.createElement('a'),[icon,label]=attachmentAction(f);row.style.cssText='display:flex;gap:8px;justify-content:space-between;align-items:center;padding:4px 0;';row.textContent=`${icon} ${f.name}`;a.href=f.url;a.target='_blank';a.rel='noopener';a.textContent=label;a.style.cssText='margin-left:auto;';row.appendChild(a);box.appendChild(row);}
  d.append(s,box); return d;
}

/* ========================= Markdown + images ========================= */

function inlineMarkdown(text) {
  const src=String(text??''), rx=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"']+)/g;
  const stylePart=t=>esc(t).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>');
  let out='',last=0,m;
  while((m=rx.exec(src))!==null){
    out+=stylePart(src.slice(last,m.index));
    if(m[1]){
      out+=`<a href="${esc(m[2])}" target="_blank" rel="noopener noreferrer">${stylePart(m[1])}</a>`;
    } else {
      const url=m[3].replace(/[.,;!?]+$/,'');
      const suffix=m[3].slice(url.length);
      out+=`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>${esc(suffix)}`;
    }
    last=rx.lastIndex;
  }
  return out+stylePart(src.slice(last));
}

function htmlClipboardToMarkdown(html){
  if(!html) return null;
  const dom=new DOMParser().parseFromString(html,'text/html');
  const anchors=[...dom.body.querySelectorAll('a[href]')].filter(a=>/^https?:\/\//i.test(a.href));
  if(!anchors.length) return null;
  const walk=node=>{
    if(node.nodeType===3)return node.nodeValue||'';
    if(node.nodeType!==1)return '';
    const tag=node.tagName.toLowerCase();
    if(['script','style','svg','meta','noscript'].includes(tag))return '';
    if(tag==='br')return '\n';
    const inner=[...node.childNodes].map(walk).join(''),trimmed=inner.trim();
    if(tag==='a'){
      const href=node.getAttribute('href')||'';
      let url='';
      try{const parsed=new URL(href,location.href);if(['http:','https:'].includes(parsed.protocol))url=parsed.href;}catch{}
      if(!url)return trimmed;
      const label=trimmed.replace(/[\r\n]+/g,' ').replace(/[\[\]]/g,'').trim()||url;
      return `[${label}](${url.replace(/\)/g,'%29')})`;
    }
    if(['strong','b'].includes(tag))return trimmed?`**${trimmed}**`:'';
    if(['em','i'].includes(tag))return trimmed?`*${trimmed}*`:'';
    if(tag==='li')return `- ${trimmed}\n`;
    if(/^h[1-6]$/.test(tag))return `\n${'#'.repeat(Math.min(3,Number(tag[1])))} ${trimmed}\n\n`;
    if(['p','div','section','article','blockquote'].includes(tag))return `${inner.trim()}\n\n`;
    if(['ul','ol'].includes(tag))return `${inner.trim()}\n\n`;
    return inner;
  };
  return walk(dom.body).replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

function attachRichPaste(textarea){
  textarea.addEventListener('paste',event=>{
    const html=event.clipboardData?.getData('text/html')||'';
    const markdown=htmlClipboardToMarkdown(html);
    if(!markdown)return;
    event.preventDefault();
    const start=textarea.selectionStart??textarea.value.length,end=textarea.selectionEnd??start;
    textarea.value=textarea.value.slice(0,start)+markdown+textarea.value.slice(end);
    textarea.selectionStart=textarea.selectionEnd=start+markdown.length;
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
  });
}

function imageToken(id){ return `[[MFTIMG:${id}]]`; }

function renderMessage(text,images=[],mode='preview') {
  const byId=new Map(images.map(x=>[x.id,x])), out=[]; let ul=false;
  const closeUl=()=>{if(ul){out.push('</ul>');ul=false;}};
  for(const raw of String(text||'').replace(/\r\n/g,'\n').split('\n')){
    const line=raw.trim(), token=line.match(/^\[\[MFTIMG:([^\]]+)\]\]$/);
    if(token){closeUl();const im=byId.get(token[1]);if(!im){out.push('<p><em>[Imagen no cargada en esta sesión]</em></p>');continue;}if(mode==='preview')out.push(`<figure style="margin:10px 0"><img src="${esc(im.objectUrl)}" alt="${esc(im.alt||im.file.name)}" style="max-width:100%;height:auto"><figcaption style="font-size:12px;color:#666">${esc(im.file.name)}</figcaption></figure>`);else out.push(`<span data-mft-image-id="${esc(im.id)}"></span>`);continue;}
    if(!line){closeUl();continue;}
    const li=line.match(/^[-*]\s+(.+)$/);if(li){if(!ul){out.push('<ul>');ul=true;}out.push(`<li>${inlineMarkdown(li[1])}</li>`);continue;}
    closeUl();const h3=line.match(/^###\s+(.+)$/),h2=line.match(/^##\s+(.+)$/),h1=line.match(/^#\s+(.+)$/);
    if(h3)out.push(`<h3>${inlineMarkdown(h3[1])}</h3>`);else if(h2)out.push(`<h2>${inlineMarkdown(h2[1])}</h2>`);else if(h1)out.push(`<h1>${inlineMarkdown(h1[1])}</h1>`);else out.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeUl();return out.join('\n');
}

function fileToBase64(file) {
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||'').split(',')[1]||'');r.onerror=()=>reject(r.error||new Error('No fue posible leer la imagen.'));r.readAsDataURL(file);});
}

function createImageEditor(textarea,preview,initialImages=[]) {
  const images=[...initialImages], root=document.createElement('div'), input=document.createElement('input'), add=button('🖼 Añadir imagen',COLOR.purple), list=document.createElement('div');
  input.type='file'; input.accept='image/png,image/jpeg,image/gif,image/webp'; input.multiple=true; input.style.display='none';
  root.style.cssText='margin-top:8px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fafafa;';
  list.style.cssText='margin-top:7px;display:flex;gap:7px;flex-wrap:wrap;';
  add.onclick=()=>input.click();
  const updatePreview=()=>{preview.innerHTML=renderMessage(textarea.value,images,'preview')||'<em>El mensaje está vacío.</em>';};
  function renderList(){list.innerHTML='';for(const im of images){const chip=document.createElement('div'),rm=button('×',COLOR.red);chip.style.cssText='display:flex;align-items:center;gap:5px;background:white;border:1px solid #ccc;border-radius:5px;padding:4px 6px;font-size:12px;';chip.append(document.createTextNode(`🖼 ${im.file.name}`),rm);rm.onclick=()=>{const idx=images.indexOf(im);if(idx>=0)images.splice(idx,1);textarea.value=textarea.value.replaceAll(imageToken(im.id),'');URL.revokeObjectURL(im.objectUrl);renderList();updatePreview();};list.appendChild(chip);}}
  input.onchange=()=>{for(const file of [...(input.files||[])]){if(!ALLOWED_IMAGE_TYPES.has(file.type)){alert(`Formato no admitido: ${file.name}`);continue;}if(file.size>MAX_IMAGE_BYTES){alert(`${file.name} supera el límite local de 8 MB.`);continue;}const id=`${hash(file.name+'|'+file.size+'|'+file.lastModified)}_${images.length}`;const im={id,file,alt:file.name,objectUrl:URL.createObjectURL(file)};images.push(im);const token=`\n${imageToken(id)}\n`;const start=textarea.selectionStart??textarea.value.length,end=textarea.selectionEnd??start;textarea.value=textarea.value.slice(0,start)+token+textarea.value.slice(end);textarea.selectionStart=textarea.selectionEnd=start+token.length;}input.value='';renderList();updatePreview();textarea.dispatchEvent(new Event('input',{bubbles:true}));};
  textarea.addEventListener('input',updatePreview);attachRichPaste(textarea);root.append(add,input,list);renderList();updatePreview();
  return {root,images,updatePreview,destroy:()=>images.forEach(im=>URL.revokeObjectURL(im.objectUrl))};
}

/* ========================= Native Moodle image upload ========================= */

function cloneFormData(form, win=window) {
  const source=new win.FormData(form), target=new FormData();
  for(const [k,v] of source.entries()) target.append(k,v);
  return target;
}

function messageField(form) {
  return form.querySelector('textarea[name="message[text]"]')||form.querySelector('textarea[name="message"]')||form.querySelector('textarea[name*="message"]')||form.querySelector('[name="message[text]"]');
}

function replyForm(doc) {
  const forms=[...doc.querySelectorAll('form')].filter(f=>messageField(f));
  return forms.find(f=>f.querySelector('[name="sesskey"]'))||forms[0]||null;
}

async function waitForTiny(win, form, timeout=15000) {
  const start=Date.now();
  while(Date.now()-start<timeout){
    const tinymce=win.tinymce;
    if(tinymce?.editors?.length){const field=messageField(form);const editor=tinymce.editors.find(e=>e.targetElm===field||e.targetElm?.name===field?.name||e.id===field?.id)||tinymce.activeEditor;if(editor?.initialized!==false&&editor?.getBody())return editor;}
    await sleep(250);
  }
  return null;
}

async function postUsingNativeEditor(url, html, images=[]) {
  if(!images.length) return postSimple(url,html);
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe'); frame.dataset.mftUploader='1'; frame.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1200px;height:900px;border:0;opacity:.01;pointer-events:none;';
    let finished=false; const cleanup=()=>{if(!finished){finished=true;frame.remove();}};
    const timer=setTimeout(()=>{cleanup();reject(new Error('Moodle tardó demasiado en inicializar el editor de imágenes. Use “Abrir en Moodle” como alternativa.'));},25000);
    frame.onload=async()=>{
      try{
        const win=frame.contentWindow, doc=frame.contentDocument, form=replyForm(doc); if(!form)throw new Error('No se encontró el formulario de respuesta de Moodle.');
        const editor=await waitForTiny(win,form); if(!editor)throw new Error('No se detectó TinyMCE con carga de imágenes en esta instalación. La respuesta con imágenes debe completarse desde el editor nativo de Moodle.');
        editor.setContent(html);
        const body=editor.getBody(), cache=editor.editorUpload?.blobCache; if(!cache)throw new Error('El editor no expone el cargador de imágenes de Moodle.');
        for(let i=0;i<images.length;i++){
          const im=images[i], placeholder=body.querySelector(`[data-mft-image-id="${CSS.escape(im.id)}"]`); if(!placeholder)continue;
          const base64=await fileToBase64(im.file), blobInfo=cache.create(`mft_${Date.now()}_${i}`,im.file,base64); cache.add(blobInfo);
          const img=doc.createElement('img'); img.src=blobInfo.blobUri(); img.alt=im.alt||im.file.name; img.style.maxWidth='100%'; img.style.height='auto'; placeholder.replaceWith(img);
        }
        const results=await editor.uploadImages(); if(Array.isArray(results)&&results.some(r=>r&&r.status===false))throw new Error('Moodle rechazó una o más imágenes durante la carga.');
        editor.save();
        const field=messageField(form); if(!field?.value)throw new Error('El editor no transfirió el contenido al formulario.');
        const action=form.getAttribute('action')?absoluteUrl(form.getAttribute('action'),frame.src):frame.src, data=cloneFormData(form,win);
        const submit=[...form.querySelectorAll('input[type="submit"][name],button[type="submit"][name]')].find(b=>!/cancel|cancelar/i.test(clean(b.value||b.textContent)));
        if(submit?.name)data.set(submit.name,submit.value||clean(submit.textContent)||'Enviar');
        const response=await fetch(action,{method:'POST',credentials:'same-origin',body:data,redirect:'follow'}), text=await response.text();
        if(!response.ok)throw new Error(`Moodle devolvió HTTP ${response.status}.`);
        const resultDoc=docFromHtml(text); if(replyForm(resultDoc)&&/post\.php/i.test(response.url))throw new Error('Moodle regresó al formulario después del envío; la publicación no pudo confirmarse.');
        clearTimeout(timer); cleanup(); resolve({ok:true,url:response.url});
      }catch(error){clearTimeout(timer);cleanup();reject(error);}
    };
    document.body.appendChild(frame); frame.src=url;
  });
}

async function postSimple(url,html) {
  const page=await fetchPage(url), form=replyForm(page.doc); if(!form)throw new Error('No se encontró el formulario de respuesta.');
  const data=new FormData(form), field=messageField(form); if(!field?.name)throw new Error('No se encontró el campo del mensaje.'); data.set(field.name,html);
  const format=form.querySelector('[name="message[format]"]')||form.querySelector('[name="messageformat"]');if(format)data.set(format.name,'1');
  const submit=[...form.querySelectorAll('input[type="submit"][name],button[type="submit"][name]')].find(b=>!/cancel|cancelar/i.test(clean(b.value||b.textContent)));if(submit?.name)data.set(submit.name,submit.value||clean(submit.textContent)||'Enviar');
  const action=form.getAttribute('action')?absoluteUrl(form.getAttribute('action'),page.finalUrl):page.finalUrl, res=await fetchPage(action,{method:'POST',body:data,redirect:'follow'});
  if(replyForm(res.doc)&&/post\.php/i.test(res.finalUrl))throw new Error('Moodle regresó al formulario; la publicación no pudo confirmarse.'); return {ok:true,url:res.finalUrl};
}

function postContainsImages(node, images) {
  if(!images?.length)return true; const html=node.innerHTML.toLowerCase(); return images.every(im=>html.includes(im.file.name.toLowerCase()) || [...node.querySelectorAll('img')].some(img=>(img.alt||'').toLowerCase()===im.file.name.toLowerCase()));
}

function postIdFromRedirect(url){
  try{
    const u=new URL(url,location.href),m=u.hash.match(/^#p(\d+)/i);
    if(m)return m[1];
    return u.searchParams.get('postid')||u.searchParams.get('post')||'';
  }catch{return '';}
}

function signatureWindows(html){
  const source=new DOMParser().parseFromString(`<div>${html}</div>`,'text/html').body.textContent||'';
  const words=norm(source).replace(/https?:\/\/\S+/g,' ').replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean);
  if(!words.length)return [];
  const size=Math.min(7,Math.max(3,Math.floor(words.length/3)));
  const starts=[0,Math.max(0,Math.floor((words.length-size)/2)),Math.max(0,words.length-size)];
  return [...new Set(starts.map(i=>words.slice(i,i+size).join(' ')))].filter(Boolean);
}

function publishedTextMatch(post,html,mode='strict'){
  const expected=signatureWindows(html);
  if(!expected.length)return true;
  const actual=norm(postContent(post)).replace(/https?:\/\/\S+/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  if(!actual)return false;
  const score=expected.filter(part=>` ${actual} `.includes(` ${part} `)).length;
  return score >= (mode==='strict'&&expected.length>1?2:1);
}

function postImageMatch(post,images,mode='strict'){
  if(!images?.length)return true;
  const markup=post.innerHTML.toLowerCase(),elements=[...post.querySelectorAll('img')];
  return images.every(im=>{
    const name=im.file.name.toLowerCase();
    return markup.includes(name)||elements.some(e=>{
      let decoded='';try{decoded=decodeURIComponent(e.getAttribute('src')||'').toLowerCase();}catch{}
      return (e.getAttribute('alt')||'').toLowerCase()===name||decoded.includes(encodeURIComponent(name).toLowerCase())||decoded.includes(name);
    });
  })||(mode==='new'&&elements.length>=images.length);
}

function postedByTutor(post,tutor,expectedPostId=''){
  if(isTutor(authorInfo(post),tutor))return true;
  return !!expectedPostId&&String(getPostId(post))===String(expectedPostId);
}

async function verifyDirect(discussionUrl,tutor,parentId,html,images,priorIds=new Set(),submission=null){
  const expectedId=postIdFromRedirect(submission?.url);
  for(let attempt=0;attempt<6;attempt++){
    await sleep(attempt?1250:650);
    const page=await fetchPage(discussionUrl),nodes=postNodes(page.doc);
    for(let i=0;i<nodes.length;i++){
      const node=nodes[i],id=String(getPostId(node,i));
      if(String(explicitParent(node))!==String(parentId))continue;
      if(priorIds.has(id)&&id!==String(expectedId))continue;
      if(expectedId&&id!==String(expectedId))continue;
      if(!postedByTutor(node,tutor,expectedId))continue;
      if(!publishedTextMatch(node,html,expectedId?'new':'strict'))continue;
      if(!postImageMatch(node,images,'new'))continue;
      const a=authorInfo(node),dt=extractDate(node);
      return {ok:true,post:{role:'Tutor',author:a.name||tutor.name,authorId:a.userId,dateRaw:dt.raw,dateTimestamp:dt.timestamp,subject:postSubject(node),content:postContent(node),attachments:postAttachments(node),profile:a.profile,link:permanentLink(node,discussionUrl),replyUrl:replyLink(node,discussionUrl),discussionUrl,postId:id,parentPostId:String(parentId),parentSource:'Moodle',directAnswered:false,tutorInBranch:false}};
    }
  }
  return {ok:false};
}

async function sendDirect(post,tutor,text,images){
  const html=renderMessage(text,images,'publish').trim();
  if(!html)throw new Error('La respuesta está vacía.');
  const baseline=new Set(postNodes((await fetchPage(post.discussionUrl)).doc).map((p,i)=>String(getPostId(p,i))));
  const result=await postUsingNativeEditor(post.replyUrl,html,images);
  const verified=await verifyDirect(post.discussionUrl,tutor,post.postId,html,images,baseline,result);
  if(!verified.ok)throw new Error('Moodle recibió el envío, pero no se identificó con certeza la nueva respuesta directa. Revise Moodle antes de reintentar para evitar duplicados.');
  return verified.post;
}

/* ========================= Campaigns ========================= */

function imageSignature(images){return (images||[]).map(x=>`${x.file.name}|${x.file.size}|${x.file.lastModified}`).join('||');}
function campaignKey(text,images){return `${K.campaignPrefix}${location.origin}_${hash(text+'||'+imageSignature(images))}`;}
function campaign(text,images){try{return JSON.parse(localStorage.getItem(campaignKey(text,images))||'{"sent":{}}');}catch{return{sent:{}};}}
function saveCampaign(text,images,r){localStorage.setItem(campaignKey(text,images),JSON.stringify(r));}
function markUncertain(text,images,unit,details={}){
  const r=campaign(text,images);r.uncertain=r.uncertain||{};
  r.uncertain[unit.key]={classroomUid:unit.classroomUid,classroomName:unit.classroomName,group:unit.name,date:Date.now(),...details};
  saveCampaign(text,images,r);
}

function uncertainty(text,images,unit){return campaign(text,images).uncertain?.[unit.key]||null;}

function clearUncertain(text,images,unit){const r=campaign(text,images);if(r.uncertain)delete r.uncertain[unit.key];saveCampaign(text,images,r);}

function markSent(text,images,unit,extra={}){
  const r=campaign(text,images);r.sent=r.sent||{};r.uncertain=r.uncertain||{};
  r.sent[unit.key]={classroomUid:unit.classroomUid,classroomName:unit.classroomName,group:unit.name,date:Date.now(),...extra};
  delete r.uncertain[unit.key];
  saveCampaign(text,images,r);
}
function wasSent(text,images,unit){return !!campaign(text,images).sent?.[unit.key];}
function classroomTested(text,images,uid){return Object.values(campaign(text,images).sent||{}).some(x=>x.classroomUid===uid&&x.test===true);}
function anyTested(text,images){return Object.values(campaign(text,images).sent||{}).some(x=>x.test===true);}

async function existingMassPost(doc,tutor,html,images){
  for(const post of postNodes(doc)){
    if(!isTutor(authorInfo(post),tutor))continue;
    if(publishedTextMatch(post,html,'strict')&&postImageMatch(post,images,'strict'))return true;
  }
  return false;
}

async function verifyNewMassPost(discussionUrl,tutor,html,images,oldIds,submission){
  const expectedId=postIdFromRedirect(submission?.url);
  for(let attempt=0;attempt<6;attempt++){
    await sleep(attempt?1250:650);
    const nodes=postNodes((await fetchPage(discussionUrl)).doc);
    const newlyCreated=nodes.filter((p,i)=>!oldIds.has(String(getPostId(p,i))));
    const candidates=expectedId?nodes.filter((p,i)=>String(getPostId(p,i))===String(expectedId)):newlyCreated;
    for(let i=0;i<candidates.length;i++){
      const post=candidates[i],id=getPostId(post);
      const authorMatches=isTutor(authorInfo(post),tutor);
      if(!authorMatches&&!(expectedId&&String(id)===String(expectedId)))continue;
      const confidence=expectedId&&String(id)===String(expectedId)?'new':'strict';
      if(!publishedTextMatch(post,html,confidence)||!postImageMatch(post,images,'new'))continue;
      return {ok:true,postId:id};
    }
  }
  return {ok:false};
}

async function sendMassToUnit(unit,tutor,text,images,{test=false}={}){
  if(wasSent(text,images,unit)&&!test)return {ok:true,skipped:true,reason:'registro-local'};
  const groupPage=await fetchPage(unit.url),discussions=discussionUrls(groupPage.doc);
  if(!discussions.length)throw new Error('No se encontró discusión en el destino.');
  const durl=discussions[0],dpage=await fetchPage(durl),html=renderMessage(text,images,'publish').trim();
  if(await existingMassPost(dpage.doc,tutor,html,images)){
    markSent(text,images,unit,{test,url:durl,detected:true,method:'contenido'});
    return {ok:true,skipped:true,url:durl};
  }
  if(uncertainty(text,images,unit))throw new Error('Este destino tiene una publicación con verificación pendiente. Revísela en Moodle antes de autorizar otro envío.');
  const root=findRootPost(dpage.doc);
  if(!root)throw new Error('No se encontró el mensaje raíz.');
  let reply=replyLink(root,durl);
  if(!reply){const u=new URL('post.php',durl);u.searchParams.set('reply',getPostId(root,0));reply=u.href;}
  const baseline=new Set(postNodes(dpage.doc).map((p,i)=>String(getPostId(p,i))));
  let submission;
  try{submission=await postUsingNativeEditor(reply,html,images);}
  catch(error){
    markUncertain(text,images,unit,{url:durl,reason:'Error durante la publicación: '+error.message});
    throw new Error(`No se pudo confirmar el envío. ${error.message} Revise Moodle antes de reintentar.`);
  }
  const result=await verifyNewMassPost(durl,tutor,html,images,baseline,submission);
  if(!result.ok){
    markUncertain(text,images,unit,{url:durl,postId:postIdFromRedirect(submission?.url),reason:'No se localizó el nuevo mensaje después del POST.'});
    throw new Error('La publicación fue recibida, pero no se verificó. Se bloqueó el reintento automático; revise Moodle antes de continuar.');
  }
  markSent(text,images,unit,{test,url:durl,detected:true,postId:result.postId,method:'nuevo-post'});
  return {ok:true,skipped:false,url:durl};
}

/* ========================= Configuration modal ========================= */

function updatePanelMeta(){const e=document.getElementById('mft-panel-meta');if(!e)return;const a=configuredClassrooms(),n=a.filter(x=>x.active).length;e.textContent=`${n} foro(s) activo(s) de ${a.length} configurado(s).`;}

function exportForumConfig(){
  const data={format:'moodle-forum-toolkit-forums',version:1,origin:location.origin,exportedAt:new Date().toISOString(),forums:configuredClassrooms().map(({url,name,active})=>({url,name,active}))};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const link=document.createElement('a'),uri=URL.createObjectURL(blob);
  link.href=uri;link.download=`Moodle-Forum-Toolkit-foros-${location.hostname}.json`;
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(uri),1000);
}

async function importForumConfig(file,mode='merge'){
  const json=JSON.parse(await file.text());
  const incoming=Array.isArray(json)?json:(Array.isArray(json.forums)?json.forums:json.classrooms);
  if(!Array.isArray(incoming)||incoming.length>1000)throw new Error('El archivo no contiene una lista válida de foros.');
  const current=configuredClassrooms(),merged=mode==='replace'?[]:[...current];
  let added=0,existing=0,skipped=0;
  for(const item of incoming){
    try{
      const u=normalizeForumUrl(item.url);
      const found=merged.find(x=>x.url===u);
      if(found){existing++;continue;}
      merged.push({uid:classroomUid(u),name:clean(item.name)||`Foro ${forumId(u)}`,url:u,forumId:forumId(u),active:item.active!==false});
      added++;
    }catch{skipped++;}
  }
  if(!added&&mode==='replace')throw new Error('Ningún foro del archivo pertenece a esta instalación Moodle. No se modificó la configuración.');
  if(!added&&skipped&&current.length===0)throw new Error('Las URLs del archivo pertenecen a otra instalación Moodle.');
  saveClassrooms(merged);
  return {added,existing,skipped,total:merged.length};
}

function showClassroomConfig(){
  document.getElementById('mft-config')?.remove();
  const ov=document.createElement('div');ov.id='mft-config';ov.style.cssText='position:fixed;inset:0;z-index:250000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif;';
  const box=document.createElement('div');box.style.cssText='width:min(900px,96vw);max-height:94vh;overflow:auto;background:white;border-radius:10px;padding:18px;color:#222;';
  const title=document.createElement('h2');title.textContent='⚙ Configurar foros';
  const info=document.createElement('p');info.textContent='Marque los foros que desea revisar. Desmarcarlos no los elimina. Puede exportar esta lista como JSON, guardarla en Drive e importarla en otro computador conectado a la misma instalación Moodle.';
  const list=document.createElement('div'),name=document.createElement('input'),url=document.createElement('input'),status=document.createElement('div');
  name.placeholder='Nombre del aula/foro';url.placeholder='URL completa: .../mod/forum/view.php?id=1234';
  for(const input of [name,url])input.style.cssText='width:100%;padding:8px;box-sizing:border-box;margin:5px 0;';
  status.style.cssText='font-size:12px;margin-top:7px;line-height:1.4;';
  function render(){
    list.innerHTML='';
    for(const a of configuredClassrooms()){
      const row=document.createElement('div'),ck=document.createElement('input'),nm=document.createElement('input'),save=button('Guardar',COLOR.blue),del=button('Eliminar',COLOR.red);
      row.style.cssText='border:1px solid #ddd;border-radius:6px;padding:9px;margin:7px 0;display:flex;gap:7px;align-items:center;flex-wrap:wrap;';
      ck.type='checkbox';ck.checked=a.active;ck.title='Incluir en las revisiones y los envíos';
      nm.value=a.name;nm.style.cssText='flex:1 1 260px;padding:6px;';
      ck.onchange=()=>{const arr=configuredClassrooms(),item=arr.find(x=>x.uid===a.uid);if(item){item.active=ck.checked;saveClassrooms(arr);}};
      save.onclick=()=>{const arr=configuredClassrooms(),item=arr.find(x=>x.uid===a.uid);if(item){item.name=clean(nm.value)||item.name;saveClassrooms(arr);render();}};
      del.onclick=()=>{if(confirm(`¿Quitar “${a.name}” de la configuración local?\nNo se elimina ningún contenido de Moodle.`)){saveClassrooms(configuredClassrooms().filter(x=>x.uid!==a.uid));render();}};
      const meta=document.createElement('small');meta.textContent=a.url;meta.style.cssText='flex-basis:100%;color:#666;overflow-wrap:anywhere;';
      row.append(ck,nm,save,del,meta);list.appendChild(row);
    }
  }
  const add=button('+ Agregar',COLOR.green),current=button('+ Agregar foro actual',COLOR.blue),exportBtn=button('Exportar foros (.json)',COLOR.purple),importBtn=button('Importar foros (.json)',COLOR.gray),close=button('Cerrar'),file=document.createElement('input'),mode=document.createElement('select');
  mode.innerHTML='<option value="merge">Combinar (conservar los foros actuales)</option><option value="replace">Reemplazar toda la lista</option>';
  file.type='file';file.accept='.json,application/json';file.style.display='none';
  const bar=document.createElement('div');bar.style.cssText='display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px;';
  add.onclick=()=>{try{addClassroom(url.value,name.value,true);name.value='';url.value='';status.style.color=COLOR.green;status.textContent='✓ Foro agregado.';render();}catch(e){status.style.color=COLOR.red;status.textContent='✗ '+e.message;}};
  current.onclick=()=>{try{addClassroom(location.href,detectForumName(document),true);status.style.color=COLOR.green;status.textContent='✓ Foro actual agregado.';render();}catch(e){status.style.color=COLOR.red;status.textContent='✗ '+e.message;}};
  exportBtn.onclick=exportForumConfig;
  importBtn.onclick=()=>file.click();
  file.onchange=async()=>{if(!file.files?.[0])return;if(mode.value==='replace'&&!confirm('Se sustituirá la lista actual de foros de esta instalación por los del archivo. ¿Continuar?')){file.value='';return;}
    try{const result=await importForumConfig(file.files[0],mode.value);status.style.color=COLOR.green;status.textContent=`✓ Importación finalizada: ${result.added} nuevos, ${result.existing} ya existentes, ${result.skipped} omitidos (otras instalaciones o URLs inválidas).`;render();}
    catch(e){status.style.color=COLOR.red;status.textContent='✗ '+e.message;}finally{file.value='';}
  };
  close.onclick=()=>ov.remove();
  bar.append(add,current,exportBtn,mode,importBtn,close,file);
  box.append(title,info,list,name,url,bar,status);ov.appendChild(box);document.body.appendChild(ov);render();
}

/* ========================= Direct reply modal ========================= */

function directReplyModal(post,tutor,onSuccess=()=>{}) {
  document.getElementById('mft-direct-modal')?.remove();const ov=document.createElement('div');ov.id='mft-direct-modal';ov.style.cssText='position:fixed;inset:0;z-index:260000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif;';
  const box=document.createElement('div');box.style.cssText='width:min(900px,96vw);max-height:94vh;overflow:auto;background:white;border-radius:10px;padding:18px;color:#222;';
  const ta=document.createElement('textarea'),preview=document.createElement('div'),status=document.createElement('div');ta.value=`Hola ${firstTwoNames(post.author)}, ${localStorage.getItem(K.quickText)||''}`.trim();ta.style.cssText='width:100%;min-height:170px;padding:9px;box-sizing:border-box;';preview.style.cssText='border:1px solid #ddd;border-radius:6px;padding:10px;margin-top:8px;min-height:80px;';status.style.cssText='font-size:12px;margin-top:8px;';
  box.innerHTML=`<h2 style="margin-top:0">Responder directamente</h2><div style="font-size:13px;color:#555;margin-bottom:8px">${esc(post.classroomName)} — ${esc(post.group)} — ${esc(post.author)}</div>`;box.append(ta);const manager=createImageEditor(ta,preview);box.append(manager.root,preview,status);
  const send=button('Enviar respuesta',COLOR.green),open=linkButton('Abrir en Moodle',post.replyUrl),cancel=button('Cancelar');
  send.onclick=async()=>{if(!clean(ta.value))return alert('La respuesta está vacía.');if(!confirm(`Se enviará esta respuesta directamente a ${post.author}.\n\n¿Continuar?`))return;send.disabled=true;status.textContent='Enviando y cargando imágenes...';try{const reply=await sendDirect(post,tutor,ta.value,manager.images);post.directAnswered=true;post.tutorInBranch=false;status.style.color=COLOR.green;status.textContent='✓ Respuesta publicada y verificada.';onSuccess(reply);setTimeout(()=>{manager.destroy();ov.remove();},900);}catch(e){status.style.color=COLOR.red;status.textContent='✗ '+e.message;send.disabled=false;}};
  cancel.onclick=()=>{manager.destroy();ov.remove();};box.append(send,open,cancel);ov.appendChild(box);document.body.appendChild(ov);manager.updatePreview();
}

/* ========================= Mass modal ========================= */

async function massModal(){
  const classrooms=activeClassrooms();if(!classrooms.length){showClassroomConfig();return;}document.getElementById('mft-mass')?.remove();
  const ov=document.createElement('div');ov.id='mft-mass';ov.style.cssText='position:fixed;inset:0;z-index:255000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif;';const box=document.createElement('div');box.style.cssText='width:min(1200px,97vw);max-height:96vh;overflow:auto;background:white;border-radius:10px;padding:18px;color:#222;';const loading=document.createElement('div');loading.textContent='Detectando aulas y grupos...';box.innerHTML='<h2 style="margin-top:0">📢 Mensaje masivo</h2>';box.appendChild(loading);ov.appendChild(box);document.body.appendChild(ov);
  const {units,errors}=await allUnits(classrooms,t=>loading.textContent=t);if(!units.length){loading.textContent='No se detectaron destinos.';return;}loading.remove();
  const tutor=tutorIdentity(),ta=document.createElement('textarea'),preview=document.createElement('div'),status=document.createElement('div'),log=document.createElement('div');ta.value=localStorage.getItem(K.massDraft)||DEFAULT_MASS_MESSAGE;ta.style.cssText='width:100%;height:300px;padding:9px;box-sizing:border-box;';preview.style.cssText='border:1px solid #ddd;border-radius:6px;padding:10px;max-height:300px;overflow:auto;';status.style.cssText='padding:8px;background:#f8f9fa;border:1px solid #ddd;border-radius:6px;margin:8px 0;';log.style.cssText='max-height:220px;overflow:auto;font-family:monospace;font-size:12px;white-space:pre-wrap;';
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:12px;';const left=document.createElement('div'),right=document.createElement('div');left.append(ta);const manager=createImageEditor(ta,preview);left.appendChild(manager.root);right.appendChild(preview);grid.append(left,right);box.appendChild(grid);
  const security=document.createElement('select');security.innerHTML='<option value="per-classroom">Prueba por cada aula</option><option value="one-test">Una prueba para toda la campaña</option><option value="no-test">Sin prueba previa</option>';security.value=localStorage.getItem(K.massSecurity)||'per-classroom';
  const scope=document.createElement('select');scope.innerHTML='<option value="all">Todas las aulas activas</option>'+classrooms.map(a=>`<option value="${esc(a.uid)}">${esc(a.name)}</option>`).join('');
  const pause=document.createElement('input');pause.type='number';pause.min='1';pause.max='30';pause.value=localStorage.getItem(K.massPause)||String(MASS_PAUSE_DEFAULT);pause.style.width='70px';
  const testTarget=document.createElement('select');for(const u of units){const o=document.createElement('option');o.value=u.key;o.textContent=`${u.classroomName} — ${u.name}`;testTarget.appendChild(o);}const test=button('Enviar prueba',COLOR.green),send=button('Enviar a pendientes',COLOR.orange),scan=button('Escanear publicaciones existentes',COLOR.blue),confirmPosted=button('Confirmar publicación existente',COLOR.gray),retry=button('Liberar reintento',COLOR.gray),stop=button('Detener',COLOR.red),close=button('Cerrar');stop.style.display='none';
  const controls=document.createElement('div');controls.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0;';controls.append(document.createTextNode('Seguridad:'),security,document.createTextNode('Alcance:'),scope,document.createTextNode('Pausa s:'),pause,document.createTextNode('Prueba:'),testTarget,test,send,scan,confirmPosted,retry,stop,close);box.append(controls,status,log);
  let stopping=false;
  const selected=()=>scope.value==='all'?units:units.filter(u=>u.classroomUid===scope.value);
  function requirement(text,images,pending){if(security.value==='no-test')return{ok:true,missing:[]};if(security.value==='one-test')return{ok:anyTested(text,images),missing:anyTested(text,images)?[]:['Se requiere una prueba verificada.']};const ids=[...new Set(pending.map(u=>u.classroomUid))],missing=ids.filter(id=>!classroomTested(text,images,id)).map(id=>classrooms.find(a=>a.uid===id)?.name||id);return{ok:!missing.length,missing};}
  function refresh(){localStorage.setItem(K.massDraft,ta.value);localStorage.setItem(K.massSecurity,security.value);localStorage.setItem(K.massPause,String(Math.max(1,Math.min(30,Number(pause.value)||3))));const text=ta.value,scopeUnits=selected(),blocked=scopeUnits.filter(u=>!wasSent(text,manager.images,u)&&uncertainty(text,manager.images,u)),pending=scopeUnits.filter(u=>!wasSent(text,manager.images,u)&&!uncertainty(text,manager.images,u)),req=requirement(text,manager.images,pending);status.innerHTML=`Destinos: <strong>${scopeUnits.length}</strong> · pendientes: <strong>${pending.length}</strong> · <span style="color:"+COLOR.orange+">revisión manual: <strong>${blocked.length}</strong></span> · imágenes: <strong>${manager.images.length}</strong>${req.ok?' · <span style="color:'+COLOR.green+'">seguridad satisfecha</span>':' · <span style="color:'+COLOR.red+'">falta: '+esc(req.missing.join(', '))+'</span>'}`;send.disabled=!pending.length||!req.ok;manager.updatePreview();}
  ta.addEventListener('input',refresh);security.onchange=refresh;scope.onchange=refresh;pause.onchange=refresh;
  const addLog=t=>{const d=document.createElement('div');d.textContent=t;log.appendChild(d);log.scrollTop=log.scrollHeight;};
  test.onclick=async()=>{const u=units.find(x=>x.key===testTarget.value);if(!u)return;if(!confirm(`Se publicará el mensaje de prueba en:\n${u.classroomName} — ${u.name}\n\n¿Continuar?`))return;test.disabled=true;try{const r=await sendMassToUnit(u,tutor,ta.value,manager.images,{test:true});addLog(`✓ Prueba verificada: ${u.classroomName} — ${u.name}${r.skipped?' (sin duplicar)':''}`);}catch(e){addLog('✗ '+e.message);}test.disabled=false;refresh();};
  send.onclick=async()=>{const text=ta.value,targets=selected().filter(u=>!wasSent(text,manager.images,u)&&!uncertainty(text,manager.images,u)),req=requirement(text,manager.images,targets);if(!req.ok)return alert('No se cumple el nivel de seguridad seleccionado.');if(!confirm(`Se enviará a ${targets.length} destino(s).\nImágenes por publicación: ${manager.images.length}.\n\n¿Continuar?`))return;stopping=false;stop.style.display='inline-block';send.disabled=true;for(let i=0;i<targets.length;i++){if(stopping)break;const u=targets[i];addLog(`→ ${u.classroomName} — ${u.name}`);try{const r=await sendMassToUnit(u,tutor,text,manager.images,{test:false});addLog(r.skipped?'↷ Ya existía / registrado.':'✓ Publicado y verificado.');}catch(e){addLog('✗ '+e.message);}if(i<targets.length-1&&!stopping)await sleep(Math.max(1,Math.min(30,Number(pause.value)||3))*1000);}stop.style.display='none';refresh();};

  scan.onclick=function scanExistingForSelected(){
  return (async()=>{
    const text=ta.value,images=manager.images,html=renderMessage(text,images,'publish').trim();
    if(!html){alert('Escriba o pegue primero el mensaje cuya publicación desea buscar.');return;}
    const targets=selected().filter(u=>!wasSent(text,images,u));
    if(!targets.length){addLog('No hay destinos pendientes para revisar.');return;}
    scan.disabled=true;addLog(`Escaneo sin publicaciones: ${targets.length} destinos.`);
    let found=0,unfound=0;
    for(const unit of targets){
      try{
        const groupPage=await fetchPage(unit.url),discussions=discussionUrls(groupPage.doc);
        if(!discussions.length){unfound++;addLog(`— ${unit.classroomName} / ${unit.name}: sin discusión.`);continue;}
        const doc=(await fetchPage(discussions[0])).doc;
        if(await existingMassPost(doc,tutor,html,images)){
          markSent(text,images,unit,{url:discussions[0],detected:true,manualScan:true,test:false});
          found++;addLog(`✓ Encontrado en Moodle: ${unit.classroomName} / ${unit.name}. No se repetirá.`);
        }else{unfound++;addLog(`— Sin coincidencia segura: ${unit.classroomName} / ${unit.name}.`);}
      }catch(e){unfound++;addLog(`✗ Error al revisar ${unit.name}: ${e.message}`);}
      await sleep(REQUEST_PAUSE);
    }
    scan.disabled=false;addLog(`Escaneo finalizado: ${found} ya publicados; ${unfound} no confirmados.`);refresh();
  })();
};
  confirmPosted.onclick=()=>{
    const unit=units.find(u=>u.key===testTarget.value),record=unit?uncertainty(ta.value,manager.images,unit):null;
    if(!unit||!record){alert('Seleccione un destino marcado como pendiente de revisión.');return;}
    const url=record.url||unit.url;
    if(!confirm('Abra y revise en Moodle este destino:\n'+url+'\n\n¿CONFIRMA que el mensaje ya existe y NO debe repetirse?'))return;
    markSent(ta.value,manager.images,unit,{url,manualConfirmation:true,test:false});
    addLog('✓ Publicación confirmada manualmente: '+unit.classroomName+' / '+unit.name);refresh();
  };
  retry.onclick=()=>{
    const unit=units.find(u=>u.key===testTarget.value),record=unit?uncertainty(ta.value,manager.images,unit):null;
    if(!unit||!record){alert('Seleccione un destino marcado como pendiente de revisión.');return;}
    if(!confirm('Confirme que revisó Moodle y el mensaje NO está publicado.\n\n¿Autoriza un nuevo intento para '+unit.classroomName+' / '+unit.name+'?'))return;
    clearUncertain(ta.value,manager.images,unit);
    addLog('↷ Destino habilitado para un nuevo intento: '+unit.classroomName+' / '+unit.name);refresh();
  };

  stop.onclick=()=>{stopping=true;addLog('⛔ Detención solicitada.');};close.onclick=()=>{manager.destroy();ov.remove();};if(errors.length)addLog(`Advertencia: ${errors.length} aula(s) no pudieron leerse.`);refresh();
}

/* ========================= Conversation tree ========================= */

function conversationTree(posts) {
  const map=new Map(),parents=new Map(),roots=[];posts.forEach(p=>map.set(String(p.postId),{post:p,children:[]}));posts.forEach(p=>{const id=String(p.postId);let pa=String(p.parentPostId||'');if(pa===id||(pa&&!map.has(pa)))pa='';parents.set(id,pa);});posts.forEach(p=>{const start=String(p.postId),seen=new Set();let a=start;while(a){if(seen.has(a)){parents.set(start,'');break;}seen.add(a);a=parents.get(a)||'';}});posts.forEach(p=>{const id=String(p.postId),node=map.get(id),pa=parents.get(id);if(pa&&map.has(pa)&&pa!==id)map.get(pa).children.push(node);else roots.push(node);});return roots.length?roots:[...map.values()];
}

function answerState(post) { if(post.role!=='Estudiante')return'—';if(post.directAnswered)return'✅ Respondido directamente';if(post.tutorInBranch)return'🟡 Tutor presente en la rama';return'⚠ Sin respuesta directa'; }

/* ========================= Results UI ========================= */

function showResults(rows,groups){
  document.getElementById('mft-results')?.remove();const tutor=tutorIdentity(),ov=document.createElement('div');ov.id='mft-results';ov.style.cssText='position:fixed;inset:0;z-index:100000;background:white;overflow:auto;padding:14px;font-family:Arial,sans-serif;color:#222;';
  const bar=document.createElement('div'),summary=document.createElement('div'),controls=document.createElement('div'),listView=document.createElement('div'),convView=document.createElement('div');bar.style.cssText='position:sticky;top:0;background:white;padding:8px 0 12px;border-bottom:1px solid #ccc;z-index:20;';summary.style.cssText='font-weight:bold;line-height:1.5;margin-bottom:7px;';controls.style.cssText='display:flex;gap:7px;flex-wrap:wrap;align-items:center;';convView.style.display='none';
  const listBtn=button('Vista lista',COLOR.blue),convBtn=button('Conversaciones'),refreshBtn=button('Actualizar',COLOR.purple),massBtn=button('📢 Mensaje masivo',COLOR.orange),configBtn=button('⚙ Foros',COLOR.gray),closeBtn=button('Cerrar');
  const classroomFilter=document.createElement('select'),ageFilter=document.createElement('select'),groupFilter=document.createElement('select'),order=document.createElement('select'),search=document.createElement('input');
  const classroomData=[...new Map(groups.map(g=>[g.classroomUid,{uid:g.classroomUid,name:g.classroomName}])).values()];classroomFilter.innerHTML='<option value="">Todas las aulas</option>'+classroomData.map(a=>`<option value="${esc(a.uid)}">${esc(a.name)}</option>`).join('');ageFilter.innerHTML='<option value="all">Todas las edades</option><option value="overdue">🔴 Más de 48 h</option><option value="priority">🟠 24–48 h</option><option value="recent">🟢 Menos de 24 h</option>';groupFilter.innerHTML='<option value="participation">Grupos con participación</option><option value="pending">Grupos con pendientes</option><option value="answered">Grupos completamente atendidos</option><option value="empty">Grupos sin participación</option><option value="all">Todos los grupos</option>';order.innerHTML='<option value="oldest">Más antiguo pendiente primero</option><option value="newest">Más reciente pendiente primero</option><option value="original">Orden original</option>';search.placeholder='Buscar estudiante o contenido...';search.style.padding='6px';
  controls.append(listBtn,convBtn,refreshBtn,massBtn,configBtn,classroomFilter,ageFilter,groupFilter,order,search,closeBtn);bar.append(summary,controls);ov.append(bar,listView,convView);document.body.appendChild(ov);
  let view='list';
  function updateSummary(){const base=rows.filter(r=>!classroomFilter.value||r.classroomUid===classroomFilter.value),students=base.filter(r=>r.role==='Estudiante'),pending=students.filter(r=>!r.directAnswered),over=pending.filter(p=>sla(p)?.code==='overdue').length,prio=pending.filter(p=>sla(p)?.code==='priority').length,recent=pending.filter(p=>sla(p)?.code==='recent').length;summary.innerHTML=`${students.length} mensajes de estudiantes · ${pending.length} pendientes · <span style="color:${COLOR.red}">🔴 >48 h: ${over}</span> · <span style="color:${COLOR.orange}">🟠 24–48 h: ${prio}</span> · <span style="color:${COLOR.green}">🟢 <24 h: ${recent}</span>`;}
  function ageMatch(p){if(ageFilter.value==='all')return true;return sla(p)?.code===ageFilter.value;}
  function postActions(post,onSuccess){const box=document.createElement('div');box.style.cssText='display:flex;gap:5px;flex-wrap:wrap;align-items:flex-start;';if(post.link)box.appendChild(linkButton('Abrir',post.link));const at=attachmentsUi(post);if(at)box.appendChild(at);if(post.role==='Estudiante'&&!post.directAnswered&&post.replyUrl){const b=button('Responder directamente',COLOR.green);b.onclick=()=>directReplyModal(post,tutor,reply=>{reply.classroomUid=post.classroomUid;reply.classroomName=post.classroomName;reply.forumId=post.forumId;reply.unitKey=post.unitKey;reply.group=post.group;reply.groupId=post.groupId;rows.push(reply);const d=groups.flatMap(g=>g.discussions).find(x=>x.url===post.discussionUrl);if(d)d.posts.push(reply);onSuccess();});box.appendChild(b);}return box;}
  function renderList(){listView.innerHTML='';const table=document.createElement('table');table.style.cssText='width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;';table.innerHTML='<thead><tr><th>Aula</th><th>Grupo</th><th>Autor</th><th>Fecha</th><th>Mensaje</th><th>Estado</th><th>48 h</th><th>Acciones</th></tr></thead><tbody></tbody>';for(const th of table.querySelectorAll('th'))th.style.cssText='border:1px solid #ccc;padding:7px;background:#f5f5f5;';const tbody=table.querySelector('tbody'),q=norm(search.value);let data=rows.filter(r=>(!classroomFilter.value||r.classroomUid===classroomFilter.value)&&(!q||norm([r.classroomName,r.group,r.author,r.content].join(' ')).includes(q)));if(ageFilter.value!=='all')data=data.filter(ageMatch).sort((a,b)=>(Number(a.dateTimestamp)||Infinity)-(Number(b.dateTimestamp)||Infinity));for(const r of data){const tr=document.createElement('tr');for(let i=0;i<8;i++){const td=document.createElement('td');td.style.cssText='border:1px solid #ddd;padding:7px;vertical-align:top;white-space:pre-wrap;';tr.appendChild(td);}const c=tr.children,age=postAge(r),s=sla(r);c[0].textContent=r.classroomName;c[1].textContent=r.group;c[2].textContent=r.author||'—';c[3].textContent=formatDate(r.dateTimestamp,r.dateRaw)+(age===null?'':`\nhace ${shortDuration(age)}`);c[4].textContent=r.content;c[5].textContent=answerState(r);c[6].textContent=s?`${s.icon} ${s.text}`:(r.directAnswered?'✅ Atendido':'—');if(s)c[6].style.color=s.color;c[7].appendChild(postActions(r,()=>{updateSummary();renderList();}));tbody.appendChild(tr);}listView.appendChild(table);}
  function groupOldest(g){return oldestPending(g.discussions.flatMap(d=>d.posts));}
  function groupMatches(g){const posts=g.discussions.flatMap(d=>d.posts),students=posts.filter(p=>p.role==='Estudiante'),pending=students.filter(p=>!p.directAnswered),q=norm(search.value);if(classroomFilter.value&&g.classroomUid!==classroomFilter.value)return false;if(groupFilter.value==='participation'&&!students.length)return false;if(groupFilter.value==='pending'&&!pending.length)return false;if(groupFilter.value==='answered'&&!(students.length&&!pending.length))return false;if(groupFilter.value==='empty'&&students.length)return false;if(ageFilter.value!=='all'&&!pending.some(ageMatch))return false;if(q&&!norm([g.classroomName,g.name,...posts.map(p=>p.author+' '+p.content)].join(' ')).includes(q))return false;return true;}
  function renderNode(node,depth=0,seen=new Set()){const p=node.post,id=String(p.postId);if(seen.has(id)){const d=document.createElement('div');d.textContent='⚠ Ciclo omitido';return d;}const next=new Set(seen);next.add(id);const wrap=document.createElement('div');wrap.style.cssText=`margin-top:8px;margin-left:${depth?24:0}px;padding-left:${depth?10:0}px;border-left:${depth?'3px solid #ccc':'none'};`;const card=document.createElement('div');card.style.cssText=`border:1px solid #ccc;border-radius:6px;padding:10px;background:${p.role==='Tutor'?'#e8f4fd':(p.directAnswered?'#eaf7ee':'white')};`;const s=sla(p),age=postAge(p);card.innerHTML=`<div><strong>${esc(p.author)} · ${esc(p.role)}</strong><span style="float:right;font-size:12px">${esc(answerState(p))}</span></div><div style="font-size:11px;color:#777;margin-top:3px">${esc(formatDate(p.dateTimestamp,p.dateRaw))}${age===null?'':` · hace ${esc(shortDuration(age))}`}</div>${s?`<div style="font-size:12px;font-weight:bold;color:${s.color};margin-top:5px">${s.icon} ${esc(s.text)}</div>`:''}<div style="margin-top:8px;white-space:pre-wrap;line-height:1.4">${esc(p.content)}</div>`;const acts=postActions(p,()=>{updateSummary();renderConversations();});card.appendChild(acts);wrap.appendChild(card);for(const ch of node.children)wrap.appendChild(renderNode(ch,depth+1,next));return wrap;}
  function renderConversations(){convView.innerHTML='';let gs=groups.filter(groupMatches);if(order.value!=='original')gs=[...gs].sort((a,b)=>{const aa=groupOldest(a),bb=groupOldest(b),ta=Number(aa?.dateTimestamp),tb=Number(bb?.dateTimestamp);if(!Number.isFinite(ta))return 1;if(!Number.isFinite(tb))return -1;return order.value==='oldest'?ta-tb:tb-ta;});const byClass=new Map();for(const g of gs){if(!byClass.has(g.classroomUid))byClass.set(g.classroomUid,{name:g.classroomName,groups:[]});byClass.get(g.classroomUid).groups.push(g);}for(const [uid,a] of byClass){const ad=document.createElement('details');ad.open=true;const as=document.createElement('summary');as.style.fontWeight='bold';const ap=a.groups.flatMap(g=>g.discussions).flatMap(d=>d.posts),ao=oldestPending(ap),ss=ao?sla(ao):null;as.textContent=`${a.name} — ${a.groups.length} grupo(s)${ao?` — ${ss?.icon||''} más antiguo ${shortDuration(postAge(ao)||0)}`:''}`;ad.appendChild(as);for(const g of a.groups){const gd=document.createElement('details');gd.open=groupFilter.value==='pending';const gsumm=document.createElement('summary'),posts=g.discussions.flatMap(d=>d.posts),students=posts.filter(p=>p.role==='Estudiante'),pending=students.filter(p=>!p.directAnswered),old=oldestPending(posts),state=old?sla(old):null;gsumm.style.cssText=`font-weight:bold;color:${state?.color||(students.length?COLOR.green:'#555')};`;gsumm.textContent=`${g.name} — ${students.length} mensajes — ${pending.length} pendientes${old?` — ${state?.icon||''} más antiguo ${shortDuration(postAge(old)||0)}`:''}`;gd.appendChild(gsumm);for(const d of g.discussions){const dd=document.createElement('details');dd.open=true;const ds=document.createElement('summary');ds.textContent=d.title||'Discusión';ds.style.fontWeight='bold';dd.appendChild(ds);for(const root of conversationTree(d.posts))dd.appendChild(renderNode(root));gd.appendChild(dd);}ad.appendChild(gd);}convView.appendChild(ad);}if(!gs.length){const n=document.createElement('p');n.textContent='No hay grupos que cumplan los filtros.';convView.appendChild(n);}}
  function apply(){const list=view==='list';listView.style.display=list?'block':'none';convView.style.display=list?'none':'block';groupFilter.style.display=list?'none':'inline-block';order.style.display=list?'none':'inline-block';updateSummary();list?renderList():renderConversations();}
  listBtn.onclick=()=>{view='list';apply();};convBtn.onclick=()=>{view='conv';apply();};refreshBtn.onclick=async()=>{ov.remove();await consolidate();};massBtn.onclick=massModal;configBtn.onclick=showClassroomConfig;closeBtn.onclick=()=>ov.remove();for(const e of [classroomFilter,ageFilter,groupFilter,order,search])e.addEventListener(e===search?'input':'change',apply);apply();
}

/* ========================= Consolidation ========================= */

async function consolidate(){
  const btn=document.getElementById('mft-consolidate'),status=document.getElementById('mft-status');if(!btn||btn.disabled)return;const classrooms=activeClassrooms();if(!classrooms.length){showClassroomConfig();return;}btn.disabled=true;const old=btn.textContent;btn.textContent='Procesando...';
  try{const {units,errors}=await allUnits(classrooms,t=>status.textContent=t);if(!units.length)throw new Error('No se detectaron grupos/foros utilizables.');const tutor=tutorIdentity(),rows=[],groups=[];
    for(let i=0;i<units.length;i++){const u=units[i];status.textContent=`${i+1}/${units.length}: ${u.classroomName} — ${u.name}`;const page=await fetchPage(u.url),durls=discussionUrls(page.doc),group={...u,discussions:[]};const start=rows.length;for(let j=0;j<durls.length;j++){const durl=durls[j],dpage=await fetchPage(durl),posts=parseDiscussion(dpage.doc,u,durl,tutor);rows.push(...posts);group.discussions.push({url:durl,title:posts[0]?.subject||`Discusión ${j+1}`,posts});await sleep(REQUEST_PAUSE);}if(!rows.slice(start).some(p=>p.role==='Estudiante'))rows.push({classroomUid:u.classroomUid,classroomName:u.classroomName,forumId:u.forumId,unitKey:u.key,group:u.name,groupId:u.id,role:'',status:'Sin respuestas de estudiantes',author:'',authorId:'',dateRaw:'',dateTimestamp:null,subject:'',content:'No hay respuestas registradas por estudiantes en este destino.',attachments:[],profile:'',link:u.url,replyUrl:'',discussionUrl:'',postId:'',parentPostId:'',parentSource:'',directAnswered:false,tutorInBranch:false});groups.push(group);}
    const students=rows.filter(p=>p.role==='Estudiante'),pending=students.filter(p=>!p.directAnswered),over=pending.filter(p=>sla(p)?.code==='overdue').length;status.textContent=`Finalizado: ${units.length} destino(s), ${students.length} mensajes, ${pending.length} pendientes, ${over} con más de 48 h.${errors.length?` ${errors.length} aula(s) con error.`:''}`;showResults(rows,groups);
  }catch(e){console.error(e);status.textContent='Error: '+e.message;alert(e.message);}finally{btn.disabled=false;btn.textContent=old;}
}

/* ========================= Legacy native editor helper ========================= */

async function insertPendingNativeReply(){
  const raw=localStorage.getItem(K.pendingReply);if(!raw)return;let data;try{data=JSON.parse(raw);}catch{localStorage.removeItem(K.pendingReply);return;}if(Date.now()-Number(data.created||0)>600000){localStorage.removeItem(K.pendingReply);return;}
  const text=data.text||'';for(let i=0;i<25;i++){try{const editor=window.tinymce?.editors?.find(e=>/message/i.test(e.id||''))||window.tinymce?.activeEditor;if(editor){editor.setContent(esc(text).replace(/\n/g,'<br>'));editor.save();localStorage.removeItem(K.pendingReply);return;}const atto=document.querySelector('.editor_atto_content[contenteditable="true"], [contenteditable="true"][id*="message"]');if(atto){atto.innerHTML=esc(text).replace(/\n/g,'<br>');localStorage.removeItem(K.pendingReply);return;}const ta=document.querySelector('textarea[name="message[text]"],textarea[name="message"]');if(ta){ta.value=text;localStorage.removeItem(K.pendingReply);return;}}catch{}await sleep(300);}
}

if(/\/mod\/forum\/post\.php$/i.test(location.pathname)){insertPendingNativeReply();return;}

/* ========================= Main panel ========================= */

function createPanel(){
  if(document.getElementById('mft-panel'))return;const p=document.createElement('div');p.id='mft-panel';p.style.cssText='position:fixed;right:20px;bottom:20px;z-index:99999;background:white;border:1px solid #aaa;border-radius:8px;padding:12px;width:390px;box-shadow:0 2px 10px rgba(0,0,0,.25);font-family:Arial,sans-serif;color:#222;';
  const title=document.createElement('strong');title.textContent=`Moodle Forum Toolkit v${VERSION}`;const meta=document.createElement('div');meta.id='mft-panel-meta';meta.style.cssText='font-size:12px;color:#555;margin-top:5px;';const status=document.createElement('div');status.id='mft-status';status.textContent='Listo para iniciar.';status.style.cssText='font-size:12px;margin:8px 0;line-height:1.4;';const consolidateBtn=button('Consolidar foros activos',COLOR.blue);consolidateBtn.id='mft-consolidate';consolidateBtn.style.width='100%';consolidateBtn.onclick=consolidate;const config=button('⚙ Configurar foros',COLOR.gray),mass=button('📢 Redactar / enviar mensaje',COLOR.orange);for(const b of [config,mass])b.style.cssText+='width:100%;margin-top:7px;padding:8px;';config.onclick=showClassroomConfig;mass.onclick=massModal;
  const about=document.createElement('details');about.style.cssText='margin-top:8px;font-size:11px;color:#555;';about.innerHTML=`<summary style="cursor:pointer">Acerca de</summary><div style="margin-top:5px;line-height:1.4">Desarrollado por <strong>${AUTHOR}</strong><br>Código abierto · Licencia MIT<br>Herramienta independiente y no oficial.<br>Donaciones voluntarias: Llave <strong>${DONATION_KEY}</strong></div>`;
  p.append(title,meta,status,consolidateBtn,config,mass,about);document.body.appendChild(p);updatePanelMeta();
}

ensureCurrentClassroom();createPanel();

})();