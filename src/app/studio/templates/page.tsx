"use client";
// src/app/studio/templates/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import React, { useEffect, useMemo, useState } from "react";

type Tpl = { id: string; title: string; category: string; content: string };

const seed: Tpl[] = [
  { id: "t1", title: "Ad — Google RSA", category: "Ads",
    content: "Headline 1: {product} for {audience}\nHeadline 2: {benefit}\nHeadline 3: {proof}\nDescription: {benefit}. {cta}" },
  { id: "t2", title: "Cold Email — Short", category: "Outreach",
    content: "Subj: Idea to {benefit}?\n\nHi {name}, I help {audience} {benefit} via {service}. {proof}. Open to a quick {cta}?" },
  { id: "t3", title: "Resume — STAR Bullet", category: "Career",
    content: "Led {project} to {result} by {action}; measured via {metric}." },
  { id: "t4", title: "Interview — Story Frame", category: "Career",
    content: "Situation: {context}\nTask: {goal}\nAction: {what you did}\nResult: {impact}\nLearning: {lesson}" },
];

const key = "studio.templates.v1";

export default function TemplatesPage() {
  const [tpls, setTpls] = useState<Tpl[]>(seed);
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Custom");
  const [content, setContent] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) setTpls(JSON.parse(raw));
  }, []);
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(tpls));
  }, [tpls]);

  const cats = useMemo(() => Array.from(new Set(tpls.map(t=>t.category))), [tpls]);
  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    return tpls.filter(t => t.title.toLowerCase().includes(qq) || t.content.toLowerCase().includes(qq));
  }, [q, tpls]);

  const add = () => {
    if (!title.trim() || !content.trim()) return;
    setTpls([{ id: String(Date.now()), title: title.trim(), category: category.trim() || "Custom", content: content.trim() }, ...tpls]);
    setTitle(""); setCategory("Custom"); setContent("");
  };

  const copy = (s: string) => navigator.clipboard.writeText(s);

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ margin: 0 }}>AI Template Store</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>Save reusable prompts/snippets. Users can copy and paste anywhere (LLMs, email tools, etc.).</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div><label>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} style={inp}/></div>
        <div><label>Category</label><input value={category} onChange={e=>setCategory(e.target.value)} style={inp}/></div>
        <div style={{ gridColumn:"1 / -1" }}><label>Content</label><textarea value={content} onChange={e=>setContent(e.target.value)} style={{...inp, height:100}}/></div>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <button onClick={add} style={btn}>Add Template</button>
        <input placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} style={{...inp, maxWidth:240}} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:12, marginTop:12 }}>
        {filtered.map((t)=>(
          <div key={t.id} style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
              <div style={{ fontWeight:700 }}>{t.title}</div>
              <div style={{ fontSize:12, opacity:0.7 }}>{t.category}</div>
            </div>
            <pre style={{ whiteSpace:"pre-wrap", marginTop:8 }}>{t.content}</pre>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>copy(t.content)} style={btn}>Copy</button>
              <button onClick={()=>setTpls(prev=>prev.filter(x=>x.id!==t.id))} style={btn}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop:18 }}>Import/Export</h3>
      <div style={{ display:"flex", gap:8 }}>
        <button
          onClick={()=>{
            const json = JSON.stringify(tpls); // one argument only → SSR-safe
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href=url; a.download="templates.json"; a.click();
            URL.revokeObjectURL(url);
          }}
          style={btn}
        >Export JSON</button>
        <input
          type="file" accept="application/json"
          onChange={async (e)=>{
            const f = e.target.files?.[0]; if(!f) return;
            const text = await f.text();
            try { const arr = JSON.parse(text) as Tpl[]; if(Array.isArray(arr)) setTpls(arr.concat([])); } catch {}
          }}
        />
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width:"100%", padding:10, borderRadius:8, border:"1px solid #1f2937", background:"#0b1220", color:"#e5e7eb" };
const btn: React.CSSProperties = { padding:"6px 10px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#e5e7eb" };
const card: React.CSSProperties = { border:"1px solid #1f2937", borderRadius:10, padding:12, background:"#0b1220" };
