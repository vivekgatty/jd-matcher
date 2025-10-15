"use client";

import React, { useMemo, useState } from "react";

export default function PortfolioPage() {
  const [name, setName] = useState("Your Name");
  const [title, setTitle] = useState("Performance Marketer");
  const [about, setAbout] = useState("I help brands improve CVR and lower CPA with experiments, GA4 and landing pages.");
  const [projects, setProjects] = useState("BrandX — +38% CVR in 6 weeks (CRO)\nD2C Y — -22% CPA with new LP\nLeadGen Z — +1.6x qualified leads");
  const [email, setEmail] = useState("you@example.com");
  const [links, setLinks] = useState("LinkedIn:https://linkedin.com/in/username\nWebsite:https://example.com");
  const [accent, setAccent] = useState("#0ea5e9");

  const html = useMemo(() => {
    const items = projects.split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const outLinks = links.split(/\n+/).map(l=>{
      const [label="", url=""] = l.split(":").map(s=>s.trim());
      return { label, url };
    });
    return buildHTML({ name, title, about, items, email, outLinks, accent });
  }, [name,title,about,projects,email,links,accent]);

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "portfolio.html"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ margin: 0 }}>Portfolio Page Generator</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>Generates a one-file HTML portfolio you can host anywhere (GitHub Pages, Netlify, etc.).</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} style={inp}/></div>
        <div><label>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} style={inp}/></div>
        <div style={{ gridColumn:"1 / -1" }}>
          <label>About</label>
          <textarea value={about} onChange={e=>setAbout(e.target.value)} style={{...inp, height:100}}/>
        </div>
        <div style={{ gridColumn:"1 / -1" }}>
          <label>Projects / Highlights (one per line)</label>
          <textarea value={projects} onChange={e=>setProjects(e.target.value)} style={{...inp, height:110}}/>
        </div>
        <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} style={inp}/></div>
        <div><label>Accent color</label><input value={accent} onChange={e=>setAccent(e.target.value)} style={inp}/></div>
        <div style={{ gridColumn:"1 / -1" }}>
          <label>Links (Label:URL per line)</label>
          <textarea value={links} onChange={e=>setLinks(e.target.value)} style={{...inp, height:80}}/>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <button onClick={download} style={btn}>Download HTML</button>
        <button onClick={()=>navigator.clipboard.writeText(html)} style={btn}>Copy HTML</button>
      </div>

      <h3 style={{ marginTop: 16 }}>Live Preview</h3>
      <iframe style={{ width:"100%", height:420, border:"1px solid #1f2937", background:"#fff", borderRadius:10 }} srcDoc={html} />
    </div>
  );
}

function buildHTML(opts:{
  name:string; title:string; about:string; items:string[]; email:string;
  outLinks:{label:string; url:string}[]; accent:string;
}) {
  const li = opts.items.map(i=>`<li>${escapeHTML(i)}</li>`).join("");
  const lk = opts.outLinks.filter(l=>l.label&&l.url).map(l=>`<a href="${escapeAttr(l.url)}" target="_blank">${escapeHTML(l.label)}</a>`).join(" · ");
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(opts.name)} — ${escapeHTML(opts.title)}</title>
<style>
  body{font:16px/1.5 ui-sans-serif,system-ui; margin:0; color:#0b1220}
  .wrap{max-width:860px;margin:40px auto;padding:0 20px}
  h1{font-size:28px;margin:0 0 6px}
  .muted{opacity:.8}
  .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:12px 0}
  a{color:${opts.accent};text-decoration:none}
  .cta{display:inline-block;margin-top:6px;padding:8px 12px;border-radius:8px;border:1px solid ${opts.accent};color:${opts.accent}}
</style>
<div class="wrap">
  <h1>${escapeHTML(opts.name)}</h1>
  <div class="muted">${escapeHTML(opts.title)}</div>

  <div class="card">${escapeHTML(opts.about)}</div>

  <h3>Highlights</h3>
  <div class="card"><ul>${li}</ul></div>

  <h3>Contact</h3>
  <div class="card">
    <div>Email: <a href="mailto:${escapeAttr(opts.email)}">${escapeHTML(opts.email)}</a></div>
    <div style="margin-top:6px">${lk}</div>
    <a class="cta" href="mailto:${escapeAttr(opts.email)}">Say hi</a>
  </div>
</div>
</html>`;
}
function escapeHTML(s:string){return s.replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c] as string));}
function escapeAttr(s:string){return escapeHTML(s);}
const inp: React.CSSProperties = { width:"100%", padding:10, borderRadius:8, border:"1px solid #1f2937", background:"#0b1220", color:"#e5e7eb" };
const btn: React.CSSProperties = { padding:"8px 12px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#e5e7eb" };
