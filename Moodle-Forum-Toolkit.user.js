// ==UserScript==
// @name         Moodle Forum Toolkit - Gestor y Consolidador de Foros
// @namespace    moodle-forum-toolkit
// @version      1.16.5
// @description  Herramientas docentes para foros, correo interno y apoyo a la calificación en Moodle, siempre bajo acción explícita del tutor.
// @author       Juan Pablo Moreno Ortiz
// @license      MIT
// @homepageURL  https://github.com/JuanBiomedico/Moodle-Forum-Toolkit
// @supportURL   https://github.com/JuanBiomedico/Moodle-Forum-Toolkit/issues
// @downloadURL  https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/refs/heads/feature/portal-dashboard-v1.11.0/Moodle-Forum-Toolkit.user.js
// @updateURL    https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/refs/heads/feature/portal-dashboard-v1.11.0/Moodle-Forum-Toolkit.user.js
// @match        *://*/mod/forum/view.php*
// @match        *://*/mod/forum/post.php*
// @match        *://*/*/mod/forum/view.php*
// @match        *://*/*/mod/forum/post.php*
// @match        *://*/course/view.php*
// @match        *://*/*/course/view.php*
// @match        *://*/mod/assign/view.php*
// @match        *://*/*/mod/assign/view.php*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
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

const VERSION = '1.16.5';
const PAGE = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
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
  migrated: 'mft_shared_registry_migrated_v1',
  useQuick: 'mft_use_quick_reply_text',
  pendingReply: 'mft_pending_reply',
  classrooms: 'mft_configured_forums',
  massDraft: 'mft_mass_draft',
  massSecurity: 'mft_mass_security',
  massPause: 'mft_mass_pause_seconds',
  forumEnabled: 'mft_forum_campaign_enabled',
  mailSubject: 'mft_internal_mail_subject',
  mailEnabled: 'mft_internal_mail_enabled',
  mailCampaignPrefix: 'mft_mail_campaign_',
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

/* ========================= Moodle internal mail ========================= */

const INTERNAL_MAIL = {
  supported:null,
  unread:null,
  latest:[],
  lastCheck:0,
  error:'',
  checking:false
};

function moodleRoot(){
  const cfg=clean(PAGE.M?.cfg?.wwwroot||window.M?.cfg?.wwwroot||'');
  if(cfg){
    try{
      const u=new URL(cfg,location.href);
      if(u.origin===location.origin)return u.href.replace(/\/$/,'');
    }catch{}
  }
  const marker=location.pathname.search(/\/(?:course|mod|local)\//i);
  const base=marker>=0?location.pathname.slice(0,marker):'';
  return location.origin+base.replace(/\/$/,'');
}

function moodleSesskey(doc=document){
  return clean(PAGE.M?.cfg?.sesskey||window.M?.cfg?.sesskey||doc?.querySelector?.('input[name="sesskey"]')?.value||'');
}

function mailEndpoint(file='view.php',params={}){
  const url=new URL(moodleRoot()+'/local/mail/'+file);
  for(const [key,value] of Object.entries(params)){
    if(value!==undefined&&value!==null&&String(value)!=='')url.searchParams.set(key,String(value));
  }
  return url.href;
}

function courseIdFromDocument(doc){
  for(const a of doc?.querySelectorAll?.('a[href*="/course/view.php?id="]')||[]){
    try{
      const id=new URL(a.getAttribute('href'),location.href).searchParams.get('id');
      if(/^\d+$/.test(id||'')&&id!=='1')return id;
    }catch{}
  }
  const html=doc?.documentElement?.innerHTML||'';
  const m=html.match(/(?:courseId|courseid)["'\s:=]+(\d{2,})/i);
  return m?.[1]||'';
}

function internalMailInboxUrl(){return mailEndpoint('view.php',{t:'inbox'});}

function parseInternalMailInbox(doc){
  const unreadNodes=[...doc.querySelectorAll('.mail_item.mail_unread')];
  let exact=null;
  for(const a of doc.querySelectorAll('a[href*="/local/mail/view.php"]')){
    try{
      const u=new URL(a.getAttribute('href'),location.href);
      if(u.searchParams.get('t')!=='inbox'||u.searchParams.has('c'))continue;
      const match=clean(a.textContent).match(/\((\d+)\)\s*$/);
      if(match){exact=Number(match[1]);break;}
    }catch{}
  }
  const latest=unreadNodes.slice(0,5).map(node=>{
    const link=node.querySelector('a.mail_link,a[href*="/local/mail/view.php"]');
    return {
      subject:clean(node.querySelector('.mail_summary')?.textContent||link?.textContent||'Mensaje sin asunto'),
      from:clean(node.querySelector('.mail_users')?.textContent||''),
      date:clean(node.querySelector('.mail_date')?.textContent||''),
      url:absoluteUrl(link?.getAttribute('href')||'',location.href)
    };
  });
  return {unread:Number.isFinite(exact)?exact:unreadNodes.length,latest};
}

function renderInternalMailStatus(){
  const title=document.getElementById('mft-panel-title');
  const count=Number.isFinite(INTERNAL_MAIL.unread)?INTERNAL_MAIL.unread:null;
  if(title)title.textContent=`Moodle Forum Toolkit v${VERSION}${count>0?` · ✉ ${count}`:''}`;
  const status=document.getElementById('mft-mail-status'),list=document.getElementById('mft-mail-latest');
  if(!status)return;
  if(INTERNAL_MAIL.checking){status.textContent='Correo interno: comprobando...';status.style.color='#555';}
  else if(INTERNAL_MAIL.supported===false){status.textContent='Correo interno: no disponible o sesión no válida.';status.style.color=COLOR.red;}
  else if(count===null){status.textContent='Correo interno: sin comprobar.';status.style.color='#555';}
  else if(count>0){status.textContent=`Correo interno: ${count} no leído${count===1?'':'s'}.`;status.style.color=COLOR.red;}
  else{status.textContent='Correo interno: sin mensajes no leídos.';status.style.color=COLOR.green;}
  if(list){
    list.innerHTML='';
    for(const item of INTERNAL_MAIL.latest){
      const row=document.createElement('div'),a=document.createElement('a'),meta=document.createElement('small');
      a.href=item.url||internalMailInboxUrl();a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.subject||'Abrir mensaje';a.style.cssText='font-weight:600;text-decoration:none;';
      meta.textContent=[item.from,item.date].filter(Boolean).join(' · ');meta.style.cssText='display:block;color:#666;margin-top:2px;';
      row.style.cssText='padding:5px 0;border-top:1px solid #eee;';row.append(a,meta);list.appendChild(row);
    }
    list.style.display=INTERNAL_MAIL.latest.length?'block':'none';
  }
}

async function checkInternalMail({silent=false}={}){
  if(INTERNAL_MAIL.checking)return INTERNAL_MAIL;
  INTERNAL_MAIL.checking=true;renderInternalMailStatus();
  try{
    const page=await fetchPage(internalMailInboxUrl());
    const path=new URL(page.finalUrl).pathname;
    const valid=/\/local\/mail\/view\.php$/i.test(path)&&!!page.doc.querySelector('#local_mail_main_form,.mail_list,.mail_item,[class*="mail_"]');
    if(!valid)throw new Error('Moodle no devolvió la bandeja del correo interno.');
    const parsed=parseInternalMailInbox(page.doc);
    INTERNAL_MAIL.supported=true;INTERNAL_MAIL.unread=parsed.unread;INTERNAL_MAIL.latest=parsed.latest;INTERNAL_MAIL.error='';INTERNAL_MAIL.lastCheck=Date.now();
  }catch(error){
    INTERNAL_MAIL.supported=false;INTERNAL_MAIL.error=error.message;INTERNAL_MAIL.latest=[];
  }finally{
    INTERNAL_MAIL.checking=false;renderInternalMailStatus();
  }
  return INTERNAL_MAIL;
}


function mailMessageSignature(sender,content){
  const body=norm(content).replace(/https?:\/\/\S+/g,' ').replace(/[^a-z0-9áéíóúüñ ]+/gi,' ').replace(/\s+/g,' ').trim();
  return `${normName(sender)}|${body.slice(0,320)}`;
}

function parseMailboxList(doc,courseId,courseName){
  const items=[];
  for(const node of doc.querySelectorAll('.mail_list .mail_item,.mail_item')){
    const link=node.querySelector('a.mail_link,a[href*="/local/mail/view.php"]');
    if(!link)continue;
    const url=absoluteUrl(link.getAttribute('href'),location.href);
    let id='';
    try{id=new URL(url).searchParams.get('m')||'';}catch{}
    if(!/^\d+$/.test(id))continue;
    items.push({
      id,courseId:String(courseId),courseName,
      subject:clean(node.querySelector('.mail_summary')?.textContent||'Sin asunto'),
      parties:clean(node.querySelector('.mail_users')?.textContent||''),
      date:clean(node.querySelector('.mail_date')?.textContent||''),
      unread:node.classList.contains('mail_unread'),
      url
    });
  }
  return [...new Map(items.map(x=>[x.id,x])).values()];
}

function parseMailDetail(doc,base,tutor){
  const sender=clean(doc.querySelector('.mail_view .user_from,.user_from')?.textContent||'');
  const contentNode=doc.querySelector('.mail_view .mail_content,.mail_content:not(.mail_references .mail_content)');
  const content=clean(contentNode?.textContent||'');
  const subject=clean(doc.querySelector('.mail_subject h3,.mail_subject')?.textContent||base.subject||'Sin asunto');
  const headers=[...doc.querySelectorAll('.mail_references .mail_header')];
  const contents=[...doc.querySelectorAll('.mail_references .mail_content')];
  const references=contents.map((node,i)=>({
    sender:clean(headers[i]?.querySelector('.user_from')?.textContent||''),
    content:clean(node.textContent||'')
  })).filter(x=>x.content||x.sender);
  const attachments=[...doc.querySelectorAll('.mail_attachments a[href]')].map(a=>({
    name:clean(a.textContent)||'Adjunto',url:absoluteUrl(a.getAttribute('href'),base.url)
  })).filter((x,i,a)=>x.url&&a.findIndex(y=>y.url===x.url)===i);
  const isTutor=!!sender&&normName(sender)===normName(tutor.name);
  return {...base,sender,content,subject,references,attachments,direction:isTutor?'sent':'received'};
}

async function fetchCourseMailReview(course,tutor,onStatus=()=>{}){
  const page=await fetchPage(mailEndpoint('view.php',{t:'course',c:course.courseId}));
  const list=parseMailboxList(page.doc,course.courseId,course.name);
  const details=[];
  for(let i=0;i<list.length;i++){
    onStatus(`Correo ${course.name}: ${i+1}/${list.length}...`);
    try{
      const detail=await fetchPage(list[i].url);
      details.push(parseMailDetail(detail.doc,list[i],tutor));
    }catch(error){
      details.push({...list[i],sender:list[i].parties,content:'',references:[],attachments:[],direction:'received',error:error.message});
    }
    await sleep(80);
  }
  const sent=details.filter(x=>x.direction==='sent');
  const answeredRefs=new Set();
  for(const item of sent){
    for(const ref of item.references){
      const signature=mailMessageSignature(ref.sender,ref.content);
      if(signature!=='|')answeredRefs.add(signature);
    }
  }
  const received=details.filter(x=>x.direction==='received').map(item=>{
    const sig=mailMessageSignature(item.sender,item.content);
    return {...item,answered:answeredRefs.has(sig)};
  });
  return {courseId:String(course.courseId),name:course.name,received,sent,total:list.length};
}

async function fetchInternalMailReview(groups,onStatus=()=>{}){
  const map=new Map();
  for(const group of groups||[]){
    const courseId=String(group.courseId||'');
    if(!/^\d+$/.test(courseId))continue;
    if(!map.has(courseId))map.set(courseId,{courseId,name:group.classroomName||`Curso ${courseId}`});
  }
  if(!map.size){
    const id=currentCourseId();
    if(/^\d+$/.test(id||''))map.set(id,{courseId:id,name:detectForumName(document)||`Curso ${id}`});
  }
  const tutor=tutorIdentity(),result=[];
  for(const course of map.values()){
    try{result.push(await fetchCourseMailReview(course,tutor,onStatus));}
    catch(error){result.push({...course,received:[],sent:[],total:0,error:error.message});}
  }
  return result;
}

function renderMailReview(container,data){
  container.innerHTML='';
  if(!data?.length){
    const p=document.createElement('p');p.textContent='No se identificaron cursos para consultar el correo interno.';container.appendChild(p);return;
  }
  for(const course of data){
    const section=document.createElement('details');section.open=true;
    const summary=document.createElement('summary');
    const pending=course.received.filter(x=>!x.answered).length,answered=course.received.filter(x=>x.answered).length;
    summary.style.cssText='font-weight:bold;font-size:14px;padding:8px 0;';
    summary.textContent=`${course.name} — ${pending} pendiente(s) · ${answered} contestado(s)`;
    section.appendChild(summary);
    if(course.error){
      const err=document.createElement('div');err.textContent='Error: '+course.error;err.style.color=COLOR.red;section.appendChild(err);container.appendChild(section);continue;
    }
    const rows=[...course.received].sort((a,b)=>Number(a.answered)-Number(b.answered));
    if(!rows.length){
      const empty=document.createElement('p');empty.textContent='No se encontraron mensajes recibidos en la página de correo consultada.';section.appendChild(empty);
    }else{
      const table=document.createElement('table');table.style.cssText='width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;';
      table.innerHTML='<thead><tr><th>Estado</th><th>De</th><th>Asunto</th><th>Fecha</th><th>Lectura</th><th>Acciones</th></tr></thead><tbody></tbody>';
      for(const th of table.querySelectorAll('th'))th.style.cssText='border:1px solid #ccc;padding:7px;background:#f5f5f5;text-align:left;';
      const tbody=table.querySelector('tbody');
      for(const mail of rows){
        const tr=document.createElement('tr');
        const values=[mail.answered?'✅ Contestado':'⚠ Pendiente',mail.sender||mail.parties||'—',mail.subject||'Sin asunto',mail.date||'—',mail.unread?'No leído':'Leído'];
        for(let i=0;i<6;i++){const td=document.createElement('td');td.style.cssText='border:1px solid #ddd;padding:7px;vertical-align:top;';if(i<5)td.textContent=values[i];tr.appendChild(td);}
        const actions=tr.children[5],open=linkButton('Abrir correo',mail.url,mail.answered?COLOR.gray:COLOR.blue);
        actions.appendChild(open);
        if(mail.attachments?.length){const details=document.createElement('details'),sum=document.createElement('summary');sum.textContent=`📎 ${mail.attachments.length}`;details.appendChild(sum);for(const att of mail.attachments){const a=document.createElement('a');a.href=att.url;a.target='_blank';a.rel='noopener';a.textContent=att.name;a.style.display='block';details.appendChild(a);}actions.appendChild(details);}
        tbody.appendChild(tr);
      }
      section.appendChild(table);
    }
    container.appendChild(section);
  }
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

function validTimestamp(value) { return value!==null && value!==undefined && value!=='' && Number.isFinite(Number(value)) && Number(value)>0; }

function formatDate(ts, fallback='') {
  if (!validTimestamp(ts)) return clean(fallback)||'Fecha no disponible';
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
  return validTimestamp(post?.dateTimestamp) ? Math.max(0,Date.now()-Number(post.dateTimestamp)) : null;
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
  const dated=pending.filter(p=>validTimestamp(p.dateTimestamp)).sort((a,b)=>Number(a.dateTimestamp)-Number(b.dateTimestamp));
  return dated[0]||pending[0]||null;
}


/* ========================= Shared cross-origin forum registry =========================
 * GM storage is shared across pages matched by this userscript in one browser.
 * For cross-computer portability use the existing JSON export/import.
 */
const SHARED_REGISTRY_KEY = 'mft_shared_forum_registry_v1';

function normalizePortableForumUrl(input) {
  let u;
  try {u=new URL(String(input||'').trim());}catch{throw new Error('Introduzca la URL completa del foro Moodle.');}
  if(u.username||u.password)throw new Error('No incluya usuario ni contraseña en la URL.');
  if(u.protocol!=='https:' && !(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('Use una URL HTTPS.');
  if(!/\/mod\/forum\/view\.php$/i.test(u.pathname))throw new Error('La URL debe ser la página del foro: mod/forum/view.php.');
  const id=u.searchParams.get('id');
  if(!/^\d+$/.test(id||''))throw new Error('La URL del foro debe incluir id= seguido de números.');
  const cleanUrl=new URL(u.origin+u.pathname);
  cleanUrl.searchParams.set('id',id);
  return cleanUrl.href;
}
function normalizeForumUrl(input) {
  const cleanUrl=normalizePortableForumUrl(input);
  if(new URL(cleanUrl).origin!==location.origin)throw new Error('Este panel solo procesa foros de la instalación Moodle actual. Para gestionar otro dominio, utilice el panel de Mis cursos.');
  return cleanUrl;
}
function classroomUid(url){return 'forum_'+hash(url);}
function readSharedRegistry() {
  try{
    const stored=GM_getValue(SHARED_REGISTRY_KEY,{});
    return stored && typeof stored==='object' && !Array.isArray(stored)?stored:{};
  }catch(error){console.warn('MFT: no fue posible leer el registro compartido.',error);return {};}
}
function normalizeRegistryEntry(value,origin) {
  try{
    const url=normalizePortableForumUrl(value?.url||'');
    if(new URL(url).origin!==origin)return null;
    return {uid:classroomUid(url),name:clean(value?.name)||'Foro '+forumId(url),url,forumId:forumId(url),active:value?.active!==false};
  }catch{return null;}
}
function readOriginRegistry(origin) {
  const store=readSharedRegistry();
  return Array.isArray(store[origin])?store[origin].map(v=>normalizeRegistryEntry(v,origin)).filter(Boolean):[];
}
function saveOriginRegistry(origin,items) {
  const seen=new Set(),cleanItems=[];
  for(const item of items||[]){
    const normalized=normalizeRegistryEntry(item,origin);
    if(!normalized||seen.has(normalized.url))continue;
    seen.add(normalized.url);cleanItems.push(normalized);
  }
  const store=readSharedRegistry();
  store[origin]=cleanItems;
  GM_setValue(SHARED_REGISTRY_KEY,store);
  if(origin===location.origin){
    localStorage.setItem(K.classrooms,JSON.stringify(cleanItems));
    localStorage.setItem(K.migrated,'1');
  }
  updatePanelMeta();
}
function migrateLegacyForumsOnce() {
  const store=readSharedRegistry();
  if(localStorage.getItem(K.migrated)==='1'&&Object.prototype.hasOwnProperty.call(store,location.origin))return;
  let local=[];
  try{const read=JSON.parse(localStorage.getItem(K.classrooms)||'[]');if(Array.isArray(read))local=read;}catch{}
  const shared=readOriginRegistry(location.origin),seen=new Set(shared.map(x=>x.url)),merged=[...shared];
  for(const entry of local){
    const item=normalizeRegistryEntry(entry,location.origin);
    if(item&&!seen.has(item.url)){seen.add(item.url);merged.push(item);}
  }
  saveOriginRegistry(location.origin,merged);
  localStorage.setItem(K.migrated,'1');
}
function configuredClassrooms() {
  migrateLegacyForumsOnce();
  return readOriginRegistry(location.origin);
}
function saveClassrooms(list) {saveOriginRegistry(location.origin,list);}
function addClassroom(url,name='',active=true) {
  const normalized=normalizeForumUrl(url),list=configuredClassrooms();
  let existing=list.find(x=>x.url===normalized);
  if(existing){if(name)existing.name=clean(name);existing.active=active;saveClassrooms(list);return existing;}
  existing={uid:classroomUid(normalized),name:clean(name)||'Foro '+forumId(normalized),url:normalized,forumId:forumId(normalized),active};
  list.push(existing);saveClassrooms(list);return existing;
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
  const page=await fetchPage(classroom.url), selector=groupSelector(page.doc), units=[], courseId=courseIdFromDocument(page.doc);
  if (selector) {
    for (const opt of [...selector.options]) {
      const id=String(opt.value||''), name=clean(opt.textContent);
      if (!/^\d+$/.test(id)||id==='0'||/todos|all participants/i.test(name)) continue;
      const u=new URL(classroom.url); u.searchParams.set('group',id);
      units.push({key:`${classroom.uid}::${id}`,classroomUid:classroom.uid,classroomName:classroom.name,forumId:classroom.forumId,courseId,id,name:name||`Grupo ${id}`,single:false,url:u.href});
    }
  }
  if (!units.length) units.push({key:`${classroom.uid}::single`,classroomUid:classroom.uid,classroomName:classroom.name,forumId:classroom.forumId,courseId,id:`single-${classroom.forumId}`,name:'Grupo único',single:true,url:classroom.url});
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
  let id=String(PAGE.M?.cfg?.userid||window.M?.cfg?.userid||''),profile='';
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

function createImageEditor(textarea,preview,initialImages=[],initialAttachments=[]) {
  const images=[...initialImages],attachments=[...initialAttachments],root=document.createElement('div'),
    imageInput=document.createElement('input'),fileInput=document.createElement('input'),
    addImage=button('🖼 Añadir imagen',COLOR.purple),addFile=button('📎 Adjuntar archivo',COLOR.blue),
    imageList=document.createElement('div'),fileList=document.createElement('div'),actions=document.createElement('div');
  imageInput.type='file';imageInput.accept='image/png,image/jpeg,image/gif,image/webp';imageInput.multiple=true;imageInput.style.display='none';
  fileInput.type='file';fileInput.multiple=true;fileInput.style.display='none';
  root.style.cssText='margin-top:8px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fafafa;';
  actions.style.cssText='display:flex;gap:7px;flex-wrap:wrap;';
  imageList.style.cssText='margin-top:7px;display:flex;gap:7px;flex-wrap:wrap;';
  fileList.style.cssText='margin-top:7px;display:flex;gap:7px;flex-wrap:wrap;';
  addImage.onclick=()=>imageInput.click();addFile.onclick=()=>fileInput.click();
  const updatePreview=()=>{preview.innerHTML=renderMessage(textarea.value,images,'preview')||'<em>El mensaje está vacío.</em>';};
  function renderLists(){
    imageList.innerHTML='';fileList.innerHTML='';
    for(const im of images){
      const chip=document.createElement('div'),rm=button('×',COLOR.red);
      chip.style.cssText='display:flex;align-items:center;gap:5px;background:white;border:1px solid #ccc;border-radius:5px;padding:4px 6px;font-size:12px;';
      chip.append(document.createTextNode(`🖼 ${im.file.name}`),rm);
      rm.onclick=()=>{const idx=images.indexOf(im);if(idx>=0)images.splice(idx,1);textarea.value=textarea.value.replaceAll(imageToken(im.id),'');URL.revokeObjectURL(im.objectUrl);renderLists();updatePreview();};
      imageList.appendChild(chip);
    }
    for(const item of attachments){
      const chip=document.createElement('div'),rm=button('×',COLOR.red);
      chip.style.cssText='display:flex;align-items:center;gap:5px;background:white;border:1px solid #ccc;border-radius:5px;padding:4px 6px;font-size:12px;';
      chip.append(document.createTextNode(`📎 ${item.file.name}`),rm);
      rm.onclick=()=>{const idx=attachments.indexOf(item);if(idx>=0)attachments.splice(idx,1);renderLists();};
      fileList.appendChild(chip);
    }
  }
  imageInput.onchange=()=>{
    for(const file of [...(imageInput.files||[])]){
      if(!ALLOWED_IMAGE_TYPES.has(file.type)){alert(`Formato no admitido: ${file.name}`);continue;}
      if(file.size>MAX_IMAGE_BYTES){alert(`${file.name} supera el límite local de 8 MB.`);continue;}
      const id=`${hash(file.name+'|'+file.size+'|'+file.lastModified)}_${images.length}`,im={id,file,alt:file.name,objectUrl:URL.createObjectURL(file)};
      images.push(im);const token=`\n${imageToken(id)}\n`,start=textarea.selectionStart??textarea.value.length,end=textarea.selectionEnd??start;
      textarea.value=textarea.value.slice(0,start)+token+textarea.value.slice(end);textarea.selectionStart=textarea.selectionEnd=start+token.length;
    }
    imageInput.value='';renderLists();updatePreview();textarea.dispatchEvent(new Event('input',{bubbles:true}));
  };
  fileInput.onchange=()=>{
    for(const file of [...(fileInput.files||[])]){
      if(attachments.some(x=>x.file.name===file.name&&x.file.size===file.size&&x.file.lastModified===file.lastModified))continue;
      attachments.push({file});
    }
    fileInput.value='';renderLists();textarea.dispatchEvent(new Event('input',{bubbles:true}));
  };
  textarea.addEventListener('input',updatePreview);attachRichPaste(textarea);
  actions.append(addImage,addFile,imageInput,fileInput);root.append(actions,imageList,fileList);renderLists();updatePreview();
  return {root,images,attachments,updatePreview,destroy:()=>images.forEach(im=>URL.revokeObjectURL(im.objectUrl))};
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
    const tinymce=win.tinymce||win.wrappedJSObject?.tinymce;
    if(tinymce?.editors?.length){const field=messageField(form);const editor=tinymce.editors.find(e=>e.targetElm===field||e.targetElm?.name===field?.name||e.id===field?.id)||tinymce.activeEditor;if(editor?.initialized!==false&&editor?.getBody())return editor;}
    await sleep(250);
  }
  return null;
}

function waitForElement(find,timeout=12000,interval=150){
  return new Promise((resolve,reject)=>{
    const start=Date.now();
    const tick=()=>{let value=null;try{value=find();}catch{}if(value)return resolve(value);if(Date.now()-start>=timeout)return reject(new Error('Moodle tardó demasiado en preparar el gestor de archivos.'));setTimeout(tick,interval);};
    tick();
  });
}

function visibleElement(elements){
  return [...elements].find(el=>{const r=el.getBoundingClientRect?.();return !r||(r.width>0&&r.height>0);})||[...elements][0]||null;
}

async function uploadOneNativeAttachment(win,doc,form,file,fieldName='attachments'){
  const hidden=form.querySelector(`[name="${fieldName}"]`);
  if(!hidden)throw new Error(`Moodle no mostró el área de ${fieldName==='attachments'?'archivos adjuntos':'archivos'}.`);
  const wrapper=hidden.closest('.form-group,.fitem,.mb-3,[data-fieldtype="filemanager"]')||hidden.parentElement;
  let manager=wrapper?.querySelector?.('[id^="filemanager-"]')||null;
  if(!manager){
    const managers=[...form.querySelectorAll('[id^="filemanager-"]')];
    manager=managers.find(x=>/adjunt|attachment/i.test(clean(x.closest('.form-group,.fitem,.mb-3')?.textContent||'')))||managers[0]||null;
  }
  if(!manager)throw new Error('No se encontró el gestor nativo de archivos adjuntos.');
  const add=manager.querySelector('.fp-btn-add a,.fp-btn-add button,.fp-btn-add');
  if(!add)throw new Error('El gestor de archivos no expone el botón Añadir.');
  add.click();
  const picker=await waitForElement(()=>visibleElement(doc.querySelectorAll('.file-picker,.moodle-dialogue')));
  let uploadRepo=[...picker.querySelectorAll('.fp-repo')].find(node=>/subir un archivo|upload a file/i.test(clean(node.querySelector('.fp-repo-name')?.textContent||node.textContent||'')));
  if(!uploadRepo){
    uploadRepo=[...doc.querySelectorAll('.fp-repo')].find(node=>/subir un archivo|upload a file/i.test(clean(node.querySelector('.fp-repo-name')?.textContent||node.textContent||'')));
  }
  if(!uploadRepo)throw new Error('No se encontró el repositorio “Subir un archivo” de Moodle.');
  uploadRepo.click();
  const fileInput=await waitForElement(()=>visibleElement(doc.querySelectorAll('.file-picker .fp-file input[type="file"],.moodle-dialogue .fp-file input[type="file"]')));
  let dt;
  try{dt=new win.DataTransfer();}catch{dt=new DataTransfer();}
  dt.items.add(file);fileInput.files=dt.files;fileInput.dispatchEvent(new win.Event('change',{bubbles:true}));
  const pickerRoot=fileInput.closest('.file-picker,.moodle-dialogue')||doc;
  const saveAs=pickerRoot.querySelector('.fp-saveas input');if(saveAs)saveAs.value=file.name;
  const uploadButton=pickerRoot.querySelector('.fp-upload-btn');
  if(!uploadButton)throw new Error('No se encontró el botón de carga del archivo.');
  uploadButton.click();
  await waitForElement(()=>clean(manager.textContent||'').includes(file.name),20000,250);
}

async function uploadNativeAttachments(win,doc,form,attachments=[],fieldName='attachments'){
  for(const item of attachments||[])await uploadOneNativeAttachment(win,doc,form,item.file||item,fieldName);
}

async function postUsingNativeEditor(url, html, images=[], attachments=[]) {
  if(!images.length&&!attachments.length) return postSimple(url,html);
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe'); frame.dataset.mftUploader='1'; frame.name='mft_image_frame_'+Date.now(); frame.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1200px;height:900px;border:0;opacity:.01;pointer-events:none;';
    let finished=false; const cleanup=()=>{if(!finished){finished=true;frame.remove();}};
    const timer=setTimeout(()=>{cleanup();reject(new Error('Moodle tardó demasiado en inicializar el editor o cargar los archivos. Use “Abrir en Moodle” como alternativa.'));},120000);
    frame.onload=async()=>{
      if(finished||!frame.src||!frame.src.includes('/mod/forum/post.php'))return;
      try{
        const win=PAGE.frames?.[frame.name]||frame.contentWindow, doc=frame.contentDocument, form=replyForm(doc); if(!form)throw new Error('No se encontró el formulario de respuesta de Moodle.');
        let editor=null;
        if(images.length){
          editor=await waitForTiny(win,form); if(!editor)throw new Error('No se detectó TinyMCE con carga de imágenes en esta instalación. La respuesta con imágenes debe completarse desde el editor nativo de Moodle.');
          editor.setContent(html);
        }else{
          const field=messageField(form);if(!field?.name)throw new Error('No se encontró el campo del mensaje.');field.value=html;
        }
        if(images.length){
        const body=editor.getBody(), cache=editor.editorUpload?.blobCache; if(!cache)throw new Error('El editor no expone el cargador de imágenes de Moodle.');
        for(let i=0;i<images.length;i++){
          const im=images[i], placeholder=body.querySelector(`[data-mft-image-id="${CSS.escape(im.id)}"]`); if(!placeholder)continue;
          const base64=await fileToBase64(im.file), blobInfo=cache.create(`mft_${Date.now()}_${i}`,im.file,base64); cache.add(blobInfo);
          const img=doc.createElement('img'); img.src=blobInfo.blobUri(); img.alt=im.alt||im.file.name; img.style.maxWidth='100%'; img.style.height='auto'; placeholder.replaceWith(img);
        }
        const results=await editor.uploadImages(); if(Array.isArray(results)&&results.some(r=>r&&r.status===false))throw new Error('Moodle rechazó una o más imágenes durante la carga.');
        editor.save();
        }
        if(attachments.length)await uploadNativeAttachments(win,doc,form,attachments,'attachments');
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

function postAttachmentMatch(post,attachments){
  if(!attachments?.length)return true;
  const names=new Set(postAttachments(post).map(x=>clean(x.name).toLowerCase()));
  return attachments.every(item=>names.has(clean((item.file||item).name).toLowerCase()));
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

async function verifyDirect(discussionUrl,tutor,parentId,html,images,attachments=[],priorIds=new Set(),submission=null){
  const expectedId=postIdFromRedirect(submission?.url);
  for(let attempt=0;attempt<6;attempt++){
    await sleep(attempt?1250:650);
    const page=await fetchPage(discussionUrl),nodes=postNodes(page.doc);
    for(let i=0;i<nodes.length;i++){
      const node=nodes[i],id=String(getPostId(node,i));
      if(String(explicitParent(node))!==String(parentId))continue;
      if(priorIds.has(id))continue;
      if(expectedId&&id!==String(expectedId))continue;
      if(!postedByTutor(node,tutor,expectedId))continue;
      if(!publishedTextMatch(node,html,expectedId?'new':'strict'))continue;
      if(!postImageMatch(node,images,'new')||!postAttachmentMatch(node,attachments))continue;
      const a=authorInfo(node),dt=extractDate(node);
      return {ok:true,post:{role:'Tutor',author:a.name||tutor.name,authorId:a.userId,dateRaw:dt.raw,dateTimestamp:dt.timestamp,subject:postSubject(node),content:postContent(node),attachments:postAttachments(node),profile:a.profile,link:permanentLink(node,discussionUrl),replyUrl:replyLink(node,discussionUrl),discussionUrl,postId:id,parentPostId:String(parentId),parentSource:'Moodle',directAnswered:false,tutorInBranch:false}};
    }
  }
  return {ok:false};
}

async function sendDirect(post,tutor,text,images,attachments=[]){
  const html=renderMessage(text,images,'publish').trim();
  if(!html)throw new Error('La respuesta está vacía.');
  const baseline=new Set(postNodes((await fetchPage(post.discussionUrl)).doc).map((p,i)=>String(getPostId(p,i))));
  const result=await postUsingNativeEditor(post.replyUrl,html,images,attachments);
  const verified=await verifyDirect(post.discussionUrl,tutor,post.postId,html,images,attachments,baseline,result);
  if(!verified.ok)throw new Error('Moodle recibió el envío, pero no se identificó con certeza la nueva respuesta directa. Revise Moodle antes de reintentar para evitar duplicados.');
  return verified.post;
}

/* ========================= Moodle internal mail sending ========================= */

function studentRoleIdFromCompose(doc){
  const select=doc.querySelector('#local_mail_recipients_roles,select[name="local_mail_recipients_roles"]');
  if(!select)return 0;
  const option=[...select.options].find(o=>/estudiante|student/i.test(clean(o.textContent)));
  return /^\d+$/.test(String(option?.value||''))?Number(option.value):0;
}

function mailCampaign(text,subject,images=[],attachments=[]){
  const key=`${K.mailCampaignPrefix}${location.origin}_${hash(clean(subject)+'||'+clean(text)+'||'+assetSignature(images,attachments))}`;
  let record;
  try{record=JSON.parse(localStorage.getItem(key)||'{"sent":{},"uncertain":{}}');}catch{record={sent:{},uncertain:{}};}
  record.sent=record.sent||{};record.uncertain=record.uncertain||{};
  return {key,record};
}

function mailTargetKey(target){return `course_${target.courseId}`;}

function wasInternalMailSent(text,subject,target,images=[],attachments=[]){
  const {record}=mailCampaign(text,subject,images,attachments);return !!record.sent[mailTargetKey(target)];
}

function internalMailUncertain(text,subject,target,images=[],attachments=[]){
  const {record}=mailCampaign(text,subject,images,attachments);return record.uncertain[mailTargetKey(target)]||null;
}

function markInternalMailSent(text,subject,target,images=[],attachments=[],details={}){
  const {key,record}=mailCampaign(text,subject,images,attachments),targetKey=mailTargetKey(target);
  record.sent[targetKey]={date:Date.now(),courseId:target.courseId,name:target.name,...details};
  delete record.uncertain[targetKey];localStorage.setItem(key,JSON.stringify(record));
}

function markInternalMailUncertain(text,subject,target,images=[],attachments=[],details={}){
  const {key,record}=mailCampaign(text,subject,images,attachments),targetKey=mailTargetKey(target);
  record.uncertain[targetKey]={date:Date.now(),courseId:target.courseId,name:target.name,...details};
  localStorage.setItem(key,JSON.stringify(record));
}

function mailTargetsFromUnits(units){
  const map=new Map();
  for(const unit of units){
    const courseId=String(unit.courseId||'');
    if(!/^\d+$/.test(courseId))continue;
    if(!map.has(courseId))map.set(courseId,{courseId,name:unit.classroomName||`Curso ${courseId}`,groupIds:new Set()});
    const groupId=!unit.single&&/^\d+$/.test(String(unit.id||''))?String(unit.id):'0';
    map.get(courseId).groupIds.add(groupId);
  }
  return [...map.values()].map(x=>({...x,groupIds:[...x.groupIds]}));
}

async function createInternalMailDraft(courseId){
  const sesskey=moodleSesskey();
  if(!sesskey)throw new Error('No se encontró la clave de sesión de Moodle.');
  const page=await fetchPage(mailEndpoint('create.php',{c:courseId,sesskey}));
  let final;
  try{final=new URL(page.finalUrl);}catch{throw new Error('Respuesta inválida al crear el borrador.');}
  const messageId=final.searchParams.get('m');
  if(!/\/local\/mail\/compose\.php$/i.test(final.pathname)||!/^\d+$/.test(messageId||'')){
    throw new Error('El correo interno no permitió crear un borrador para este curso.');
  }
  return {messageId,doc:page.doc,url:page.finalUrl,roleId:studentRoleIdFromCompose(page.doc)};
}

function parseInternalMailRecipientCandidates(html){
  const doc=docFromHtml(`<div>${html||''}</div>`),map=new Map();
  for(const row of doc.querySelectorAll('.mail_form_recipient')){
    const roleNode=row.querySelector('[data-role-recipient]');
    let id=String(roleNode?.getAttribute('data-role-recipient')||'');
    if(!/^\d+$/.test(id)){
      const input=row.querySelector('input[name^="bcc["],input[name^="to["],input[name^="cc["]');
      const match=String(input?.getAttribute('name')||'').match(/\[(\d+)\]/);id=match?.[1]||'';
    }
    if(!/^\d+$/.test(id))continue;
    const name=clean(row.querySelector('.mail_form_recipient_name')?.textContent||'')||('Usuario '+id);
    map.set(id,{id,name});
  }
  return {doc,candidates:[...map.values()]};
}

async function getInternalMailRecipientCandidates(messageId,groupId,roleId=0){
  const sesskey=moodleSesskey();
  const body=new URLSearchParams({
    msgs:String(messageId),sesskey,search:'',groupid:String(groupId||0),roleid:String(roleId||0),action:'getrecipients'
  });
  const response=await fetch(mailEndpoint('ajax.php'),{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body
  });
  if(!response.ok)throw new Error(`Correo interno: HTTP ${response.status} al consultar destinatarios.`);
  const data=await response.json();
  if(data.msgerror)throw new Error(data.msgerror);
  const parsed=parseInternalMailRecipientCandidates(data.html||'');
  if(!parsed.candidates.length&&clean(data.html)&&/demasiad|too many|toomany/i.test(clean(parsed.doc.body.textContent))){
    throw new Error('El correo interno devuelve demasiados destinatarios para seleccionarlos de una vez. Use grupos del curso.');
  }
  return parsed.candidates;
}

async function getInternalMailRecipients(messageId,groupId,roleId=0){
  return (await getInternalMailRecipientCandidates(messageId,groupId,roleId)).map(x=>x.id);
}

async function previewInternalMailTargets(targets,onStatus=()=>{}){
  const result=[],allRecipients=new Map();
  for(let i=0;i<targets.length;i++){
    const target=targets[i],draft=await createInternalMailDraft(target.courseId);
    const recipients=new Map();
    try{
      const groups=target.groupIds.length?target.groupIds:['0'];
      for(let g=0;g<groups.length;g++){
        onStatus(`Destinatarios: ${target.name} · grupo ${groups[g]} (${g+1}/${groups.length})`);
        const candidates=await getInternalMailRecipientCandidates(draft.messageId,groups[g],draft.roleId);
        for(const candidate of candidates){recipients.set(candidate.id,candidate);allRecipients.set(target.courseId+'::'+candidate.id,{...candidate,courseId:target.courseId,courseName:target.name});}
        await sleep(REQUEST_PAUSE);
      }
      result.push({...target,recipients:[...recipients.values()]});
    }finally{await discardInternalMailDraft(draft.messageId);}
  }
  return {courses:result,total:allRecipients.size,recipients:[...allRecipients.values()]};
}


function showInternalMailRecipientPreview(data){
  document.getElementById('mft-mail-recipient-preview')?.remove();
  const ov=document.createElement('div');ov.id='mft-mail-recipient-preview';
  ov.style.cssText='position:fixed;inset:0;z-index:290000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif;';
  const box=document.createElement('div');box.style.cssText='width:min(900px,96vw);max-height:90vh;overflow:auto;background:white;border-radius:10px;padding:18px;color:#222;';
  const h=document.createElement('h2');h.textContent='Destinatarios del correo interno';h.style.marginTop='0';
  const intro=document.createElement('p');intro.style.cssText='font-size:13px;color:#555;line-height:1.45;';
  intro.textContent='El correo interno de Moodle no usa direcciones de correo escritas manualmente: los destinatarios son usuarios matriculados del curso. Esta vista muestra a quiénes seleccionará la campaña como estudiantes y los enviará en CCO.';
  const total=document.createElement('div');total.style.cssText='padding:8px 10px;background:#f5f7fa;border:1px solid #dde3ea;border-radius:6px;font-weight:700;margin-bottom:10px;';
  total.textContent=`${data.total} destinatario(s) único(s) en ${data.courses.length} aula(s)`;
  box.append(h,intro,total);
  for(const course of data.courses){
    const details=document.createElement('details');details.open=true;details.style.cssText='margin:8px 0;border:1px solid #ddd;border-radius:7px;padding:8px;';
    const summary=document.createElement('summary');summary.style.cssText='cursor:pointer;font-weight:700;';
    summary.textContent=`${course.name} — ${course.recipients.length} destinatario(s)`;
    const groups=document.createElement('div');groups.style.cssText='font-size:11px;color:#666;margin:6px 0;';
    groups.textContent='Grupos consultados: '+(course.groupIds?.join(', ')||'0');
    const names=document.createElement('div');names.style.cssText='columns:2;column-gap:18px;font-size:12px;line-height:1.5;';
    for(const recipient of course.recipients){
      const d=document.createElement('div');d.textContent=recipient.name;names.appendChild(d);
    }
    details.append(summary,groups,names);box.appendChild(details);
  }
  const close=button('Cerrar',COLOR.gray);close.onclick=()=>ov.remove();box.appendChild(close);ov.appendChild(box);document.body.appendChild(ov);
}

async function setInternalMailBcc(messageId,recipientIds){
  if(!recipientIds.length)throw new Error('No se encontraron destinatarios para el correo interno.');
  const body=new URLSearchParams({
    msgs:String(messageId),sesskey:moodleSesskey(),action:'updaterecipients',
    recipients:recipientIds.join(','),roleids:recipientIds.map(()=>2).join(',')
  });
  const response=await fetch(mailEndpoint('ajax.php'),{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body
  });
  if(!response.ok)throw new Error(`Correo interno: HTTP ${response.status} al asignar CCO.`);
  const data=await response.json();
  if(data.msgerror)throw new Error(data.msgerror);
  return data;
}

function formDataFromForm(form){
  const data=new FormData();
  for(const el of form.elements||[]){
    if(!el.name||el.disabled)continue;
    const type=String(el.type||'').toLowerCase();
    if(['submit','button','image','file'].includes(type))continue;
    if((type==='checkbox'||type==='radio')&&!el.checked)continue;
    if(el.tagName==='SELECT'&&el.multiple){
      for(const opt of el.selectedOptions)data.append(el.name,opt.value);
    }else data.append(el.name,el.value??'');
  }
  return data;
}

async function discardInternalMailDraft(messageId){
  try{
    const page=await fetchPage(mailEndpoint('compose.php',{m:messageId}));
    const form=page.doc.querySelector('form');
    if(!form)return;
    const data=formDataFromForm(form);data.set('discard','1');
    const action=absoluteUrl(form.getAttribute('action')||page.finalUrl,page.finalUrl);
    await fetch(action,{method:'POST',credentials:'same-origin',body:data,redirect:'follow'});
  }catch{}
}

function internalMailContentField(form){
  return form.querySelector('[name="content[text]"],textarea[name="content[text]"],[name="message[text]"],textarea[name="message[text]"]');
}

function internalMailComposeForm(doc){
  return [...doc.querySelectorAll('form')].find(f=>f.querySelector('[name="subject"]')&&internalMailContentField(f))||null;
}

async function waitForTinyField(win,field,timeout=15000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    const tinymce=win.tinymce||win.wrappedJSObject?.tinymce;
    if(tinymce?.editors?.length){
      const editor=tinymce.editors.find(e=>e.targetElm===field||e.targetElm?.name===field?.name||e.id===field?.id)||tinymce.activeEditor;
      if(editor?.initialized!==false&&editor?.getBody())return editor;
    }
    await sleep(250);
  }
  return null;
}

function prepareInternalMailFormData(form,subject){
  const data=formDataFromForm(form);
  data.set('subject',clean(subject).slice(0,100));
  if(data.has('content[format]'))data.set('content[format]','1');
  const send=[...form.querySelectorAll('input[type="submit"][name="send"],button[type="submit"][name="send"]')][0];
  data.set('send',send?.value||clean(send?.textContent)||'Enviar');
  for(const key of ['save','discard','recipients','recipientshidden'])data.delete(key);
  return data;
}

async function submitInternalMailDraft(messageId,text,subject,images=[],attachments=[]){
  const url=mailEndpoint('compose.php',{m:messageId}),html=renderMessage(text,images,'publish').trim();
  if(!images.length&&!attachments.length){
    const page=await fetchPage(url),form=internalMailComposeForm(page.doc);
    if(!form)throw new Error('No se reconoció el formulario de composición del correo interno.');
    const field=internalMailContentField(form),data=prepareInternalMailFormData(form,subject);
    data.set(field.name,html);
    const action=absoluteUrl(form.getAttribute('action')||page.finalUrl,page.finalUrl);
    const response=await fetch(action,{method:'POST',credentials:'same-origin',body:data,redirect:'follow',cache:'no-store'});
    const resultHtml=await response.text(),resultDoc=docFromHtml(resultHtml);
    if(!response.ok||/\/local\/mail\/compose\.php$/i.test(new URL(response.url).pathname)||internalMailComposeForm(resultDoc))throw new Error('Moodle permaneció en el formulario de composición.');
    return {ok:true,url:response.url};
  }
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');frame.dataset.mftUploader='1';frame.name='mft_mail_file_frame_'+Date.now();
    frame.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1200px;height:900px;border:0;opacity:.01;pointer-events:none;';
    let finished=false;const cleanup=()=>{if(!finished){finished=true;frame.remove();}};
    const timer=setTimeout(()=>{cleanup();reject(new Error('Moodle tardó demasiado en inicializar el editor o cargar los adjuntos del correo.'));},120000);
    frame.onload=async()=>{
      if(finished||!frame.src||!frame.src.includes('/local/mail/compose.php'))return;
      try{
        const win=PAGE.frames?.[frame.name]||frame.contentWindow,doc=frame.contentDocument,form=internalMailComposeForm(doc);
        if(!form)throw new Error('No se encontró el formulario del correo interno.');
        const field=internalMailContentField(form);if(!field)throw new Error('No se encontró el campo del mensaje.');
        if(images.length){
          const editor=await waitForTinyField(win,field);if(!editor)throw new Error('No se detectó TinyMCE para cargar las imágenes del correo.');
          editor.setContent(html);
          const body=editor.getBody(),cache=editor.editorUpload?.blobCache;if(!cache)throw new Error('El editor del correo no expone el cargador de imágenes de Moodle.');
          for(let i=0;i<images.length;i++){
            const im=images[i],placeholder=body.querySelector(`[data-mft-image-id="${CSS.escape(im.id)}"]`);if(!placeholder)continue;
            const base64=await fileToBase64(im.file),blobInfo=cache.create(`mft_mail_${Date.now()}_${i}`,im.file,base64);cache.add(blobInfo);
            const img=doc.createElement('img');img.src=blobInfo.blobUri();img.alt=im.alt||im.file.name;img.style.maxWidth='100%';img.style.height='auto';placeholder.replaceWith(img);
          }
          const results=await editor.uploadImages();if(Array.isArray(results)&&results.some(x=>x&&x.status===false))throw new Error('Moodle rechazó una o más imágenes del correo.');
          editor.save();
        }else field.value=html;
        if(attachments.length)await uploadNativeAttachments(win,doc,form,attachments,'attachments');
        const data=prepareInternalMailFormData(form,subject);if(!field.value)throw new Error('El editor no transfirió el contenido al formulario del correo.');data.set(field.name,field.value);
        const action=absoluteUrl(form.getAttribute('action')||frame.src,frame.src);
        const response=await fetch(action,{method:'POST',credentials:'same-origin',body:data,redirect:'follow',cache:'no-store'});
        const resultHtml=await response.text(),resultDoc=docFromHtml(resultHtml);
        if(!response.ok||/\/local\/mail\/compose\.php$/i.test(new URL(response.url).pathname)||internalMailComposeForm(resultDoc))throw new Error('Moodle permaneció en el formulario de composición.');
        clearTimeout(timer);cleanup();resolve({ok:true,url:response.url});
      }catch(error){clearTimeout(timer);cleanup();reject(error);}
    };
    document.body.appendChild(frame);frame.src=url;
  });
}

async function sendInternalMailCampaign(target,text,subject,images=[],attachments=[]){
  if(wasInternalMailSent(text,subject,target,images,attachments))return {ok:true,skipped:true,reason:'registro-local'};
  if(internalMailUncertain(text,subject,target,images,attachments)){
    throw new Error('Este curso tiene un envío de correo interno pendiente de verificación. Revise Enviados antes de repetirlo.');
  }
  let draft=null;
  try{
    draft=await createInternalMailDraft(target.courseId);
    const recipients=new Set(),groups=target.groupIds.length?target.groupIds:['0'];
    for(const groupId of groups){
      const ids=await getInternalMailRecipients(draft.messageId,groupId,draft.roleId);
      for(const id of ids)recipients.add(id);
      await sleep(REQUEST_PAUSE);
    }
    if(!recipients.size)throw new Error('No se encontraron participantes destinatarios en los grupos seleccionados.');
    await setInternalMailBcc(draft.messageId,[...recipients]);
    try{
      await submitInternalMailDraft(draft.messageId,text,subject,images,attachments);
    }catch(error){
      markInternalMailUncertain(text,subject,target,images,attachments,{messageId:draft.messageId,reason:error.message});
      throw new Error('Moodle no pudo verificar el envío del correo. Revise Enviados y Borradores antes de reintentar. '+error.message);
    }
    markInternalMailSent(text,subject,target,images,attachments,{messageId:draft.messageId,recipients:recipients.size,images:images.length,attachments:attachments.length});
    return {ok:true,skipped:false,recipients:recipients.size,messageId:draft.messageId,images:images.length,attachments:attachments.length};
  }catch(error){
    if(draft&&!internalMailUncertain(text,subject,target,images,attachments))await discardInternalMailDraft(draft.messageId);
    throw error;
  }
}

/* ========================= Campaigns ========================= */

function imageSignature(images){return (images||[]).map(x=>`${x.file.name}|${x.file.size}|${x.file.lastModified}`).join('||');}
function attachmentSignature(attachments){return (attachments||[]).map(x=>{const f=x.file||x;return `${f.name}|${f.size}|${f.lastModified}`;}).join('||');}
function assetSignature(images,attachments=[]){return imageSignature(images)+'##FILES##'+attachmentSignature(attachments);}
function campaignKey(text,images,attachments=[]){return `${K.campaignPrefix}${location.origin}_${hash(text+'||'+assetSignature(images,attachments))}`;}
function campaign(text,images,attachments=[]){try{return JSON.parse(localStorage.getItem(campaignKey(text,images,attachments))||'{"sent":{}}');}catch{return{sent:{}};}}
function saveCampaign(text,images,attachments,r){localStorage.setItem(campaignKey(text,images,attachments),JSON.stringify(r));}
function markUncertain(text,images,attachments,unit,details={}){
  const r=campaign(text,images,attachments);r.uncertain=r.uncertain||{};
  r.uncertain[unit.key]={classroomUid:unit.classroomUid,classroomName:unit.classroomName,group:unit.name,date:Date.now(),...details};
  saveCampaign(text,images,attachments,r);
}
function uncertainty(text,images,attachments,unit){return campaign(text,images,attachments).uncertain?.[unit.key]||null;}
function clearUncertain(text,images,attachments,unit){const r=campaign(text,images,attachments);if(r.uncertain)delete r.uncertain[unit.key];saveCampaign(text,images,attachments,r);}
function markSent(text,images,attachments,unit,extra={}){
  const r=campaign(text,images,attachments);r.sent=r.sent||{};r.uncertain=r.uncertain||{};
  r.sent[unit.key]={classroomUid:unit.classroomUid,classroomName:unit.classroomName,group:unit.name,date:Date.now(),...extra};
  delete r.uncertain[unit.key];saveCampaign(text,images,attachments,r);
}
function wasSent(text,images,attachments,unit){return !!campaign(text,images,attachments).sent?.[unit.key];}
function classroomTested(text,images,attachments,uid){return Object.values(campaign(text,images,attachments).sent||{}).some(x=>x.classroomUid===uid&&x.test===true);}
function anyTested(text,images,attachments){return Object.values(campaign(text,images,attachments).sent||{}).some(x=>x.test===true);}

async function existingMassPost(doc,tutor,html,images,attachments=[]){
  for(const post of postNodes(doc)){
    if(!isTutor(authorInfo(post),tutor))continue;
    if(publishedTextMatch(post,html,'strict')&&postImageMatch(post,images,'strict')&&postAttachmentMatch(post,attachments))return true;
  }
  return false;
}

async function verifyNewMassPost(discussionUrl,tutor,html,images,attachments,oldIds,submission){
  const expectedId=postIdFromRedirect(submission?.url);
  for(let attempt=0;attempt<6;attempt++){
    await sleep(attempt?1250:650);
    const nodes=postNodes((await fetchPage(discussionUrl)).doc);
    const newlyCreated=nodes.filter((p,i)=>!oldIds.has(String(getPostId(p,i))));
    const candidates=expectedId&&!oldIds.has(String(expectedId))?nodes.filter((p,i)=>String(getPostId(p,i))===String(expectedId)):newlyCreated;
    for(let i=0;i<candidates.length;i++){
      const post=candidates[i],id=getPostId(post);
      const authorMatches=isTutor(authorInfo(post),tutor);
      if(!authorMatches&&!(expectedId&&String(id)===String(expectedId)))continue;
      const confidence=expectedId&&String(id)===String(expectedId)?'new':'strict';
      if(!publishedTextMatch(post,html,confidence)||!postImageMatch(post,images,'new')||!postAttachmentMatch(post,attachments))continue;
      return {ok:true,postId:id};
    }
  }
  return {ok:false};
}

async function sendMassToUnit(unit,tutor,text,images,attachments=[],{test=false}={}){
  if(wasSent(text,images,attachments,unit)&&!test)return {ok:true,skipped:true,reason:'registro-local'};
  const groupPage=await fetchPage(unit.url),discussions=discussionUrls(groupPage.doc);
  if(!discussions.length)throw new Error('No se encontró discusión en el destino.');
  const durl=discussions[0],dpage=await fetchPage(durl),html=renderMessage(text,images,'publish').trim();
  if(await existingMassPost(dpage.doc,tutor,html,images,attachments)){
    markSent(text,images,attachments,unit,{test,url:durl,detected:true,method:'contenido'});
    return {ok:true,skipped:true,url:durl};
  }
  if(uncertainty(text,images,attachments,unit))throw new Error('Este destino tiene una publicación con verificación pendiente. Revísela en Moodle antes de autorizar otro envío.');
  const root=findRootPost(dpage.doc);
  if(!root)throw new Error('No se encontró el mensaje raíz.');
  let reply=replyLink(root,durl);
  if(!reply){const u=new URL('post.php',durl);u.searchParams.set('reply',getPostId(root,0));reply=u.href;}
  const baseline=new Set(postNodes(dpage.doc).map((p,i)=>String(getPostId(p,i))));
  let submission;
  try{submission=await postUsingNativeEditor(reply,html,images,attachments);}
  catch(error){
    markUncertain(text,images,attachments,unit,{url:durl,reason:'Error durante la publicación: '+error.message});
    throw new Error(`No se pudo confirmar el envío. ${error.message} Revise Moodle antes de reintentar.`);
  }
  const result=await verifyNewMassPost(durl,tutor,html,images,attachments,baseline,submission);
  if(!result.ok){
    markUncertain(text,images,attachments,unit,{url:durl,postId:postIdFromRedirect(submission?.url),reason:'No se localizó el nuevo mensaje después del POST.'});
    throw new Error('La publicación fue recibida, pero no se verificó. Se bloqueó el reintento automático; revise Moodle antes de continuar.');
  }
  markSent(text,images,attachments,unit,{test,url:durl,detected:true,postId:result.postId,method:'nuevo-post'});
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


/* ========================= Compact launcher and voluntary support ========================= */

function createDonationBanner(compact=false){
  const banner=document.createElement('div');
  banner.className='mft-donation';
  banner.textContent='Donaciones voluntarias · Llave '+DONATION_KEY;
  banner.title='Apoyo voluntario al desarrollo de Moodle Forum Toolkit';
  banner.style.cssText=(compact
    ?'position:relative;margin:0 auto;'
    :'margin:9px 0 0;')
    +'padding:7px 5px;background:#f5f8fc;color:#183f74;border:1px solid #dce4ef;border-radius:7px;'
    +'font-size:11px;font-weight:600;line-height:1.5;text-align:center;white-space:nowrap;'
    +'overflow-x:auto;overflow-y:hidden;box-sizing:border-box;width:100%;user-select:text;';
  return banner;
}

function attachCollapsiblePanel(panel,content,storageKey){
  const header=document.createElement('div');
  header.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;min-height:42px;box-sizing:border-box;';
  const title=document.createElement('strong');
  title.id='mft-panel-title';
  title.id='mft-panel-title';
  title.textContent='Moodle Forum Toolkit v'+VERSION;
  title.style.cssText='font-size:13px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  const toggle=button('Ocultar ▾',COLOR.gray);
  toggle.style.cssText+='flex:0 0 auto;font-size:12px;padding:5px 7px;';
  toggle.type='button';
  toggle.setAttribute('aria-controls',content.id);
  content.style.cssText='display:block;max-height:calc(85vh - 54px);overflow-y:auto;padding:0 12px 12px;box-sizing:border-box;';
  panel.style.padding='0';
  panel.style.maxHeight='85vh';
  panel.style.overflow='hidden';
  const expandedWidth='min(390px,calc(100vw - 24px))';
  const collapsedWidth='min(238px,calc(100vw - 24px))';
  function applyCollapse(collapsed,persist=false){
    content.style.display=collapsed?'none':'block';
    panel.style.width=collapsed?collapsedWidth:expandedWidth;
    panel.setAttribute('data-mft-collapsed',collapsed?'true':'false');
    toggle.textContent=collapsed?'Mostrar ▴':'Ocultar ▾';
    toggle.setAttribute('aria-expanded',collapsed?'false':'true');
    toggle.setAttribute('aria-label',collapsed?'Desplegar Moodle Forum Toolkit':'Plegar Moodle Forum Toolkit');
    if(persist){try{GM_setValue(storageKey,collapsed);}catch(error){console.warn('MFT: no se pudo guardar el tamaño del panel.',error);}}
  }
  toggle.onclick=()=>applyCollapse(panel.getAttribute('data-mft-collapsed')!=='true',true);
  header.append(title,toggle);
  panel.append(header,content);
  let initiallyCollapsed=true;
  try{initiallyCollapsed=GM_getValue(storageKey,true)!==false;}catch(error){console.warn('MFT: no se pudo recuperar el estado del panel.',error);}
  applyCollapse(initiallyCollapsed);
}

/* ========================= Direct reply modal ========================= */

function directReplyModal(post,tutor,onSuccess=()=>{}) {
  document.getElementById('mft-direct-modal')?.remove();const ov=document.createElement('div');ov.id='mft-direct-modal';ov.style.cssText='position:fixed;inset:0;z-index:260000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif;';
  const box=document.createElement('div');box.style.cssText='width:min(900px,96vw);max-height:94vh;overflow:auto;background:white;border-radius:10px;padding:18px;color:#222;';
  const ta=document.createElement('textarea'),preview=document.createElement('div'),status=document.createElement('div');ta.value=`Hola ${firstTwoNames(post.author)}, ${localStorage.getItem(K.quickText)||''}`.trim();ta.style.cssText='width:100%;min-height:170px;padding:9px;box-sizing:border-box;';preview.style.cssText='border:1px solid #ddd;border-radius:6px;padding:10px;margin-top:8px;min-height:80px;';status.style.cssText='font-size:12px;margin-top:8px;';
  box.innerHTML=`<h2 style="margin-top:0">Responder directamente</h2><div style="font-size:13px;color:#555;margin-bottom:8px">${esc(post.classroomName)} — ${esc(post.group)} — ${esc(post.author)}</div>`;box.append(ta);const manager=createImageEditor(ta,preview);box.append(manager.root,preview,status);
  const send=button('Enviar respuesta',COLOR.green),open=linkButton('Abrir en Moodle',post.replyUrl),cancel=button('Cancelar');
  send.onclick=async()=>{if(!clean(ta.value))return alert('La respuesta está vacía.');if(!confirm(`Se enviará esta respuesta directamente a ${post.author}.\n\n¿Continuar?`))return;send.disabled=true;status.textContent='Enviando y cargando archivos...';try{const reply=await sendDirect(post,tutor,ta.value,manager.images,manager.attachments);post.directAnswered=true;post.tutorInBranch=false;status.style.color=COLOR.green;status.textContent='✓ Respuesta publicada y verificada.';onSuccess(reply);setTimeout(()=>{manager.destroy();ov.remove();},900);}catch(e){status.style.color=COLOR.red;status.textContent='✗ '+e.message;send.disabled=false;}};
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
  const forumCheck=document.createElement('input');forumCheck.type='checkbox';forumCheck.checked=localStorage.getItem(K.forumEnabled)!=='0';
  const forumLabel=document.createElement('label');forumLabel.style.cssText='display:inline-flex;align-items:center;gap:5px;font-weight:600;';forumLabel.append(forumCheck,document.createTextNode('Enviar a foros'));
  const mailCheck=document.createElement('input');mailCheck.type='checkbox';mailCheck.checked=localStorage.getItem(K.mailEnabled)==='1';
  const mailLabel=document.createElement('label');mailLabel.style.cssText='display:inline-flex;align-items:center;gap:5px;font-weight:600;';mailLabel.append(mailCheck,document.createTextNode('Enviar por correo interno (CCO)'));
  const mailSubject=document.createElement('input');mailSubject.type='text';mailSubject.maxLength=100;mailSubject.placeholder='Asunto del correo interno';mailSubject.value=localStorage.getItem(K.mailSubject)||'';mailSubject.style.cssText='min-width:280px;flex:1;padding:6px;';
  const mailHint=document.createElement('small');mailHint.textContent='El correo interno usa usuarios matriculados de Moodle como destinatarios; no requiere escribir direcciones. Puede revisar la lista antes de enviar. Las imágenes se insertan en el cuerpo y los documentos se adjuntan.';mailHint.style.cssText='flex-basis:100%;color:#666;line-height:1.35;';
  const mailRecipientsBtn=button('Revisar destinatarios',COLOR.blue),mailRecipientsStatus=document.createElement('span');
  mailRecipientsStatus.style.cssText='font-size:12px;color:#555;';
  const testTarget=document.createElement('select');for(const u of units){const o=document.createElement('option');o.value=u.key;o.textContent=`${u.classroomName} — ${u.name}`;testTarget.appendChild(o);}const test=button('Enviar prueba al foro',COLOR.green),send=button('Enviar campaña',COLOR.orange),openReview=button('Abrir destino para revisar',COLOR.blue),scan=button('Escanear publicaciones existentes',COLOR.blue),confirmPosted=button('Confirmar publicación existente',COLOR.gray),retry=button('Liberar reintento',COLOR.gray),stop=button('Detener',COLOR.red),close=button('Cerrar');stop.style.display='none';
  const controls=document.createElement('div');controls.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0;';controls.append(document.createTextNode('Seguridad:'),security,document.createTextNode('Alcance:'),scope,document.createTextNode('Pausa s:'),pause,forumLabel,mailLabel,mailSubject,mailRecipientsBtn,mailRecipientsStatus,mailHint,document.createTextNode('Prueba:'),testTarget,test,send,openReview,scan,confirmPosted,retry,stop,close);box.append(controls,status,log);
  let stopping=false;
  const selected=()=>scope.value==='all'?units:units.filter(u=>u.classroomUid===scope.value);
  function requirement(text,images,attachments,pending){if(!pending.length)return{ok:true,missing:[]};if(security.value==='no-test')return{ok:true,missing:[]};if(security.value==='one-test')return{ok:anyTested(text,images,attachments),missing:anyTested(text,images,attachments)?[]:['Se requiere una prueba verificada.']};const ids=[...new Set(pending.map(u=>u.classroomUid))],missing=ids.filter(id=>!classroomTested(text,images,attachments,id)).map(id=>classrooms.find(a=>a.uid===id)?.name||id);return{ok:!missing.length,missing};}
  function refresh(){
    localStorage.setItem(K.massDraft,ta.value);localStorage.setItem(K.massSecurity,security.value);localStorage.setItem(K.massPause,String(Math.max(1,Math.min(30,Number(pause.value)||3))));
    localStorage.setItem(K.forumEnabled,forumCheck.checked?'1':'0');localStorage.setItem(K.mailEnabled,mailCheck.checked?'1':'0');localStorage.setItem(K.mailSubject,mailSubject.value);
    mailSubject.style.display=mailCheck.checked?'inline-block':'none';mailRecipientsBtn.style.display=mailCheck.checked?'inline-block':'none';mailRecipientsStatus.style.display=mailCheck.checked?'inline':'none';mailHint.style.display=mailCheck.checked?'block':'none';
    const text=ta.value,scopeUnits=selected(),forumUnits=forumCheck.checked?scopeUnits:[],blocked=forumUnits.filter(u=>!wasSent(text,manager.images,manager.attachments,u)&&uncertainty(text,manager.images,manager.attachments,u)),pending=forumUnits.filter(u=>!wasSent(text,manager.images,manager.attachments,u)&&!uncertainty(text,manager.images,manager.attachments,u)),req=requirement(text,manager.images,manager.attachments,pending);
    const allMail=mailCheck.checked?mailTargetsFromUnits(scopeUnits):[],mailPending=allMail.filter(t=>!wasInternalMailSent(text,mailSubject.value,t,manager.images,manager.attachments)&&!internalMailUncertain(text,mailSubject.value,t,manager.images,manager.attachments)),mailBlocked=allMail.filter(t=>internalMailUncertain(text,mailSubject.value,t,manager.images,manager.attachments)),unknown=mailCheck.checked?scopeUnits.filter(u=>!/^\d+$/.test(String(u.courseId||''))).length:0;
    const subjectOk=!mailCheck.checked||!!clean(mailSubject.value),channelsOk=forumCheck.checked||mailCheck.checked;
    status.innerHTML=`Foros: ${forumCheck.checked?`<strong>${forumUnits.length}</strong> destinos · pendientes: <strong>${pending.length}</strong> · <span style="color:${COLOR.orange}">revisión manual: <strong>${blocked.length}</strong></span>`:'<strong>desactivados</strong>'} · Correo interno: ${mailCheck.checked?`<strong>${mailPending.length}</strong> curso(s) pendiente(s)${mailBlocked.length?` · <span style="color:${COLOR.orange}">${mailBlocked.length} por revisar</span>`:''}${unknown?` · <span style="color:${COLOR.red}">${unknown} destino(s) sin curso identificado</span>`:''}`:'<strong>desactivado</strong>'} · imágenes: <strong>${manager.images.length}</strong> · adjuntos: <strong>${manager.attachments.length}</strong>${!channelsOk?' · <span style="color:'+COLOR.red+'">seleccione al menos un canal</span>':!subjectOk?' · <span style="color:'+COLOR.red+'">falta asunto de correo</span>':forumCheck.checked&&!req.ok?' · <span style="color:'+COLOR.red+'">falta: '+esc(req.missing.join(', '))+'</span>':' · <span style="color:'+COLOR.green+'">listo</span>'}`;
    send.disabled=!channelsOk||(!pending.length&&!mailPending.length)||(forumCheck.checked&&!req.ok)||!subjectOk;manager.updatePreview();
  }
  ta.addEventListener('input',refresh);security.onchange=refresh;scope.onchange=refresh;pause.onchange=refresh;forumCheck.onchange=refresh;mailCheck.onchange=refresh;mailSubject.addEventListener('input',refresh);
  const addLog=t=>{const d=document.createElement('div');d.textContent=t;log.appendChild(d);log.scrollTop=log.scrollHeight;};
  mailRecipientsBtn.onclick=async()=>{
    if(!mailCheck.checked)return;
    const targets=mailTargetsFromUnits(selected());
    if(!targets.length){mailRecipientsStatus.textContent='No hay aulas con curso identificado.';return;}
    mailRecipientsBtn.disabled=true;mailRecipientsStatus.textContent='Consultando destinatarios...';
    try{
      const data=await previewInternalMailTargets(targets,text=>mailRecipientsStatus.textContent=text);
      mailRecipientsStatus.textContent=data.total+' destinatario(s) encontrados.';
      showInternalMailRecipientPreview(data);
    }catch(error){
      mailRecipientsStatus.textContent='Error: '+error.message;
      addLog('✗ Destinatarios correo: '+error.message);
    }finally{mailRecipientsBtn.disabled=false;}
  };

  test.onclick=async()=>{const u=units.find(x=>x.key===testTarget.value);if(!u)return;if(!confirm(`Se publicará el mensaje de prueba en:\n${u.classroomName} — ${u.name}\n\n¿Continuar?`))return;test.disabled=true;try{const r=await sendMassToUnit(u,tutor,ta.value,manager.images,manager.attachments,{test:true});addLog(`✓ Prueba verificada: ${u.classroomName} — ${u.name}${r.skipped?' (sin duplicar)':''}`);}catch(e){addLog('✗ '+e.message);}test.disabled=false;refresh();};
  send.onclick=async()=>{
    const text=ta.value,scopeUnits=selected(),forumScope=forumCheck.checked?scopeUnits:[],targets=forumScope.filter(u=>!wasSent(text,manager.images,manager.attachments,u)&&!uncertainty(text,manager.images,manager.attachments,u)),req=requirement(text,manager.images,manager.attachments,targets);
    const mailTargets=mailCheck.checked?mailTargetsFromUnits(scopeUnits).filter(t=>!wasInternalMailSent(text,mailSubject.value,t,manager.images,manager.attachments)&&!internalMailUncertain(text,mailSubject.value,t,manager.images,manager.attachments)):[];
    if(!forumCheck.checked&&!mailCheck.checked)return alert('Seleccione al menos un canal: Foros o Correo interno.');
    if(forumCheck.checked&&!req.ok)return alert('No se cumple el nivel de seguridad seleccionado para los foros.');
    if(mailCheck.checked&&!clean(mailSubject.value))return alert('Escriba el asunto del correo interno.');
    if(!targets.length&&!mailTargets.length)return alert('No hay destinos pendientes.');
    const imageNote=mailCheck.checked&&(manager.images.length||manager.attachments.length)?`\nArchivos: ${manager.images.length} imagen(es) y ${manager.attachments.length} adjunto(s); se enviarán también por correo interno.`:'';
    const forumText=forumCheck.checked?(`Foros pendientes: ${targets.length}.`):'Foros: desactivados.';
    const mailText=mailCheck.checked?(`Correo interno: ${mailTargets.length} curso(s), destinatarios Moodle en CCO.`):'Correo interno: desactivado.';
    if(!confirm(`${forumText}\n${mailText}\nAsunto: ${mailCheck.checked?mailSubject.value:'—'}.${imageNote}\n\n¿Continuar?`))return;
    stopping=false;stop.style.display='inline-block';send.disabled=true;
    for(let i=0;i<targets.length;i++){
      if(stopping)break;
      const u=targets[i];addLog(`→ Foro: ${u.classroomName} — ${u.name}`);
      try{const r=await sendMassToUnit(u,tutor,text,manager.images,manager.attachments,{test:false});addLog(r.skipped?'↷ Ya existía / registrado.':'✓ Foro publicado y verificado.');}catch(e){addLog('✗ Foro: '+e.message);}
      if(i<targets.length-1&&!stopping)await sleep(Math.max(1,Math.min(30,Number(pause.value)||3))*1000);
    }
    if(!stopping){
      for(let i=0;i<mailTargets.length;i++){
        if(stopping)break;
        const target=mailTargets[i];addLog(`→ Correo interno: ${target.name} · grupos ${target.groupIds.join(', ')}`);
        try{
          const r=await sendInternalMailCampaign(target,text,mailSubject.value,manager.images,manager.attachments);
          addLog(r.skipped?'↷ Correo ya registrado como enviado.':`✓ Correo enviado por CCO a ${r.recipients} participante(s), ${r.images||0} imagen(es) y ${r.attachments||0} adjunto(s).`);
        }catch(e){addLog('✗ Correo interno: '+e.message);}
        if(i<mailTargets.length-1&&!stopping)await sleep(Math.max(1,Math.min(30,Number(pause.value)||3))*1000);
      }
    }
    stop.style.display='none';refresh();checkInternalMail({silent:true});
  };

  openReview.onclick=()=>{const unit=units.find(u=>u.key===testTarget.value);if(!unit)return;const record=uncertainty(ta.value,manager.images,manager.attachments,unit);window.open(record?.url||unit.url,'_blank','noopener');};
  scan.onclick=function scanExistingForSelected(){
  return (async()=>{
    const text=ta.value,images=manager.images,attachments=manager.attachments,html=renderMessage(text,images,'publish').trim();
    if(!html){alert('Escriba o pegue primero el mensaje cuya publicación desea buscar.');return;}
    const targets=selected().filter(u=>!wasSent(text,images,attachments,u));
    if(!targets.length){addLog('No hay destinos pendientes para revisar.');return;}
    scan.disabled=true;addLog(`Escaneo sin publicaciones: ${targets.length} destinos.`);
    let found=0,unfound=0;
    for(const unit of targets){
      try{
        const groupPage=await fetchPage(unit.url),discussions=discussionUrls(groupPage.doc);
        if(!discussions.length){unfound++;addLog(`— ${unit.classroomName} / ${unit.name}: sin discusión.`);continue;}
        const doc=(await fetchPage(discussions[0])).doc;
        if(await existingMassPost(doc,tutor,html,images,attachments)){
          markSent(text,images,attachments,unit,{url:discussions[0],detected:true,manualScan:true,test:false});
          found++;addLog(`✓ Encontrado en Moodle: ${unit.classroomName} / ${unit.name}. No se repetirá.`);
        }else{unfound++;addLog(`— Sin coincidencia segura: ${unit.classroomName} / ${unit.name}.`);}
      }catch(e){unfound++;addLog(`✗ Error al revisar ${unit.name}: ${e.message}`);}
      await sleep(REQUEST_PAUSE);
    }
    scan.disabled=false;addLog(`Escaneo finalizado: ${found} ya publicados; ${unfound} no confirmados.`);refresh();
  })();
};
  confirmPosted.onclick=()=>{
    const unit=units.find(u=>u.key===testTarget.value),record=unit?uncertainty(ta.value,manager.images,manager.attachments,unit):null;
    if(!unit||!record){alert('Seleccione un destino marcado como pendiente de revisión.');return;}
    const url=record.url||unit.url;
    if(!confirm('Abra y revise en Moodle este destino:\n'+url+'\n\n¿CONFIRMA que el mensaje ya existe y NO debe repetirse?'))return;
    markSent(ta.value,manager.images,manager.attachments,unit,{url,manualConfirmation:true,test:false});
    addLog('✓ Publicación confirmada manualmente: '+unit.classroomName+' / '+unit.name);refresh();
  };
  retry.onclick=()=>{
    const unit=units.find(u=>u.key===testTarget.value),record=unit?uncertainty(ta.value,manager.images,manager.attachments,unit):null;
    if(!unit||!record){alert('Seleccione un destino marcado como pendiente de revisión.');return;}
    if(!confirm('Confirme que revisó Moodle y el mensaje NO está publicado.\n\n¿Autoriza un nuevo intento para '+unit.classroomName+' / '+unit.name+'?'))return;
    clearUncertain(ta.value,manager.images,manager.attachments,unit);
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
  const bar=document.createElement('div'),summary=document.createElement('div'),controls=document.createElement('div'),listView=document.createElement('div'),convView=document.createElement('div'),mailView=document.createElement('div');bar.style.cssText='position:sticky;top:0;background:white;padding:8px 0 12px;border-bottom:1px solid #ccc;z-index:20;';summary.style.cssText='font-weight:bold;line-height:1.5;margin-bottom:7px;';controls.style.cssText='display:flex;gap:7px;flex-wrap:wrap;align-items:center;';convView.style.display='none';mailView.style.display='none';mailView.innerHTML='<p style="margin-top:16px">Correos internos: seleccione esta pestaña y pulse <strong>Actualizar</strong> para revisar manualmente el estado por aula.</p>';
  const listBtn=button('Vista lista',COLOR.blue),convBtn=button('Conversaciones'),mailBtn=button('Correos'),refreshBtn=button('Actualizar',COLOR.purple),massBtn=button('📢 Mensaje masivo',COLOR.orange),configBtn=button('⚙ Foros',COLOR.gray),closeBtn=button('Cerrar');
  const classroomFilter=document.createElement('select'),ageFilter=document.createElement('select'),groupFilter=document.createElement('select'),order=document.createElement('select'),search=document.createElement('input');
  const classroomData=[...new Map(groups.map(g=>[g.classroomUid,{uid:g.classroomUid,name:g.classroomName}])).values()];classroomFilter.innerHTML='<option value="">Todas las aulas</option>'+classroomData.map(a=>`<option value="${esc(a.uid)}">${esc(a.name)}</option>`).join('');ageFilter.innerHTML='<option value="all">Todas las edades</option><option value="overdue">🔴 Más de 48 h</option><option value="priority">🟠 24–48 h</option><option value="recent">🟢 Menos de 24 h</option>';groupFilter.innerHTML='<option value="participation">Grupos con participación</option><option value="pending">Grupos con pendientes</option><option value="answered">Grupos completamente atendidos</option><option value="empty">Grupos sin participación</option><option value="all">Todos los grupos</option>';order.innerHTML='<option value="oldest">Más antiguo pendiente primero</option><option value="newest">Más reciente pendiente primero</option><option value="original">Orden original</option>';search.placeholder='Buscar estudiante o contenido...';search.style.padding='6px';
  controls.append(listBtn,convBtn,mailBtn,refreshBtn,massBtn,configBtn,classroomFilter,ageFilter,groupFilter,order,search,closeBtn);
  bar.append(summary,controls);
  const donationFooter=createDonationBanner(true);
  donationFooter.id='mft-conversation-donation';
  donationFooter.style.cssText+='position:sticky;bottom:0;z-index:15;margin-top:16px;box-shadow:0 -3px 10px rgba(0,0,0,.06);';
  donationFooter.style.display='none';
  ov.append(bar,listView,convView,mailView,donationFooter);
  document.body.appendChild(ov);
  let view='list',mailData=null,mailLoading=false;
  const classroomSummaries=new Map(),groupSummaries=new Map();
  function updateSummary(){
    if(view==='mail'){
      if(mailLoading){summary.textContent='Consultando el correo interno por aula...';return;}
      if(!mailData){summary.textContent='Correos internos · Pulse Actualizar para consultar su estado.';return;}
      const received=mailData.flatMap(c=>c.received||[]),pending=received.filter(m=>!m.answered).length,answered=received.filter(m=>m.answered).length,unread=received.filter(m=>m.unread).length;
      summary.innerHTML=`Correo interno · <span style="color:${COLOR.red}">${pending} pendiente(s)</span> · <span style="color:${COLOR.green}">${answered} contestado(s)</span> · ${unread} no leído(s) · ${mailData.length} aula(s)`;
      return;
    }
    const base=rows.filter(r=>!classroomFilter.value||r.classroomUid===classroomFilter.value),students=base.filter(r=>r.role==='Estudiante'),pending=students.filter(r=>!r.directAnswered),over=pending.filter(p=>sla(p)?.code==='overdue').length,prio=pending.filter(p=>sla(p)?.code==='priority').length,recent=pending.filter(p=>sla(p)?.code==='recent').length;
    summary.innerHTML=`${students.length} mensajes de estudiantes · ${pending.length} pendientes · <span style="color:${COLOR.red}">🔴 >48 h: ${over}</span> · <span style="color:${COLOR.orange}">🟠 24–48 h: ${prio}</span> · <span style="color:${COLOR.green}">🟢 <24 h: ${recent}</span>`;
  }
  function ageMatch(p){if(ageFilter.value==='all')return true;return sla(p)?.code===ageFilter.value;}
  function postActions(post,onSuccess){const box=document.createElement('div');box.style.cssText='display:flex;gap:5px;flex-wrap:wrap;align-items:flex-start;';if(post.link)box.appendChild(linkButton('Abrir',post.link));const at=attachmentsUi(post);if(at)box.appendChild(at);if(post.role==='Estudiante'&&!post.directAnswered&&post.replyUrl){const b=button('Responder directamente',COLOR.green);b.onclick=()=>directReplyModal(post,tutor,reply=>{reply.classroomUid=post.classroomUid;reply.classroomName=post.classroomName;reply.forumId=post.forumId;reply.unitKey=post.unitKey;reply.group=post.group;reply.groupId=post.groupId;if(!rows.some(item=>item.discussionUrl===reply.discussionUrl&&String(item.postId)===String(reply.postId))){rows.push(reply);const d=groups.flatMap(g=>g.discussions).find(x=>x.url===post.discussionUrl);if(d)d.posts.push(reply);}b.remove();onSuccess(reply);});box.appendChild(b);}return box;}
  function renderList(){listView.innerHTML='';const table=document.createElement('table');table.style.cssText='width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;';table.innerHTML='<thead><tr><th>Aula</th><th>Grupo</th><th>Autor</th><th>Fecha</th><th>Mensaje</th><th>Estado</th><th>48 h</th><th>Acciones</th></tr></thead><tbody></tbody>';for(const th of table.querySelectorAll('th'))th.style.cssText='border:1px solid #ccc;padding:7px;background:#f5f5f5;';const tbody=table.querySelector('tbody'),q=norm(search.value);let data=rows.filter(r=>(!classroomFilter.value||r.classroomUid===classroomFilter.value)&&(!q||norm([r.classroomName,r.group,r.author,r.content].join(' ')).includes(q)));if(ageFilter.value!=='all')data=data.filter(ageMatch).sort((a,b)=>(Number(a.dateTimestamp)||Infinity)-(Number(b.dateTimestamp)||Infinity));for(const r of data){const tr=document.createElement('tr');for(let i=0;i<8;i++){const td=document.createElement('td');td.style.cssText='border:1px solid #ddd;padding:7px;vertical-align:top;white-space:pre-wrap;';tr.appendChild(td);}const c=tr.children,age=postAge(r),s=sla(r);c[0].textContent=r.classroomName;c[1].textContent=r.group;c[2].textContent=r.author||'—';c[3].textContent=formatDate(r.dateTimestamp,r.dateRaw)+(age===null?'':`\nhace ${shortDuration(age)}`);c[4].textContent=r.content;c[5].textContent=answerState(r);c[6].textContent=s?`${s.icon} ${s.text}`:(r.directAnswered?'✅ Atendido':'—');if(s)c[6].style.color=s.color;c[7].appendChild(postActions(r,reply=>{
  const previousScroll=ov.scrollTop;
  c[5].textContent=answerState(r);
  c[6].textContent='✅ Atendido';
  c[6].style.color=COLOR.green;
  tr.style.background='#eaf7ee';
  if(reply){
    const responseRow=document.createElement('tr');
    responseRow.style.background='#e8f4fd';
    const values=[reply.classroomName,reply.group,reply.author||'Tutor',
      formatDate(reply.dateTimestamp,reply.dateRaw),reply.content,'Intervención del tutor','—'];
    for(let k=0;k<8;k++){
      const td=document.createElement('td');
      td.style.cssText='border:1px solid #ddd;padding:7px;vertical-align:top;white-space:pre-wrap;';
      if(k<7)td.textContent=values[k];
      else td.appendChild(postActions(reply,()=>{}));
      responseRow.appendChild(td);
    }
    tr.parentNode?.insertBefore(responseRow,tr.nextSibling);
  }
  updateSummary();
  ov.scrollTop=previousScroll;
}));tbody.appendChild(tr);}listView.appendChild(table);}
  function groupOldest(g){return oldestPending(g.discussions.flatMap(d=>d.posts));}
  function refreshConversationCounters(){
  // Update counters without removing a group from the currently displayed result.
  for(const {a,heading} of classroomSummaries.values()){
    const posts=a.groups.flatMap(g=>g.discussions).flatMap(d=>d.posts);
    const oldest=oldestPending(posts),state=oldest?sla(oldest):null;
    heading.textContent=`${a.name} — ${a.groups.length} grupo(s)${oldest
      ?` — ${state?.icon||''} más antiguo ${shortDuration(postAge(oldest)||0)}`:''}`;
  }
  for(const {group,heading} of groupSummaries.values()){
    const posts=group.discussions.flatMap(d=>d.posts);
    const students=posts.filter(p=>p.role==='Estudiante');
    const pending=students.filter(p=>!p.directAnswered);
    const oldest=oldestPending(posts),state=oldest?sla(oldest):null;
    heading.style.color=state?.color||(students.length?COLOR.green:'#555');
    heading.textContent=`${group.name} — ${students.length} mensajes — ${pending.length} pendientes${oldest
      ?` — ${state?.icon||''} más antiguo ${shortDuration(postAge(oldest)||0)}`:''}`;
  }
}

  function groupMatches(g){const posts=g.discussions.flatMap(d=>d.posts),students=posts.filter(p=>p.role==='Estudiante'),pending=students.filter(p=>!p.directAnswered),q=norm(search.value);if(classroomFilter.value&&g.classroomUid!==classroomFilter.value)return false;if(groupFilter.value==='participation'&&!students.length)return false;if(groupFilter.value==='pending'&&!pending.length)return false;if(groupFilter.value==='answered'&&!(students.length&&!pending.length))return false;if(groupFilter.value==='empty'&&students.length)return false;if(ageFilter.value!=='all'&&!pending.some(ageMatch))return false;if(q&&!norm([g.classroomName,g.name,...posts.map(p=>p.author+' '+p.content)].join(' ')).includes(q))return false;return true;}
  function renderNode(node,depth=0,seen=new Set()){
  const post=node.post,id=String(post.postId);
  if(seen.has(id)){
    const warning=document.createElement('div');
    warning.textContent='⚠ Ciclo omitido';
    return warning;
  }
  const ancestors=new Set(seen);
  ancestors.add(id);
  const wrap=document.createElement('div');
  wrap.style.cssText=`margin-top:8px;margin-left:${depth?24:0}px;padding-left:${depth?10:0}px;border-left:${depth?'3px solid #ccc':'none'};`;
  const card=document.createElement('div');
  card.style.cssText=`border:1px solid #ccc;border-radius:6px;padding:10px;background:${post.role==='Tutor'?'#e8f4fd':(post.directAnswered?'#eaf7ee':'white')};`;
  const state=sla(post),age=postAge(post);
  card.innerHTML=`<div><strong>${esc(post.author)} · ${esc(post.role)}</strong><span data-mft-answer-state style="float:right;font-size:12px">${esc(answerState(post))}</span></div><div style="font-size:11px;color:#777;margin-top:3px">${esc(formatDate(post.dateTimestamp,post.dateRaw))}${age===null?'':` · hace ${esc(shortDuration(age))}`}</div>${state?`<div data-mft-sla style="font-size:12px;font-weight:bold;color:${state.color};margin-top:5px">${state.icon} ${esc(state.text)}</div>`:''}<div style="margin-top:8px;white-space:pre-wrap;line-height:1.4">${esc(post.content)}</div>`;
  const actions=postActions(post,reply=>{
    const previousScroll=ov.scrollTop;
    card.style.background='#eaf7ee';
    const badge=card.querySelector('[data-mft-answer-state]');
    if(badge)badge.textContent=answerState(post);
    card.querySelector('[data-mft-sla]')?.remove();
    if(reply){
      const replyCard=renderNode({post:reply,children:[]},depth+1,ancestors);
      wrap.insertBefore(replyCard,wrap.children[1]||null);
    }
    updateSummary();
    refreshConversationCounters();
    ov.scrollTop=previousScroll;
  });
  card.appendChild(actions);
  wrap.appendChild(card);
  for(const child of node.children)wrap.appendChild(renderNode(child,depth+1,ancestors));
  return wrap;
}
  function renderConversations(){convView.innerHTML='';classroomSummaries.clear();groupSummaries.clear();let gs=groups.filter(groupMatches);if(order.value!=='original')gs=[...gs].sort((a,b)=>{const aa=groupOldest(a),bb=groupOldest(b),ta=validTimestamp(aa?.dateTimestamp)?Number(aa.dateTimestamp):NaN,tb=validTimestamp(bb?.dateTimestamp)?Number(bb.dateTimestamp):NaN;if(!Number.isFinite(ta))return 1;if(!Number.isFinite(tb))return -1;return order.value==='oldest'?ta-tb:tb-ta;});const byClass=new Map();for(const g of gs){if(!byClass.has(g.classroomUid))byClass.set(g.classroomUid,{name:g.classroomName,groups:[]});byClass.get(g.classroomUid).groups.push(g);}for(const [uid,a] of byClass){const ad=document.createElement('details');ad.open=true;const as=document.createElement('summary');as.style.fontWeight='bold';const ap=a.groups.flatMap(g=>g.discussions).flatMap(d=>d.posts),ao=oldestPending(ap),ss=ao?sla(ao):null;as.textContent=`${a.name} — ${a.groups.length} grupo(s)${ao?` — ${ss?.icon||''} más antiguo ${shortDuration(postAge(ao)||0)}`:''}`;ad.appendChild(as);classroomSummaries.set(uid,{a,heading:as});for(const g of a.groups){const gd=document.createElement('details');gd.open=groupFilter.value==='pending';const gsumm=document.createElement('summary'),posts=g.discussions.flatMap(d=>d.posts),students=posts.filter(p=>p.role==='Estudiante'),pending=students.filter(p=>!p.directAnswered),old=oldestPending(posts),state=old?sla(old):null;gsumm.style.cssText=`font-weight:bold;color:${state?.color||(students.length?COLOR.green:'#555')};`;gsumm.textContent=`${g.name} — ${students.length} mensajes — ${pending.length} pendientes${old?` — ${state?.icon||''} más antiguo ${shortDuration(postAge(old)||0)}`:''}`;gd.appendChild(gsumm);groupSummaries.set(g.key,{group:g,heading:gsumm});for(const d of g.discussions){const dd=document.createElement('details');dd.open=true;const ds=document.createElement('summary');ds.textContent=d.title||'Discusión';ds.style.fontWeight='bold';dd.appendChild(ds);for(const root of conversationTree(d.posts))dd.appendChild(renderNode(root));gd.appendChild(dd);}ad.appendChild(gd);}convView.appendChild(ad);}if(!gs.length){const n=document.createElement('p');n.textContent='No hay grupos que cumplan los filtros.';convView.appendChild(n);}}
  function apply(){
    const list=view==='list',conv=view==='conv',mail=view==='mail';
    listView.style.display=list?'block':'none';convView.style.display=conv?'block':'none';mailView.style.display=mail?'block':'none';
    donationFooter.style.display=conv?'flex':'none';
    classroomFilter.style.display=mail?'none':'inline-block';
    ageFilter.style.display=mail?'none':'inline-block';
    groupFilter.style.display=conv?'inline-block':'none';
    order.style.display=conv?'inline-block':'none';
    search.style.display=mail?'none':'inline-block';
    updateSummary();
    if(list)renderList();else if(conv)renderConversations();
  }
  async function refreshMailReview(){
    if(mailLoading)return;
    mailLoading=true;refreshBtn.disabled=true;updateSummary();
    mailView.innerHTML='<p>Consultando el correo interno. Esta revisión se ejecuta únicamente cuando usted pulsa Actualizar.</p>';
    try{
      mailData=await fetchInternalMailReview(groups,text=>{summary.textContent=text;});
      renderMailReview(mailView,mailData);
      await checkInternalMail({silent:true});
    }catch(error){
      mailView.innerHTML='';
      const p=document.createElement('p');p.textContent='No fue posible revisar el correo interno: '+error.message;p.style.color=COLOR.red;mailView.appendChild(p);
    }finally{
      mailLoading=false;refreshBtn.disabled=false;updateSummary();
    }
  }
  listBtn.onclick=()=>{view='list';apply();};convBtn.onclick=()=>{view='conv';apply();};mailBtn.onclick=()=>{view='mail';apply();};refreshBtn.onclick=async()=>{if(view==='mail')await refreshMailReview();else{ov.remove();await consolidate();}};massBtn.onclick=massModal;configBtn.onclick=showClassroomConfig;closeBtn.onclick=()=>ov.remove();for(const e of [classroomFilter,ageFilter,groupFilter,order,search])e.addEventListener(e===search?'input':'change',apply);apply();
}

/* ========================= Consolidation ========================= */

async function consolidate(){
  const btn=document.getElementById('mft-consolidate'),status=document.getElementById('mft-status');if(!btn||btn.disabled)return;const classrooms=activeClassrooms();if(!classrooms.length){showClassroomConfig();return;}btn.disabled=true;const old=btn.textContent;btn.textContent='Procesando...';
  try{const {units,errors}=await allUnits(classrooms,t=>status.textContent=t);if(!units.length)throw new Error('No se detectaron grupos/foros utilizables.');const tutor=tutorIdentity(),rows=[],groups=[];
    for(let i=0;i<units.length;i++){const u=units[i];status.textContent=`${i+1}/${units.length}: ${u.classroomName} — ${u.name}`;const page=await fetchPage(u.url),durls=discussionUrls(page.doc),group={...u,discussions:[]};const start=rows.length;for(let j=0;j<durls.length;j++){const durl=durls[j],dpage=await fetchPage(durl),posts=parseDiscussion(dpage.doc,u,durl,tutor);rows.push(...posts);group.discussions.push({url:durl,title:posts[0]?.subject||`Discusión ${j+1}`,posts});await sleep(REQUEST_PAUSE);}if(!rows.slice(start).some(p=>p.role==='Estudiante'))rows.push({classroomUid:u.classroomUid,classroomName:u.classroomName,forumId:u.forumId,unitKey:u.key,group:u.name,groupId:u.id,role:'',status:'Sin respuestas de estudiantes',author:'',authorId:'',dateRaw:'',dateTimestamp:null,subject:'',content:'No hay respuestas registradas por estudiantes en este destino.',attachments:[],profile:'',link:u.url,replyUrl:'',discussionUrl:'',postId:'',parentPostId:'',parentSource:'',directAnswered:false,tutorInBranch:false});groups.push(group);}
    const students=rows.filter(p=>p.role==='Estudiante'),pending=students.filter(p=>!p.directAnswered),over=pending.filter(p=>sla(p)?.code==='overdue').length;status.textContent=`Finalizado: ${units.length} destino(s), ${students.length} mensajes, ${pending.length} pendientes, ${over} con más de 48 h.${errors.length?` ${errors.length} aula(s) con error.`:''}`;showResults(rows,groups);
  }catch(e){console.error(e);status.textContent='Error: '+e.message;alert(e.message);}finally{btn.disabled=false;btn.textContent=old;}
}


/* ========================= Assignment shortcuts ========================= */

const GRADING_REGISTRY_KEY='mft_shared_grading_registry_v1';

function normalizeGradingUrl(input){
  let u;try{u=new URL(String(input||'').trim(),location.href);}catch{throw new Error('Introduzca una URL válida de la tarea.');}
  if(u.origin!==location.origin)throw new Error('La tarea debe pertenecer a la instalación Moodle actual.');
  if(!/\/mod\/assign\/view\.php$/i.test(u.pathname))throw new Error('La URL debe corresponder a mod/assign/view.php.');
  const id=u.searchParams.get('id');if(!/^\d+$/.test(id||''))throw new Error('La URL debe incluir id=.');
  const cleanUrl=new URL(u.origin+u.pathname);cleanUrl.searchParams.set('id',id);cleanUrl.searchParams.set('action','grading');return cleanUrl.href;
}
function gradingTargetUid(url){return 'assign_'+hash(url);}
function gradingCourseLink(doc=document,baseUrl=location.href){
  const selectors=[
    '[data-key="coursehome"] a[href*="/course/view.php"]',
    'nav[aria-label*="breadcrumb" i] a[href*="/course/view.php"]',
    '.breadcrumb a[href*="/course/view.php"]'
  ];
  for(const selector of selectors){
    const a=doc.querySelector(selector);if(!a)continue;
    try{return {url:new URL(a.getAttribute('href'),baseUrl).href,name:clean(a.textContent||'')};}catch{}
  }
  return null;
}
function gradingCourseName(doc=document,courseId='',baseUrl=location.href){
  const link=gradingCourseLink(doc,baseUrl),name=clean(link?.name||'');
  if(name&&!/^(inicio|home|curso|course)$/i.test(name))return name;
  if(/\/course\/view\.php$/i.test(new URL(baseUrl,location.href).pathname)){
    const h=clean(doc.querySelector('h1')?.textContent||'');if(h)return h;
  }
  return courseId?('Aula '+courseId):'Aula';
}
function readGradingTargets(){
  try{
    const store=GM_getValue(GRADING_REGISTRY_KEY,{});
    const list=Array.isArray(store?.[location.origin])?store[location.origin]:[];
    return list.map(x=>{try{const url=normalizeGradingUrl(x.url),courseId=String(x.courseId||'');return{uid:gradingTargetUid(url),name:clean(x.name)||'Actividad '+new URL(url).searchParams.get('id'),url,active:x.active!==false,courseId,courseName:clean(x.courseName)||gradingCourseName(document,courseId)};}catch{return null;}}).filter(Boolean);
  }catch{return[];}
}
function saveGradingTargets(items){
  const store=(()=>{try{return GM_getValue(GRADING_REGISTRY_KEY,{})||{};}catch{return{};}})(),seen=new Set(),cleanItems=[];
  for(const item of items||[]){try{const url=normalizeGradingUrl(item.url);if(seen.has(url))continue;seen.add(url);cleanItems.push({uid:gradingTargetUid(url),name:clean(item.name)||'Actividad '+new URL(url).searchParams.get('id'),url,active:item.active!==false,courseId:String(item.courseId||''),courseName:clean(item.courseName)||gradingCourseName(document,String(item.courseId||''))});}catch{}}
  store[location.origin]=cleanItems;GM_setValue(GRADING_REGISTRY_KEY,store);
}
function discoverAssignments(doc=document,baseUrl=location.href,courseMeta=null){
  let courseId=String(courseMeta?.courseId||''),courseName=clean(courseMeta?.courseName||'');
  if(!courseId){
    const courseLink=gradingCourseLink(doc,baseUrl);
    try{courseId=courseLink?new URL(courseLink.url).searchParams.get('id')||'':'';}catch{}
    if(!courseId&&/\/course\/view\.php$/i.test(new URL(baseUrl,location.href).pathname))courseId=new URL(baseUrl,location.href).searchParams.get('id')||'';
    if(!courseId)courseId=courseIdFromDocument(doc)||'';
  }
  if(!courseName)courseName=gradingCourseName(doc,courseId,baseUrl);
  const seen=new Set(),items=[];
  for(const a of doc.querySelectorAll('a[href*="/mod/assign/view.php"]')){
    try{
      const absolute=new URL(a.getAttribute('href'),baseUrl).href,url=normalizeGradingUrl(absolute);if(seen.has(url))continue;seen.add(url);
      const name=clean(a.querySelector('.instancename')?.textContent||a.textContent)||'Actividad '+new URL(url).searchParams.get('id');
      items.push({url,name,courseId:String(courseId),courseName});
    }catch{}
  }
  return items;
}

async function discoverAssignmentsFromConfiguredAulas(onStatus=()=>{}){
  const classrooms=activeClassrooms(),courses=new Map(),items=[];
  for(let i=0;i<classrooms.length;i++){
    const classroom=classrooms[i];
    try{
      onStatus('Localizando aula '+(i+1)+'/'+classrooms.length+': '+classroom.name);
      const forumPage=await fetchPage(classroom.url),courseLink=gradingCourseLink(forumPage.doc,forumPage.finalUrl);
      if(!courseLink)continue;
      const courseUrl=new URL(courseLink.url),courseId=courseUrl.searchParams.get('id')||'';
      if(!/^\d+$/.test(courseId)||courses.has(courseId))continue;
      const courseName=clean(classroom.name)||clean(courseLink.name)||('Aula '+courseId);
      courses.set(courseId,{courseId,courseName,url:courseUrl.href});
      const coursePage=await fetchPage(courseUrl.href);
      items.push(...discoverAssignments(coursePage.doc,coursePage.finalUrl,{courseId,courseName}));
      await sleep(REQUEST_PAUSE);
    }catch(error){console.warn('MFT grading discovery',classroom.name,error);}
  }
  return {courses:[...courses.values()],items:[...new Map(items.map(x=>[x.url,x])).values()]};
}
function ensureCurrentGradingTarget(){
  if(!/\/mod\/assign\/view\.php$/i.test(location.pathname))return;
  try{
    const url=normalizeGradingUrl(location.href),list=readGradingTargets();
    if(list.some(x=>x.url===url))return;
    const name=clean(document.querySelector('h1')?.textContent||document.title)||'Actividad '+new URL(url).searchParams.get('id');
    const courseId=courseIdFromDocument(document);list.push({url,name,active:true,courseId,courseName:gradingCourseName(document,String(courseId||''))});saveGradingTargets(list);
  }catch{}
}
function showGradingShortcuts(){
  document.getElementById('mft-grading-shortcuts')?.remove();
  const ov=document.createElement('div');ov.id='mft-grading-shortcuts';ov.style.cssText='position:fixed;inset:0;z-index:270000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif;';
  const box=document.createElement('div');box.style.cssText='width:min(980px,96vw);max-height:92vh;overflow:auto;background:white;border-radius:10px;padding:18px;color:#222;';
  box.innerHTML='<h2 style="margin-top:0">📝 Calificaciones</h2><p style="font-size:13px;color:#555">Las calificaciones se configuran por actividad. Puede detectar tareas de la página actual o buscar automáticamente las tareas de todas las aulas que ya tiene configuradas para los foros.</p>';
  const summary=document.createElement('div');summary.style.cssText='font-size:12px;padding:8px 10px;background:#f5f7fa;border:1px solid #dde3ea;border-radius:6px;margin-bottom:10px;';
  const scan=button('Buscar tareas en aulas configuradas',COLOR.purple),scanStatus=document.createElement('span');
  scanStatus.style.cssText='font-size:12px;color:#555;margin-left:8px;';
  const list=document.createElement('div'),detected=document.createElement('div'),remote=document.createElement('div');
  let remoteItems=[],remoteCourses=[];

  function addItem(item){
    const arr=readGradingTargets();
    if(arr.some(x=>x.url===item.url))return;
    arr.push({...item,active:true});saveGradingTargets(arr);render();
  }

  function renderCandidate(container,item,known){
    const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:minmax(150px,220px) 1fr auto;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #eee;';
    const course=document.createElement('span');course.textContent=item.courseName||('Aula '+item.courseId);course.style.cssText='font-size:12px;color:#555;font-weight:600;';
    const label=document.createElement('span');label.textContent=item.name;
    const add=button(known.has(item.url)?'Configurada':'Añadir',known.has(item.url)?COLOR.gray:COLOR.green);add.disabled=known.has(item.url);
    add.onclick=()=>addItem(item);
    row.append(course,label,add);container.appendChild(row);
  }

  function render(){
    const current=readGradingTargets(),known=new Set(current.map(x=>x.url)),configuredCourses=new Set(current.filter(x=>x.active&&x.courseId).map(x=>x.courseId));
    summary.innerHTML='<strong>'+current.filter(x=>x.active).length+'</strong> actividad(es) activa(s) · <strong>'+configuredCourses.size+'</strong> aula(s) con calificaciones configuradas · <strong>'+activeClassrooms().length+'</strong> aula(s)/foro(s) activos en Foros.';
    if(activeClassrooms().length>configuredCourses.size){
      summary.innerHTML+=' <span style="color:'+COLOR.orange+'">Puede faltar al menos un aula de calificaciones. Use “Buscar tareas en aulas configuradas”.</span>';
    }

    list.innerHTML='<h3>Actividades configuradas</h3>';
    if(!current.length){const p=document.createElement('p');p.textContent='Todavía no hay actividades configuradas.';list.appendChild(p);}
    for(const item of current){
      const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:auto minmax(150px,220px) 1fr auto auto;gap:7px;align-items:center;padding:7px 0;border-bottom:1px solid #eee;';
      const active=document.createElement('input');active.type='checkbox';active.checked=item.active;
      const course=document.createElement('span');course.textContent=item.courseName||('Aula '+item.courseId);course.style.cssText='font-size:12px;color:#555;font-weight:600;';
      const name=document.createElement('input');name.value=item.name;name.style.cssText='padding:6px;min-width:0;';
      const open=button('Abrir',COLOR.blue),del=button('Quitar',COLOR.red);
      active.onchange=()=>{const arr=readGradingTargets(),x=arr.find(v=>v.uid===item.uid);if(x){x.active=active.checked;saveGradingTargets(arr);render();}};
      name.onchange=()=>{const arr=readGradingTargets(),x=arr.find(v=>v.uid===item.uid);if(x){x.name=clean(name.value)||x.name;saveGradingTargets(arr);}};
      open.onclick=()=>window.open(item.url,'_blank','noopener');
      del.onclick=()=>{saveGradingTargets(readGradingTargets().filter(x=>x.uid!==item.uid));render();};
      row.append(active,course,name,open,del);list.appendChild(row);
    }

    detected.innerHTML='<h3>Detectadas en esta página</h3>';
    const found=discoverAssignments(document);
    if(!found.length){const p=document.createElement('p');p.textContent='No se detectaron tareas en esta página.';detected.appendChild(p);}
    for(const item of found)renderCandidate(detected,item,known);

    remote.innerHTML='<h3>Detectadas en las aulas configuradas para Foros</h3>';
    if(!remoteItems.length){
      const p=document.createElement('p');p.style.color='#666';p.textContent=remoteCourses.length?'No se encontraron tareas adicionales.':'Pulse “Buscar tareas en aulas configuradas” para revisar las otras aulas sin tener que abrirlas una por una.';remote.appendChild(p);
    }else{
      for(const item of remoteItems)renderCandidate(remote,item,known);
    }
  }

  scan.onclick=async()=>{
    scan.disabled=true;scanStatus.textContent='Buscando...';
    try{
      const result=await discoverAssignmentsFromConfiguredAulas(text=>scanStatus.textContent=text);
      remoteItems=result.items;remoteCourses=result.courses;
      scanStatus.textContent='Encontradas '+remoteItems.length+' tarea(s) en '+remoteCourses.length+' aula(s).';
      render();
    }catch(error){scanStatus.textContent='Error: '+error.message;}
    finally{scan.disabled=false;}
  };
  const close=button('Cerrar');close.onclick=()=>ov.remove();
  const scanRow=document.createElement('div');scanRow.style.cssText='display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px;';scanRow.append(scan,scanStatus);
  box.append(summary,scanRow,list,detected,remote,close);ov.appendChild(box);document.body.appendChild(ov);render();
}

/* ========================= Assignment grading assistant ========================= */

const GRADING_KEYS = {criterionRemark:'mft_grading_criterion_remark',recoveryDate:'mft_grading_recovery_date',includeRecovery:'mft_grading_include_recovery',tutorName:'mft_grading_tutor_name'};

function gradingOverviewRoute(){
  return /\/mod\/assign\/view\.php$/i.test(location.pathname) &&
    new URL(location.href).searchParams.get('action')==='grading';
}

function assignmentCmid(){
  try{return new URL(location.href).searchParams.get('id')||'';}catch{return '';}
}

function gradingFilterValue(value){
  return ({all:'',notsubmitted:'notsubmitted',submitted:'submitted',requiregrading:'requiregrading',graded:'graded'})[value]??'';
}

function gradingGroupOptions(doc){
  const selector=doc.querySelector('.groupselector select[name="group"],select#selectgroup,select[name="group"]')||groupSelector(doc);
  if(!selector)return [{id:'0',name:'Grupo único'}];
  const groups=[...selector.options]
    .filter(o=>!o.disabled&&/^\d+$/.test(String(o.value||''))&&String(o.value)!=='0')
    .map(o=>({id:String(o.value),name:clean(o.textContent)||('Grupo '+o.value)}));
  return groups.length?groups:[{id:'0',name:clean(selector.selectedOptions?.[0]?.textContent)||'Grupo único'}];
}

function gradingTableUrlForTarget(target,filter='all',page=0,groupId='0'){
  const url=new URL(target.url,location.href);
  url.searchParams.set('action','grading');
  url.searchParams.set('status',gradingFilterValue(filter));
  url.searchParams.set('page',String(page));
  url.searchParams.set('group',String(groupId||'0'));
  for(const key of ['userid','blindid','rownum'])url.searchParams.delete(key);
  return url.href;
}

function parseGradingOverview(doc){
  const table=doc.querySelector('table#submissions,#submissions');
  if(!table)return [];
  const rows=[];
  for(const tr of table.querySelectorAll('tbody tr')){
    const classText=tr.className||'',classMatch=String(classText).match(/(?:^|\s)user(\d+)(?:\s|$)/);
    const graderLink=[...tr.querySelectorAll('a[href]')].find(a=>{
      try{return new URL(a.getAttribute('href'),location.href).searchParams.get('action')==='grader';}catch{return false;}
    });
    let graderUrl=graderLink?absoluteUrl(graderLink.getAttribute('href'),location.href):'';
    let userId=classMatch?.[1]||'';
    if(graderUrl&&!userId){try{userId=new URL(graderUrl).searchParams.get('userid')||'';}catch{}}
    const profile=[...tr.querySelectorAll('a[href*="/user/"]')].find(a=>clean(a.textContent));
    const fullname=clean(tr.querySelector('.fullname,[data-column="fullname"]')?.textContent||profile?.textContent||'');
    if(!fullname&&!graderUrl&&!userId)continue;
    if(!graderUrl&&userId){
      const u=new URL(location.href);u.searchParams.set('action','grader');u.searchParams.set('userid',userId);u.searchParams.set('rownum','0');graderUrl=u.href;
    }
    const statusCell=tr.querySelector('td.status,[data-column="status"]');
    const statusText=clean(statusCell?.textContent||tr.querySelector('.submissioninfo')?.textContent||'');
    const gradeCell=tr.querySelector('td.grade,[data-column="grade"]');
    const gradeDisplay=gradeCell?.querySelector('.w-100')||gradeCell?.querySelector('.grade');
    const gradeText=clean(gradeDisplay?.textContent||(!gradeCell?.querySelector('a[href*="action=grader"]')?gradeCell?.textContent:'')||'');
    const submittedClass=!!tr.querySelector('.submissionstatussubmitted');
    const noSubmissionClass=!!tr.querySelector('.submissionstatusnew');
    const noSubmissionText=/no se ha enviado|sin entrega|no entregado|not submitted|no submission/i.test(statusText);
    const submitted=submittedClass||(!noSubmissionClass&&!noSubmissionText&&/enviado para calificar|submitted for grading|submitted/i.test(statusText));
    const draft=!!tr.querySelector('.submissionstatusdraft')||/borrador|draft/i.test(statusText);
    const explicitUngraded=/sin calificar|no calificado|not graded|ungraded/i.test(statusText+' '+gradeText);
    const gradedMarker=!!tr.querySelector('.submissiongraded');
    const needsMarker=!!tr.querySelector('.gradingreminder');
    const gradedText=!explicitUngraded&&/(^|\s)calificado(?:\s|$)|(^|\s)graded(?:\s|$)/i.test(statusText);
    const numericGradeFallback=!explicitUngraded&&!needsMarker&&!!gradeText&&!/^[-—]$/.test(gradeText)&&!/sin calificar|not graded/i.test(gradeText);
    const graded=!needsMarker&&(gradedMarker||gradedText||numericGradeFallback);
    const requiresGrading=needsMarker||!graded;
    rows.push({
      userId,fullname:fullname||(`Usuario ${userId||''}`.trim()),graderUrl,
      statusText:statusText||(!submitted?'Sin entrega':'Entrega registrada'),
      gradeText:gradeText||'—',submitted,draft,graded,requiresGrading,
      notSubmitted:!submitted
    });
  }
  return rows;
}

function gradingMaxPage(doc){
  let max=0;
  for(const a of doc.querySelectorAll('a[href*="page="]')){
    try{
      const u=new URL(a.getAttribute('href'),location.href),p=Number(u.searchParams.get('page'));
      if(Number.isInteger(p)&&p>max)max=p;
    }catch{}
  }
  return max;
}

async function resolveGradingTargetCourse(target,onStatus=()=>{}){
  try{
    onStatus('Identificando aula de '+target.name+'...');
    const page=await fetchPage(gradingTableUrlForTarget(target,'all',0,'0'));
    const courseLink=gradingCourseLink(page.doc,page.finalUrl);
    let courseId='';
    try{courseId=courseLink?new URL(courseLink.url).searchParams.get('id')||'':'';}catch{}
    if(!courseId)courseId=courseIdFromDocument(page.doc);
    if(/^\d+$/.test(courseId||''))target.courseId=String(courseId);
    const classrooms=activeClassrooms();
    for(const classroom of classrooms){
      try{
        const forumPage=await fetchPage(classroom.url),forumCourseLink=gradingCourseLink(forumPage.doc,forumPage.finalUrl);
        let forumCourseId='';
        try{forumCourseId=forumCourseLink?new URL(forumCourseLink.url).searchParams.get('id')||'':'';}catch{}
        if(!forumCourseId)forumCourseId=courseIdFromDocument(forumPage.doc);
        if(target.courseId&&String(forumCourseId)===String(target.courseId)){
          target.courseName=clean(classroom.name)||clean(courseLink?.name)||target.courseName||('Aula '+target.courseId);
          break;
        }
      }catch{}
    }
    if(!clean(target.courseName)||/^english\s*\(en\)$/i.test(clean(target.courseName))){
      target.courseName=clean(courseLink?.name)||('Aula '+(target.courseId||''));
    }
    return target;
  }catch(error){
    console.warn('MFT grading target course',target.name,error);
    return target;
  }
}

async function gradingGroupsFromConfiguredForums(target,onStatus=()=>{}){
  const groups=new Map(),classrooms=activeClassrooms();
  let matchedCourse=false,matchedSingleGroup=false;
  for(let i=0;i<classrooms.length;i++){
    const classroom=classrooms[i];
    try{
      onStatus('Buscando grupos del aula: '+classroom.name+' ('+(i+1)+'/'+classrooms.length+')');
      const page=await fetchPage(classroom.url),courseLink=gradingCourseLink(page.doc,page.finalUrl);
      let courseId='';
      try{courseId=courseLink?new URL(courseLink.url).searchParams.get('id')||'':'';}catch{}
      if(!courseId)courseId=courseIdFromDocument(page.doc);
      if(!target.courseId||!courseId||String(target.courseId)!==String(courseId))continue;
      matchedCourse=true;
      if(clean(classroom.name))target.courseName=clean(classroom.name);
      const selector=groupSelector(page.doc);
      if(!selector){
        matchedSingleGroup=true;
        continue;
      }
      let foundNamedGroups=0;
      for(const opt of [...selector.options]){
        const id=String(opt.value||''),name=clean(opt.textContent);
        if(!/^\d+$/.test(id)||id==='0'||/todos|all participants|all groups|todos los participantes/i.test(name))continue;
        foundNamedGroups++;
        if(!groups.has(id))groups.set(id,{id,name:name||('Grupo '+id),source:'foro'});
      }
      if(!foundNamedGroups)matchedSingleGroup=true;
    }catch(error){console.warn('MFT grading forum groups',classroom.name,error);}
  }
  if(matchedCourse&&!groups.size&&matchedSingleGroup){
    groups.set('0',{id:'0',name:'Grupo único',source:'foro-unico'});
  }
  return [...groups.values()];
}

async function gradingUnitsForTarget(target,onStatus=()=>{}){
  onStatus('Detectando grupos: '+target.courseName+' — '+target.name);
  let groups=await gradingGroupsFromConfiguredForums(target,onStatus);
  if(!groups.length){
    const page=await fetchPage(gradingTableUrlForTarget(target,'all',0,'0'));
    groups=gradingGroupOptions(page.doc).map(group=>({...group,source:'calificaciones'}));
  }
  onStatus(target.courseName+' — '+target.name+': '+groups.length+' grupo(s) detectado(s)');
  return groups.map(group=>({
    key:target.uid+'::'+group.id,
    targetUid:target.uid,
    courseId:target.courseId,
    courseName:target.courseName||('Aula '+target.courseId),
    activityName:target.name,
    activityUrl:target.url,
    groupId:group.id,
    groupName:group.name,
    groupSource:group.source||'calificaciones'
  }));
}

async function loadGradingUnit(target,unit,filter='all',onStatus=()=>{}){
  const first=await fetchPage(gradingTableUrlForTarget(target,filter,0,unit.groupId));
  let rows=parseGradingOverview(first.doc),max=gradingMaxPage(first.doc);
  for(let page=1;page<=max;page++){
    onStatus(target.courseName+' — '+target.name+' — '+unit.groupName+' · página '+(page+1)+'/'+(max+1));
    try{
      const next=await fetchPage(gradingTableUrlForTarget(target,filter,page,unit.groupId));
      rows.push(...parseGradingOverview(next.doc));
    }catch(error){console.warn('MFT grading page',page,error);}
    await sleep(80);
  }
  return [...new Map(rows.map(row=>[(row.userId||row.graderUrl),row])).values()].map(row=>{
    let graderUrl=row.graderUrl;
    if(graderUrl&&String(unit.groupId)!=='0'){
      try{const u=new URL(graderUrl,location.href);u.searchParams.set('group',String(unit.groupId));graderUrl=u.href;}catch{}
    }
    return {...row,graderUrl,targetUid:target.uid,courseId:target.courseId,courseName:target.courseName||('Aula '+target.courseId),activityName:target.name,activityUrl:target.url,groupId:unit.groupId,groupName:unit.groupName,unitKey:unit.key};
  });
}

async function loadCentralGradingOverview(filter='all',onStatus=()=>{}){
  const targets=readGradingTargets().filter(x=>x.active);
  if(!targets.length)throw new Error('No hay actividades de calificación activas. Añada al menos una desde Calificaciones.');
  const rows=[],units=[],errors=[];
  for(let i=0;i<targets.length;i++){
    const target=targets[i];
    try{
      await resolveGradingTargetCourse(target,onStatus);
      const targetUnits=await gradingUnitsForTarget(target,onStatus);
      units.push(...targetUnits);
      for(let j=0;j<targetUnits.length;j++){
        const unit=targetUnits[j];
        onStatus((i+1)+'/'+targets.length+' aulas/actividades · '+target.courseName+' — '+target.name+' — '+unit.groupName);
        try{rows.push(...await loadGradingUnit(target,unit,filter,onStatus));}
        catch(error){errors.push({target,unit,error:error.message});}
        await sleep(REQUEST_PAUSE);
      }
    }catch(error){errors.push({target,unit:null,error:error.message});}
  }
  return {rows,units,targets,errors};
}

function createGradingDashboard(){
  document.getElementById('mft-grading-dashboard')?.remove();
  const ov=document.createElement('div');ov.id='mft-grading-dashboard';
  ov.style.cssText='position:fixed;inset:0;z-index:300000;background:#fff;color:#222;font-family:Arial,sans-serif;display:flex;flex-direction:column;';
  const head=document.createElement('div');head.style.cssText='padding:10px 14px;border-bottom:1px solid #ccc;background:white;display:flex;gap:8px;align-items:center;flex-wrap:wrap;z-index:2;';
  const title=document.createElement('strong');title.textContent='Calificaciones · Moodle Forum Toolkit';title.style.fontSize='16px';
  const deliveryFilter=document.createElement('select');
  deliveryFilter.innerHTML='<option value="all">Todas las entregas</option><option value="notsubmitted">No entregados</option><option value="submitted">Entregados</option>';
  const previousFilter=localStorage.getItem('mft_grading_dashboard_filter')||'all';
  deliveryFilter.value=['notsubmitted','submitted'].includes(previousFilter)?previousFilter:(localStorage.getItem('mft_grading_delivery_filter')||'all');
  const gradingFilter=document.createElement('select');
  gradingFilter.innerHTML='<option value="all">Todas las calificaciones</option><option value="ungraded">No calificados</option><option value="graded">Calificados</option>';
  gradingFilter.value=previousFilter==='graded'?'graded':previousFilter==='requiregrading'?'ungraded':(localStorage.getItem('mft_grading_review_filter')||'all');
  const courseFilter=document.createElement('select'),activityFilter=document.createElement('select'),groupFilter=document.createElement('select');
  const search=document.createElement('input');search.type='search';search.placeholder='Buscar estudiante...';search.style.cssText='padding:6px;min-width:190px;';
  const refresh=button('Actualizar',COLOR.purple),configure=button('Configurar actividades',COLOR.gray),close=button('Cerrar',COLOR.gray);
  const summary=document.createElement('span');summary.style.cssText='font-size:12px;color:#555;margin-left:auto;';
  head.append(title,deliveryFilter,gradingFilter,courseFilter,activityFilter,groupFilter,search,refresh,configure,summary,close);

  const body=document.createElement('div');body.style.cssText='display:grid;grid-template-columns:minmax(390px,42%) 1fr;min-height:0;flex:1;';
  const left=document.createElement('div');left.style.cssText='border-right:1px solid #ccc;overflow:auto;padding:10px;background:#fafafa;';
  const right=document.createElement('div');right.style.cssText='position:relative;min-width:0;background:white;';
  const hint=document.createElement('div');hint.style.cssText='padding:24px;color:#555;line-height:1.5;';
  hint.innerHTML='<strong>Calificaciones centralizadas</strong><br>La actualización recorre todas las actividades activas configuradas y todos sus grupos. Seleccione un estudiante a la izquierda para abrir a la derecha el calificador nativo de Moodle, incluida la rúbrica y la retroalimentación.';
  const frame=document.createElement('iframe');frame.id='mft-grading-frame';frame.style.cssText='display:none;width:100%;height:100%;border:0;background:white;';
  right.append(hint,frame);body.append(left,right);ov.append(head,body);document.body.appendChild(ov);

  let data=[],units=[],targets=[],errors=[],selected='';

  function fillSelect(select,label,items,valueKey,textFn){
    const previous=select.value;
    select.innerHTML='';
    const all=document.createElement('option');all.value='';all.textContent=label;select.appendChild(all);
    const seen=new Set();
    for(const item of items){
      const value=String(item[valueKey]||'');if(!value||seen.has(value))continue;seen.add(value);
      const option=document.createElement('option');option.value=value;option.textContent=textFn(item);select.appendChild(option);
    }
    if([...select.options].some(o=>o.value===previous))select.value=previous;
  }

  function rebuildFilters(){
    fillSelect(courseFilter,'Todas las aulas',targets,'courseId',x=>x.courseName||('Aula '+x.courseId));
    const activities=targets.filter(x=>!courseFilter.value||String(x.courseId)===courseFilter.value);
    fillSelect(activityFilter,'Todas las actividades',activities,'uid',x=>x.name);
    const unitOptions=units.filter(u=>(!courseFilter.value||String(u.courseId)===courseFilter.value)&&(!activityFilter.value||u.targetUid===activityFilter.value));
    fillSelect(groupFilter,'Todos los grupos',unitOptions,'key',u=>u.groupName);
  }

  function matches(row){
    if(deliveryFilter.value==='notsubmitted'&&!row.notSubmitted)return false;
    if(deliveryFilter.value==='submitted'&&!row.submitted)return false;
    if(gradingFilter.value==='graded'&&!row.graded)return false;
    if(gradingFilter.value==='ungraded'&&row.graded)return false;
    if(courseFilter.value&&String(row.courseId)!==courseFilter.value)return false;
    if(activityFilter.value&&row.targetUid!==activityFilter.value)return false;
    if(groupFilter.value&&row.unitKey!==groupFilter.value)return false;
    const q=norm(search.value);
    return !q||norm([row.fullname,row.statusText,row.gradeText,row.courseName,row.activityName,row.groupName].join(' ')).includes(q);
  }

  function render(){
    left.innerHTML='';
    const visible=data.filter(matches);
    const notSubmitted=visible.filter(x=>x.notSubmitted).length,graded=visible.filter(x=>x.graded).length,ungraded=visible.filter(x=>!x.graded).length;
    const classrooms=new Set(visible.map(x=>x.courseId).filter(Boolean)).size,groups=new Set(visible.map(x=>x.unitKey).filter(Boolean)).size,activities=new Set(visible.map(x=>x.targetUid).filter(Boolean)).size;
    const uniqueStudents=new Set(visible.map(x=>(x.courseId||'')+'::'+(x.userId||normName(x.fullname))).filter(Boolean)).size;
    const forumGroupUnits=units.filter(u=>String(u.groupSource||'').startsWith('foro')).length;
    const singleGroupUnits=units.filter(u=>u.groupSource==='foro-unico').length;
    summary.textContent=uniqueStudents+' estudiante(s) · '+visible.length+' registro(s) · '+classrooms+' aula(s) · '+activities+' actividad(es) · '+groups+' grupo(s)'+(forumGroupUnits?' ('+forumGroupUnits+' detectados desde Foros'+(singleGroupUnits?', '+singleGroupUnits+' grupo único':'')+')':'')+' · '+notSubmitted+' sin entrega · '+ungraded+' no calificados · '+graded+' calificados'+(errors.length?' · '+errors.length+' error(es)':'');
    if(!visible.length){
      const p=document.createElement('p');p.textContent='No hay estudiantes que coincidan con los filtros seleccionados.';left.appendChild(p);
    }else{
      for(const row of visible){
        const card=document.createElement('div');card.style.cssText='padding:9px;margin-bottom:7px;border:1px solid '+(selected===row.graderUrl?'#1976d2':'#ddd')+';border-radius:7px;background:white;';
        const context=document.createElement('div');context.style.cssText='font-size:11px;color:#666;margin-bottom:4px;font-weight:600;';context.textContent=(row.courseName||'Aula')+' · '+(row.activityName||'Actividad')+' · '+(row.groupName||'Grupo');
        const name=document.createElement('strong');name.textContent=row.fullname;
        const state=document.createElement('div');state.style.cssText='font-size:12px;margin-top:4px;line-height:1.35;color:#555;';
        const badge=row.notSubmitted?'⚠ Sin entrega':row.requiresGrading?'🟠 Pendiente de calificar':row.graded?'✅ Calificado':'Entrega registrada';
        state.textContent=badge+' · Nota: '+row.gradeText+' · '+row.statusText;
        const open=button(row.notSubmitted?'Calificar / aplicar 0':'Calificar',row.notSubmitted?COLOR.orange:COLOR.blue);open.style.cssText+='margin-top:7px;';
        open.onclick=()=>{selected=row.graderUrl;hint.style.display='none';frame.style.display='block';frame.src=row.graderUrl;render();};
        card.append(context,name,state,open);left.appendChild(card);
      }
    }
    if(errors.length){
      const details=document.createElement('details');details.style.cssText='margin-top:10px;color:#8a4b00;';
      const sum=document.createElement('summary');sum.textContent='Ver '+errors.length+' error(es) de lectura';
      details.appendChild(sum);
      for(const err of errors){const d=document.createElement('div');d.style.cssText='font-size:12px;margin:5px 0;';d.textContent=(err.target?.courseName||'Aula')+' · '+(err.target?.name||'Actividad')+(err.unit?' · '+err.unit.groupName:'')+': '+err.error;details.appendChild(d);}
      left.appendChild(details);
    }
  }

  async function reload(){
    refresh.disabled=true;left.innerHTML='<p>Recorriendo aulas, actividades y grupos configurados...</p>';summary.textContent='';
    localStorage.setItem('mft_grading_delivery_filter',deliveryFilter.value);
    localStorage.setItem('mft_grading_review_filter',gradingFilter.value);
    try{
      const result=await loadCentralGradingOverview('all',text=>summary.textContent=text);
      data=result.rows;units=result.units;targets=result.targets;errors=result.errors;
      rebuildFilters();render();
    }catch(error){
      data=[];units=[];targets=[];errors=[];left.innerHTML='';
      const p=document.createElement('p');p.style.color=COLOR.red;p.textContent='No fue posible cargar las calificaciones: '+error.message;left.appendChild(p);
      summary.textContent='';
    }finally{refresh.disabled=false;}
  }

  deliveryFilter.onchange=()=>{localStorage.setItem('mft_grading_delivery_filter',deliveryFilter.value);render();};
  gradingFilter.onchange=()=>{localStorage.setItem('mft_grading_review_filter',gradingFilter.value);render();};
  courseFilter.onchange=()=>{rebuildFilters();render();};
  activityFilter.onchange=()=>{rebuildFilters();render();};
  groupFilter.onchange=render;
  search.addEventListener('input',render);
  refresh.onclick=reload;
  configure.onclick=showGradingShortcuts;
  close.onclick=()=>ov.remove();
  reload();
}

function createGradingOverviewPanel(){
  if(document.getElementById('mft-grading-overview-panel'))return;
  const panel=document.createElement('div');panel.id='mft-grading-overview-panel';
  panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;width:min(390px,calc(100vw - 24px));max-height:85vh;background:white;color:#222;border:1px solid #aaa;border-radius:9px;box-shadow:0 3px 12px #0003;font-family:Arial,sans-serif;box-sizing:border-box;';
  const content=document.createElement('div');content.id='mft-grading-overview-content';
  const info=document.createElement('div');info.style.cssText='font-size:12px;line-height:1.45;margin-bottom:8px;';
  info.innerHTML='<strong>Calificaciones de la actividad</strong><br>Filtre estudiantes y mantenga la rúbrica de Moodle abierta en la misma vista.';
  const open=button('Abrir panel de calificaciones',COLOR.blue);open.style.cssText+='width:100%;padding:8px;box-sizing:border-box;';
  open.onclick=createGradingDashboard;
  const donation=createDonationBanner();
  content.append(info,open,donation);
  attachCollapsiblePanel(panel,content,'mft_grading_overview_collapsed_v1');
  document.body.appendChild(panel);
}

function gradingRoute(){
  return /\/mod\/assign\/view\.php$/i.test(location.pathname) &&
    new URL(location.href).searchParams.get('action')==='grader';
}

function gradingStudentName(){
  const candidates=[
    document.querySelector('[data-region="user-info"] h3'),
    document.querySelector('.userheading h2'),
    document.querySelector('.gradingform .fullname'),
    document.querySelector('h2')
  ];
  for(const node of candidates){const value=clean(node?.textContent||'');if(value)return value;}
  return 'el estudiante actual';
}

function gradingScoreInputs(){
  const rubric=[...document.querySelectorAll('input[id*="advancedgrading-criteria-"][id$="-score"]')];
  if(rubric.length)return rubric;
  return [...document.querySelectorAll('input[name="grade"],input#id_grade,input[name$="[grade]"]')].filter(x=>!x.disabled);
}

function gradingRemarkInputs(){
  return [...document.querySelectorAll('textarea[id*="advancedgrading-criteria-"][id$="-remark"]')];
}

function dispatchFieldChange(field){
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
}

function formatRecoveryDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';
  const [y,m,d]=value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO',{day:'numeric',month:'long',year:'numeric'}).format(new Date(y,m-1,d));
}

function gradingFeedbackHtml(recoveryDate='',includeRecovery=true,tutorName=''){
  const dateText=formatRecoveryDate(recoveryDate),signatureName=clean(tutorName)||'Tutor';
  const recovery=includeRecovery&&dateText?`
<tr>
<td style="padding:0 35px 25px;">
<div style="background-color:#fff9e6;border-left:4px solid #ffcc00;padding:12px 20px;">
<p style="margin:0;font-size:14px;color:#856404;">
<strong>Oportunidad de recuperación:</strong> Se brinda mediación de tiempo para la entrega del producto, con plazo máximo ${esc(dateText)}. La entrega se realiza por este mismo medio.
</p>
</div>
</td>
</tr>`:'';
  return `
<table style="background-color:#f0f2f5;width:100%;border-collapse:collapse;font-family:'Segoe UI',Arial,sans-serif;padding:20px;">
<tbody><tr><td style="padding:20px 0;" align="center">
<table style="background-color:#ffffff;width:95%;max-width:750px;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);border-collapse:collapse;">
<tbody>
<tr><td style="padding:15px 30px;border-bottom:1px solid #f0f0f0;">
<img style="display:block;border:0;max-width:100%;height:auto;" src="https://lh3.googleusercontent.com/d/1ADGpnc5FWIsnLYijKMJhQU0dTa15RvhJ" alt="UNAD" width="350">
</td></tr>
<tr><td style="padding:25px 35px;">
<p style="margin:0 0 15px;color:#003057;font-size:17px;"><strong>Cordial saludo, apreciado Estudiante.</strong></p>
<p style="margin:0;color:#444;font-size:15px;line-height:1.5;">Al revisar el entorno de evaluación, no se evidencia una entrega válida de la actividad. Por tal motivo, y respetando los tiempos establecidos, la calificación asignada para esta tarea es de <strong>0 puntos, marcada como reprobada.</strong></p>
</td></tr>
${recovery}
<tr><td style="padding:20px 35px;background-color:#f9f9f9;border-top:1px solid #eee;">
<p style="margin:0;font-size:14px;color:#333;">Atentamente,<br><strong>${esc(signatureName)}</strong><br><em>Tutor</em></p>
</td></tr>
<tr><td style="padding:10px;background-color:#003057;color:#ffffff;font-size:10px;" align="center">© 2026 ECBTI. Educación para todos con calidad y calidez.</td></tr>
</tbody></table>
</td></tr></tbody></table>`;
}

function setGradingFeedback(html){
  const tinymce=PAGE.tinymce||window.tinymce;
  const editor=tinymce?.get?.('id_assignfeedbackcomments_editor') ||
    tinymce?.editors?.find?.(e=>/assignfeedbackcomments_editor/i.test(e.id||''));
  if(editor){editor.setContent(html);editor.save();return true;}
  const field=document.querySelector('textarea[name="assignfeedbackcomments_editor[text]"],textarea#id_assignfeedbackcomments_editor');
  if(field){field.value=html;dispatchFieldChange(field);return true;}
  const atto=document.querySelector('[contenteditable="true"][id*="assignfeedbackcomments"]');
  if(atto){atto.innerHTML=html;atto.dispatchEvent(new Event('input',{bubbles:true}));return true;}
  return false;
}

function fillZeroGrade({remark,recoveryDate,includeRecovery,tutorName}){
  const scores=gradingScoreInputs(),remarks=gradingRemarkInputs();
  if(!scores.length)throw new Error('No se encontraron campos de calificación compatibles en esta página.');
  for(const input of scores){input.value='0';dispatchFieldChange(input);}
  for(const textarea of remarks){textarea.value=remark;dispatchFieldChange(textarea);}
  const feedbackSet=setGradingFeedback(gradingFeedbackHtml(recoveryDate,includeRecovery,tutorName));
  return {scores:scores.length,remarks:remarks.length,feedbackSet};
}

function gradingCriterionTitle(row,index){
  const title=clean(
    row.querySelector('.criterionshortname')?.textContent||
    row.querySelector('.criterionname')?.textContent||
    row.querySelector('.criteriondescription')?.textContent||
    row.querySelector('.description')?.textContent||
    ''
  );
  return (title||('Criterio '+(index+1))).slice(0,220);
}

function gradingCriterionModels(){
  const rows=[...document.querySelectorAll('tr.criterion')].filter(row=>
    row.querySelector('input[id*="-criteria-"][id$="-score"],textarea[id*="-criteria-"][id$="-remark"],input[type="radio"][name*="[criteria]"][name$="[levelid]"]')
  );
  return rows.map((row,index)=>{
    const scoreInput=row.querySelector('input[id*="-criteria-"][id$="-score"]');
    const remarkInput=row.querySelector('textarea[id*="-criteria-"][id$="-remark"]');
    const radios=[...row.querySelectorAll('input[type="radio"][name*="[criteria]"][name$="[levelid]"]')];
    const maxText=clean(row.querySelector('.criteriondescriptionscore')?.textContent||scoreInput?.closest('td')?.textContent||'');
    const maxMatch=maxText.match(/\/\s*(-?\d+(?:[.,]\d+)?)/);
    const maxScore=maxMatch?Number(maxMatch[1].replace(',','.')):null;
    const levels=radios.map(radio=>{
      const cell=radio.closest('.level,td')||radio.parentElement;
      const scoreText=clean(cell?.querySelector('.scorevalue,.score')?.textContent||'');
      const label=clean(cell?.textContent||scoreText||radio.value);
      return {value:String(radio.value),scoreText,label:label.slice(0,180),radio};
    });
    return {row,index,title:gradingCriterionTitle(row,index),scoreInput,remarkInput,radios,levels,maxScore};
  });
}

function createCompactGradingTemplate(statusTarget){
  const details=document.createElement('details');details.open=true;details.style.cssText='margin-top:8px;border:1px solid #d8dde4;border-radius:7px;padding:8px;background:#fafafa;';
  const summary=document.createElement('summary');summary.textContent='Plantilla resumida de criterios';summary.style.cssText='cursor:pointer;font-weight:700;color:#003057;';
  const help=document.createElement('div');help.style.cssText='font-size:11px;color:#666;line-height:1.4;margin:7px 0;';help.textContent='Ingrese la nota y la observación de cada criterio. Aplicar copia los valores a la guía/rúbrica de Moodle, pero no guarda la calificación.';
  const list=document.createElement('div'),actions=document.createElement('div'),total=document.createElement('div');
  actions.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;';
  total.style.cssText='font-size:12px;font-weight:600;margin-top:6px;color:#555;';
  const apply=button('Aplicar a la rúbrica',COLOR.blue),reload=button('Recargar desde Moodle',COLOR.gray);
  actions.append(apply,reload);
  details.append(summary,help,list,total,actions);

  let controls=[];
  const recalc=()=>{
    let sum=0,max=0,count=0,allNumeric=true;
    for(const c of controls){
      if(c.kind!=='score')continue;
      const value=String(c.input.value||'').trim().replace(',','.');
      if(value===''){allNumeric=false;continue;}
      const n=Number(value);if(!Number.isFinite(n)){allNumeric=false;continue;}
      sum+=n;count++;
      if(Number.isFinite(c.model.maxScore))max+=c.model.maxScore;else allNumeric=false;
    }
    total.textContent=count?(allNumeric&&max?('Total ingresado: '+sum+' / '+max):('Total ingresado: '+sum)):'';
  };

  const render=()=>{
    list.innerHTML='';controls=[];
    const models=gradingCriterionModels();
    if(!models.length){
      const p=document.createElement('div');p.style.cssText='font-size:12px;color:#8a4b00;margin:6px 0;';p.textContent='No se detectaron criterios editables en esta vista de Moodle.';list.appendChild(p);total.textContent='';return;
    }
    for(const model of models){
      const card=document.createElement('div');card.style.cssText='padding:7px 0;border-top:1px solid #e1e4e8;';
      const label=document.createElement('div');label.style.cssText='font-size:12px;font-weight:700;margin-bottom:5px;';label.textContent=(model.index+1)+'. '+model.title;
      const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:110px 1fr;gap:6px;align-items:start;';
      const scoreLabel=document.createElement('span');scoreLabel.textContent='Nota';scoreLabel.style.cssText='font-size:11px;color:#555;padding-top:7px;';
      let scoreControl=null,kind='score';
      if(model.scoreInput){
        scoreControl=document.createElement('input');scoreControl.type='number';scoreControl.step='any';scoreControl.min='0';
        if(Number.isFinite(model.maxScore))scoreControl.max=String(model.maxScore);
        scoreControl.value=model.scoreInput.value||'';scoreControl.placeholder=Number.isFinite(model.maxScore)?('0 – '+model.maxScore):'Nota';
        scoreControl.style.cssText='width:100%;padding:5px;box-sizing:border-box;';
        scoreControl.addEventListener('input',recalc);
      }else if(model.radios.length){
        kind='level';scoreControl=document.createElement('select');scoreControl.style.cssText='width:100%;padding:5px;box-sizing:border-box;';
        const empty=document.createElement('option');empty.value='';empty.textContent='Seleccione nivel';scoreControl.appendChild(empty);
        for(const level of model.levels){
          const opt=document.createElement('option');opt.value=level.value;opt.textContent=(level.scoreText?level.scoreText+' · ':'')+level.label;scoreControl.appendChild(opt);
          if(level.radio.checked)scoreControl.value=level.value;
        }
      }else{
        scoreControl=document.createElement('input');scoreControl.disabled=true;scoreControl.placeholder='No editable';scoreControl.style.cssText='width:100%;padding:5px;box-sizing:border-box;';
      }
      const remarkLabel=document.createElement('span');remarkLabel.textContent='Observación';remarkLabel.style.cssText='font-size:11px;color:#555;padding-top:7px;';
      const remark=document.createElement('textarea');remark.value=model.remarkInput?.value||'';remark.placeholder='Observación específica de este criterio';remark.style.cssText='width:100%;min-height:54px;padding:5px;box-sizing:border-box;';
      grid.append(scoreLabel,scoreControl,remarkLabel,remark);card.append(label,grid);list.appendChild(card);
      controls.push({model,input:scoreControl,remark,kind});
    }
    recalc();
  };

  apply.onclick=()=>{
    try{
      let applied=0;
      for(const c of controls){
        const {model}=c;
        if(c.kind==='score'&&model.scoreInput){
          const raw=String(c.input.value||'').trim().replace(',','.');
          if(raw==='')throw new Error('Falta la nota del criterio '+(model.index+1)+'.');
          const value=Number(raw);if(!Number.isFinite(value)||value<0)throw new Error('La nota del criterio '+(model.index+1)+' no es válida.');
          if(Number.isFinite(model.maxScore)&&value>model.maxScore)throw new Error('La nota del criterio '+(model.index+1)+' supera el máximo de '+model.maxScore+'.');
          model.scoreInput.value=String(value);dispatchFieldChange(model.scoreInput);
        }else if(c.kind==='level'&&model.radios.length){
          if(!c.input.value)throw new Error('Falta seleccionar el nivel del criterio '+(model.index+1)+'.');
          const radio=model.radios.find(r=>String(r.value)===String(c.input.value));
          if(!radio)throw new Error('No se encontró el nivel seleccionado del criterio '+(model.index+1)+'.');
          if(!radio.checked)radio.click();
        }
        if(model.remarkInput){model.remarkInput.value=c.remark.value;dispatchFieldChange(model.remarkInput);}
        applied++;
      }
      statusTarget.style.color=COLOR.green;
      statusTarget.textContent='Plantilla aplicada a '+applied+' criterio(s). Revise la guía/rúbrica y guarde cuando esté conforme.';
    }catch(error){
      statusTarget.style.color=COLOR.red;statusTarget.textContent='Error en plantilla: '+error.message;
    }
  };
  reload.onclick=render;
  render();
  return details;
}

function findGradingSaveButton(preferNext=true){
  const candidates=[...document.querySelectorAll('button,input[type="submit"]')].filter(x=>!x.disabled);
  const text=x=>clean(x.textContent||x.value||'');
  if(preferNext){
    const next=candidates.find(x=>/guardar.*(siguiente|mostrar.*siguiente)|save.*(next|show.*next)/i.test(text(x)) || /saveandshownext/i.test(x.name||x.id||''));
    if(next)return next;
  }
  return document.getElementById('id_submitbutton') ||
    candidates.find(x=>/guardar.*cambios|save.*changes/i.test(text(x)) || /savechanges|submitbutton/i.test(x.name||x.id||'')) || null;
}

function createGradingPanel(){
  if(document.getElementById('mft-grading-panel'))return;
  const panel=document.createElement('div');panel.id='mft-grading-panel';
  panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;width:min(390px,calc(100vw - 24px));max-height:85vh;background:white;color:#222;border:1px solid #aaa;border-radius:9px;box-shadow:0 3px 12px #0003;font-family:Arial,sans-serif;box-sizing:border-box;';
  const content=document.createElement('div');content.id='mft-grading-panel-content';
  const intro=document.createElement('div');
  intro.style.cssText='font-size:12px;line-height:1.45;margin-bottom:8px;';
  intro.innerHTML='<strong>Asistente de calificación</strong><br>Use la plantilla resumida para entregas evaluadas por criterio o el bloque de no entrega para asignar 0.';
  const profileTutorName=clean(tutorIdentity().name||'');
  const tutorLabel=document.createElement('label');tutorLabel.textContent='Nombre del tutor';tutorLabel.style.cssText='display:block;font-size:12px;font-weight:600;margin-top:6px;';
  const tutorRow=document.createElement('div');tutorRow.style.cssText='display:flex;gap:6px;align-items:center;margin-top:4px;';
  const tutorName=document.createElement('input');tutorName.type='text';tutorName.placeholder='Nombre que aparecerá en la firma';tutorName.value=localStorage.getItem(GRADING_KEYS.tutorName)||profileTutorName;tutorName.style.cssText='flex:1;min-width:0;padding:6px;box-sizing:border-box;';
  const useProfile=button('Usar perfil',COLOR.gray);useProfile.style.cssText+='flex:0 0 auto;padding:6px;';
  useProfile.onclick=()=>{tutorName.value=profileTutorName;localStorage.setItem(GRADING_KEYS.tutorName,tutorName.value);};
  tutorRow.append(tutorName,useProfile);
  const remarkLabel=document.createElement('label');remarkLabel.textContent='Observación en criterios';remarkLabel.style.cssText='display:block;font-size:12px;font-weight:600;margin-top:6px;';
  const remark=document.createElement('textarea');remark.value=localStorage.getItem(GRADING_KEYS.criterionRemark)||'No se realizó entrega válida de la actividad.';remark.style.cssText='width:100%;min-height:58px;box-sizing:border-box;margin-top:4px;padding:6px;';
  const recoveryRow=document.createElement('div');recoveryRow.style.cssText='display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px;';
  const include=document.createElement('input');include.type='checkbox';include.checked=localStorage.getItem(GRADING_KEYS.includeRecovery)!=='0';
  const includeLabel=document.createElement('label');includeLabel.style.cssText='display:flex;align-items:center;gap:5px;font-size:12px;';includeLabel.append(include,document.createTextNode('Incluir oportunidad de recuperación'));
  const date=document.createElement('input');date.type='date';date.value=localStorage.getItem(GRADING_KEYS.recoveryDate)||'2026-10-04';date.style.padding='5px';
  recoveryRow.append(includeLabel,date);
  const templateStatus=document.createElement('div');templateStatus.style.cssText='font-size:12px;line-height:1.4;margin:7px 0;color:#555;';templateStatus.textContent='La plantilla resumida no modifica Moodle hasta pulsar Aplicar a la rúbrica.';
  const compactTemplate=createCompactGradingTemplate(templateStatus);
  const status=document.createElement('div');status.style.cssText='font-size:12px;line-height:1.4;margin:8px 0;color:#555;';status.textContent='No se ha modificado la calificación.';
  const fill=button('Preparar 0 + retroalimentación',COLOR.blue);
  const save=button('Confirmar 0 y guardar',COLOR.red);
  const saveNext=button('Confirmar 0 y guardar / siguiente',COLOR.orange);
  const dashboard=button('Abrir panel de calificaciones',COLOR.gray);
  for(const btn of [fill,save,saveNext,dashboard])btn.style.cssText+='width:100%;margin-top:7px;padding:8px;box-sizing:border-box;';
  const persist=()=>{localStorage.setItem(GRADING_KEYS.tutorName,tutorName.value);localStorage.setItem(GRADING_KEYS.criterionRemark,remark.value);localStorage.setItem(GRADING_KEYS.recoveryDate,date.value);localStorage.setItem(GRADING_KEYS.includeRecovery,include.checked?'1':'0');};
  tutorName.addEventListener('input',persist);remark.addEventListener('input',persist);date.addEventListener('change',persist);include.addEventListener('change',()=>{date.disabled=!include.checked;persist();});date.disabled=!include.checked;
  const runFill=()=>{persist();const result=fillZeroGrade({remark:remark.value,recoveryDate:date.value,includeRecovery:include.checked,tutorName:tutorName.value});status.style.color=result.feedbackSet?COLOR.green:COLOR.orange;status.textContent=`Preparado: ${result.scores} campo(s) de puntuación en 0, ${result.remarks} observación(es) y ${result.feedbackSet?'retroalimentación insertada':'retroalimentación no detectada'}. Revise antes de guardar.`;return result;};
  fill.onclick=()=>{try{runFill();}catch(error){status.style.color=COLOR.red;status.textContent='Error: '+error.message;}};
  const confirmAndSave=preferNext=>{try{
    const student=gradingStudentName();
    if(!confirm(`Se asignará 0 al estudiante actual (${student}), se insertará la retroalimentación y se guardará la calificación.\n\nConfirme que revisó que no existe una entrega válida.`))return;
    const result=runFill();
    if(!result.feedbackSet&&!confirm('No se detectó el editor de retroalimentación. ¿Desea guardar de todas formas la calificación en 0?'))return;
    const saveButton=findGradingSaveButton(preferNext);
    if(!saveButton)throw new Error(preferNext?'No se encontró el botón Guardar / siguiente de Moodle.':'No se encontró el botón Guardar cambios de Moodle.');
    status.style.color=COLOR.green;status.textContent=preferNext?'Guardando y avanzando al siguiente estudiante...':'Guardando la calificación del estudiante actual...';
    saveButton.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>saveButton.click(),250);
  }catch(error){status.style.color=COLOR.red;status.textContent='Error: '+error.message;}};
  save.onclick=()=>confirmAndSave(false);
  saveNext.onclick=()=>confirmAndSave(true);
  dashboard.onclick=createGradingDashboard;
  const note=document.createElement('div');note.style.cssText='font-size:11px;color:#666;margin-top:8px;line-height:1.4;';note.textContent='Por seguridad, el Toolkit no califica estudiantes consecutivos sin una confirmación explícita por cada estudiante.';
  const zeroDetails=document.createElement('details');zeroDetails.style.cssText='margin-top:8px;border:1px solid #ead7d7;border-radius:7px;padding:8px;background:#fffafa;';
  const zeroSummary=document.createElement('summary');zeroSummary.textContent='No entrega: 0 + retroalimentación';zeroSummary.style.cssText='cursor:pointer;font-weight:700;color:#a72828;';
  zeroDetails.append(zeroSummary,remarkLabel,remark,recoveryRow,status,fill,save,saveNext);
  const donation=createDonationBanner();
  content.append(intro,tutorLabel,tutorRow,compactTemplate,templateStatus,zeroDetails,dashboard,note,donation);
  attachCollapsiblePanel(panel,content,'mft_grading_panel_collapsed_v1');
  document.body.appendChild(panel);
}

/* ========================= Legacy native editor helper ========================= */

async function insertPendingNativeReply(){
  const raw=localStorage.getItem(K.pendingReply);if(!raw)return;let data;try{data=JSON.parse(raw);}catch{localStorage.removeItem(K.pendingReply);return;}if(Date.now()-Number(data.created||0)>600000){localStorage.removeItem(K.pendingReply);return;}
  const text=data.text||'';for(let i=0;i<25;i++){try{const editor=window.tinymce?.editors?.find(e=>/message/i.test(e.id||''))||window.tinymce?.activeEditor;if(editor){editor.setContent(esc(text).replace(/\n/g,'<br>'));editor.save();localStorage.removeItem(K.pendingReply);return;}const atto=document.querySelector('.editor_atto_content[contenteditable="true"], [contenteditable="true"][id*="message"]');if(atto){atto.innerHTML=esc(text).replace(/\n/g,'<br>');localStorage.removeItem(K.pendingReply);return;}const ta=document.querySelector('textarea[name="message[text]"],textarea[name="message"]');if(ta){ta.value=text;localStorage.removeItem(K.pendingReply);return;}}catch{}await sleep(300);}
}

if(/\/mod\/assign\/view\.php$/i.test(location.pathname))ensureCurrentGradingTarget();
if(gradingRoute()){createGradingPanel();return;}
if(gradingOverviewRoute()){createGradingOverviewPanel();return;}
if(/\/mod\/forum\/post\.php$/i.test(location.pathname)){insertPendingNativeReply();return;}

/* ========================= Main panel ========================= */

function createPanel(){
  if(document.getElementById('mft-panel'))return;
  const panel=document.createElement('div');panel.id='mft-panel';
  panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;width:min(390px,calc(100vw - 24px));max-height:85vh;background:white;color:#222;border:1px solid #aaa;border-radius:9px;box-shadow:0 3px 12px #0003;font-family:Arial,sans-serif;box-sizing:border-box;';
  const content=document.createElement('div');content.id='mft-panel-content';
  const meta=document.createElement('div');meta.id='mft-panel-meta';meta.style.cssText='font-size:12px;color:#555;margin-top:5px;';
  const status=document.createElement('div');status.id='mft-status';status.textContent='Sin análisis automático. Revise la página y pulse Consolidar foros activos cuando lo decida.';status.style.cssText='font-size:12px;margin:8px 0;line-height:1.4;';
  const mailBox=document.createElement('div');mailBox.id='mft-mail-box';mailBox.style.cssText='border:1px solid #ddd;border-radius:7px;padding:8px;margin:8px 0;background:#fafafa;font-size:12px;';
  const mailStatus=document.createElement('div');mailStatus.id='mft-mail-status';mailStatus.textContent='Correo interno: sin comprobar.';mailStatus.style.cssText='font-weight:600;margin-bottom:6px;';
  const mailActions=document.createElement('div');mailActions.style.cssText='display:flex;gap:6px;flex-wrap:wrap;';
  const openMail=button('Abrir correo',COLOR.blue),refreshMail=button('Actualizar correo',COLOR.gray);
  openMail.onclick=()=>window.open(internalMailInboxUrl(),'_blank','noopener');refreshMail.onclick=()=>checkInternalMail();
  const mailLatest=document.createElement('div');mailLatest.id='mft-mail-latest';mailLatest.style.cssText='display:none;margin-top:6px;';
  mailActions.append(openMail,refreshMail);mailBox.append(mailStatus,mailActions,mailLatest);
  const consolidateBtn=button('Consolidar foros activos',COLOR.blue);consolidateBtn.id='mft-consolidate';consolidateBtn.style.cssText+='width:100%;box-sizing:border-box;';consolidateBtn.onclick=consolidate;
  const config=button('⚙ Configurar foros',COLOR.gray),grading=button('📝 Calificaciones',COLOR.purple),mass=button('📢 Redactar / enviar mensaje',COLOR.orange);
  for(const btn of [config,grading,mass])btn.style.cssText+='width:100%;margin-top:7px;padding:8px;box-sizing:border-box;';
  config.onclick=showClassroomConfig;grading.onclick=showGradingShortcuts;mass.onclick=massModal;
  const donation=createDonationBanner();
  const about=document.createElement('details');about.style.cssText='margin-top:8px;font-size:11px;color:#555;';about.innerHTML=`<summary style="cursor:pointer">Acerca de</summary><div style="margin-top:5px;line-height:1.4">Desarrollado por <strong>${AUTHOR}</strong><br>Código abierto · Licencia MIT<br>Herramienta independiente y no oficial.</div>`;
  content.append(meta,status,mailBox,consolidateBtn,config,grading,mass,donation,about);
  attachCollapsiblePanel(panel,content,'mft_main_panel_collapsed_v2');
  document.body.appendChild(panel);
  updatePanelMeta();renderInternalMailStatus();
}

// The launcher is available only once the tutor has opened a Moodle course or forum.
const onForum=/\/mod\/forum\/view\.php$/i.test(location.pathname);
const onCourse=/\/course\/view\.php$/i.test(location.pathname);
const onAssign=/\/mod\/assign\/view\.php$/i.test(location.pathname);
if(onForum||onCourse||onAssign){
  if(onForum)ensureCurrentClassroom();
  createPanel();
  if(onCourse){
    const status=document.getElementById('mft-status');
    if(status){
      const active=configuredClassrooms().filter(item=>item.active).length;
      status.textContent=active
        ? 'Panel listo, sin análisis automático. Cuando termine de revisar el curso, pulse Consolidar para analizar los '+active+' foro(s) activos configurados de esta instalación Moodle.'
        : 'Panel disponible desde este curso. Pulse Configurar foros para registrar las URL de los foros que desea revisar.';
    }
  }
}
})();