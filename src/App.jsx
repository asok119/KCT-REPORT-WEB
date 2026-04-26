import React, { useMemo, useState } from "react";
import { Camera, Download, FileText, Home, ListChecks, Plus, Printer, Search, Send, Trash2 } from "lucide-react";

const initialReports = [
  {
    id: 1,
    sourceType: "카카오톡",
    receivedAt: "2025-04-18T15:54",
    date: "2025-04-18",
    writer: "박희택이사님",
    category: "처리완료",
    status: "완료",
    agency: "울진해경",
    vessel: "방제22호정",
    location: "부산정비창",
    equipment: "RADAR / AIS",
    model: "MANTA DIGITAL",
    contactName: "안태건",
    contactPhone: "010-4680-5684",
    symptom: "레이더와 AIS 연동이 안됨. AIS는 정상작동.",
    action: "AIS와 RADAR 간 통신속도 불일치 확인. AIS 통신속도 38400 설정 후 작업완료.",
    nextAction: "정기점검 처리완료.",
    worker: "박희택",
    workTime: "",
    vehicle: "",
    expense: "",
    notes: "",
    rawText: "울진해경 방제22호정 / 레이더와 AIS 연동이 안됨 / 처리완료",
    photos: []
  }
];

const emptyForm = {
  sourceType: "카카오톡",
  receivedAt: new Date().toISOString().slice(0, 16),
  date: new Date().toISOString().slice(0, 10),
  writer: "",
  category: "장애접수",
  status: "접수",
  agency: "",
  vessel: "",
  location: "",
  equipment: "",
  model: "",
  contactName: "",
  contactPhone: "",
  symptom: "",
  action: "",
  nextAction: "",
  worker: "",
  workTime: "",
  vehicle: "",
  expense: "",
  notes: "",
  rawText: "",
  photos: []
};

function inferFromRaw(raw) {
  const text = raw || "";
  const get = (regex) => (text.match(regex)?.[1] || "").trim();
  const phones = text.match(/01[016789][-\s]?\d{3,4}[-\s]?\d{4}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/g) || [];
  const agencies = ["동해해경", "서귀포해경", "창원해경", "사천해경", "통영해경", "부산해경", "울산해경", "포항해경", "울진해경", "해군", "남해청", "공군", "인방사"];
  const equipments = ["RADAR", "레이더", "VDR", "AIS", "GPS", "GPS콤파스", "플로터", "위성TV", "e-Nav", "나브텍스", "EPIRB", "UPS", "자이로", "마그네트론"];
  const modelMatch = text.match(/(VMFT\s?\d+[A-Z]?|JMA[-\s]?\d+[-\s]?\d*[A-Z]?|JMR\s?\d+[A-Z]?|MANTA\s?DIGITAL|SEAEAGLE\s?200N|FAR[-\s]?\d+[A-Z]?|FER\s?\d+|SSR\s?\d+w?|HDS[-\s]?\d+|S\s?BAND|X\s?BAND)/i);
  const vessel = get(/([가-힣A-Za-z0-9-]*\s?(?:함|정|호정|P[-\s]?\d+정|S[-\s]?\d+정|\d{3,4}함|\d{2,4}정))/);
  const agency = agencies.find((a) => text.includes(a)) || get(/([가-힣]+해양경찰서|[가-힣]+해경|[가-힣]+파출소)/);
  const equipment = equipments.find((e) => text.toUpperCase().includes(e.toUpperCase())) || "";
  const status = /완료|처리완료|수리완료|정상/.test(text) ? "완료" : /방문|예정|입창|정박/.test(text) ? "방문예정" : /견적/.test(text) ? "견적필요" : /부품|재고|구매|발주/.test(text) ? "부품필요" : /통화/.test(text) ? "통화완료" : "접수";
  const category = /완료|처리완료|수리완료/.test(text) ? "처리완료" : /영상통화|원격|전화|통화/.test(text) ? "원격지원" : /방문|출동|입창|정박/.test(text) ? "방문예정" : /문의/.test(text) ? "문의대응" : "장애접수";
  const symptom = get(/(?:문의사항|증상|요청|고장신고)\s*[:：]?\s*([\s\S]{0,180})/) || text.slice(0, 180);
  const action = get(/(?:조치|처리|작업완료|수리완료)\s*[:：]?\s*([\s\S]{0,160})/);
  return { agency, vessel, equipment, model: modelMatch?.[0] || "", contactPhone: phones[0] || "", status, category, symptom, action };
}

function saveAsText(report) {
  const content = `KCT 작업일보\n\n일자: ${report.date}\n기관: ${report.agency}\n함정/현장: ${report.vessel}\n장비: ${report.equipment}\n모델: ${report.model}\n상태: ${report.status}\n담당자: ${report.worker}\n\n[증상/요청]\n${report.symptom}\n\n[조치내용]\n${report.action}\n\n[다음조치]\n${report.nextAction}\n\n[특기사항]\n${report.notes}\n\n[RAW DATA]\n${report.rawText}`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `KCT_작업일보_${report.date}_${report.vessel || "현장"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [reports, setReports] = useState(initialReports);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(1);
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter((r) => Object.values(r).join(" ").toLowerCase().includes(q));
  }, [reports, query]);

  const selected = reports.find((r) => r.id === selectedId) || reports[0];

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  function addPhotos(files) {
    Array.from(files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setForm((prev) => ({ ...prev, photos: [...prev.photos, reader.result] }));
      reader.readAsDataURL(file);
    });
  }

  function autoAnalyzeRaw() {
    const result = inferFromRaw(form.rawText);
    setForm((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(result).filter(([, v]) => v)) }));
  }

  function submit() {
    const next = { ...form, id: Date.now(), date: form.date || form.receivedAt.slice(0, 10), worker: form.worker || form.writer || "미지정" };
    setReports((prev) => [next, ...prev]);
    setSelectedId(next.id);
    setForm(emptyForm);
    setTab("detail");
  }

  function removeReport(id) {
    const next = reports.filter((r) => r.id !== id);
    setReports(next);
    setSelectedId(next[0]?.id || null);
    setTab(next.length ? "list" : "home");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-bold text-sky-700">KCT CO., Ltd</p>
            <h1 className="text-lg font-black sm:text-2xl">작업일보 웹사이트</h1>
          </div>
          <button onClick={() => setTab("write")} className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">
            <Plus className="mr-1 inline h-4 w-4" />보고 등록
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4">
        {tab === "home" && (
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="mb-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">카카오톡 RAW DATA 자동분류</p>
              <h2 className="text-3xl font-black leading-tight">단톡방 내용을<br />작업일보·주간업무로 정리</h2>
              <p className="mt-4 text-slate-600">카카오톡 메시지를 붙여넣으면 기관, 함정명, 장비, 증상, 상태를 자동 추출하고 작업일보 형식으로 저장합니다.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => setTab("write")} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">새 작업일보 작성</button>
                <button onClick={() => setTab("list")} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold">목록 보기</button>
              </div>
            </div>
            <ReportPreview report={selected} />
          </section>
        )}

        {tab === "write" && (
          <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-2 text-2xl font-black">카카오톡 RAW DATA 기반 입력</h2>
              <p className="mb-5 rounded-2xl bg-sky-50 p-3 text-sm text-sky-800">카카오톡 원문을 먼저 붙여넣고 <b>RAW DATA 자동 분석</b>을 누르면 주요 항목이 자동 입력됩니다.</p>

              <Field label="원문 RAW DATA">
                <textarea className="textarea min-h-36" placeholder="카카오톡 메시지 원문을 그대로 붙여넣기" value={form.rawText} onChange={(e) => update("rawText", e.target.value)} />
              </Field>
              <button onClick={autoAnalyzeRaw} className="mb-4 w-full rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 font-black text-sky-800">RAW DATA 자동 분석 / 항목 채우기</button>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="수신일시"><input type="datetime-local" className="input" value={form.receivedAt} onChange={(e) => update("receivedAt", e.target.value)} /></Field>
                <Field label="작성자"><input className="input" value={form.writer} onChange={(e) => update("writer", e.target.value)} /></Field>
                <Field label="분류"><Select value={form.category} onChange={(v) => update("category", v)} options={["장애접수","문의대응","방문예정","현장수리","원격지원","처리완료","일정공유","자재/입출고","회의/교육"]}/></Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="상태"><Select value={form.status} onChange={(v) => update("status", v)} options={["접수","통화완료","방문예정","진행중","완료","보류","견적필요","부품필요"]}/></Field>
                <Field label="기관/부서"><input className="input" value={form.agency} onChange={(e) => update("agency", e.target.value)} /></Field>
                <Field label="함정/현장명"><input className="input" value={form.vessel} onChange={(e) => update("vessel", e.target.value)} /></Field>
                <Field label="위치"><input className="input" value={form.location} onChange={(e) => update("location", e.target.value)} /></Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="장비명"><input className="input" value={form.equipment} onChange={(e) => update("equipment", e.target.value)} /></Field>
                <Field label="모델명"><input className="input" value={form.model} onChange={(e) => update("model", e.target.value)} /></Field>
                <Field label="담당자"><input className="input" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></Field>
                <Field label="연락처"><input className="input" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} /></Field>
              </div>

              <Field label="증상 / 요청사항"><textarea className="textarea" value={form.symptom} onChange={(e) => update("symptom", e.target.value)} /></Field>
              <Field label="조치내용"><textarea className="textarea" value={form.action} onChange={(e) => update("action", e.target.value)} /></Field>
              <Field label="다음 조치 / 방문예정"><textarea className="textarea" value={form.nextAction} onChange={(e) => update("nextAction", e.target.value)} /></Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="담당 작업자"><input className="input" value={form.worker} onChange={(e) => update("worker", e.target.value)} /></Field>
                <Field label="작업시간"><input className="input" value={form.workTime} onChange={(e) => update("workTime", e.target.value)} /></Field>
                <Field label="일보기준일"><input type="date" className="input" value={form.date} onChange={(e) => update("date", e.target.value)} /></Field>
              </div>

              <Field label="현장사진">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-5 text-sm font-bold hover:bg-slate-50">
                  <Camera className="h-5 w-5" />사진 선택
                  <input className="hidden" type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} />
                </label>
              </Field>
              {form.photos.length > 0 && <div className="mb-4 grid grid-cols-3 gap-2">{form.photos.map((p, i) => <img key={i} src={p} className="h-24 w-full rounded-xl object-cover" />)}</div>}

              <button onClick={submit} className="w-full rounded-2xl bg-sky-600 px-5 py-4 font-black text-white"><Send className="mr-1 inline h-5 w-5" />일보 데이터 등록</button>
            </div>
            <ReportPreview report={form} hideActions />
          </section>
        )}

        {tab === "list" && (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-black">작업일보 목록</h2>
              <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => <button key={r.id} onClick={() => { setSelectedId(r.id); setTab("detail"); }} className="rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><div className="flex justify-between gap-2"><b>{r.vessel || r.agency}</b><span className="text-sm text-slate-500">{r.date}</span></div><p className="mt-1 text-sm text-slate-600">{r.category} · {r.status}</p><p className="mt-3 line-clamp-3 text-sm text-slate-500">{r.symptom}</p></button>)}
            </div>
          </section>
        )}

        {tab === "detail" && selected && (
          <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <ReportPreview report={selected} />
            <aside className="no-print rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-4 text-lg font-black">관리</h3>
              <button onClick={() => window.print()} className="mb-2 w-full rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white"><Printer className="mr-1 inline h-4 w-4" />PDF/인쇄</button>
              <button onClick={() => saveAsText(selected)} className="mb-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold"><Download className="mr-1 inline h-4 w-4" />TXT 다운로드</button>
              <button onClick={() => removeReport(selected.id)} className="w-full rounded-2xl border border-red-200 px-4 py-3 font-bold text-red-600"><Trash2 className="mr-1 inline h-4 w-4" />삭제</button>
            </aside>
          </section>
        )}
      </main>

      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white sm:hidden">
        <div className="grid grid-cols-4 text-xs font-bold">
          <NavBtn icon={<Home />} label="홈" active={tab === "home"} onClick={() => setTab("home")} />
          <NavBtn icon={<Plus />} label="등록" active={tab === "write"} onClick={() => setTab("write")} />
          <NavBtn icon={<ListChecks />} label="목록" active={tab === "list"} onClick={() => setTab("list")} />
          <NavBtn icon={<FileText />} label="상세" active={tab === "detail"} onClick={() => setTab("detail")} />
        </div>
      </nav>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="mb-4 block"><span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>{children}</label>;
}
function Select({ value, onChange, options }) {
  return <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select>;
}
function NavBtn({ icon, label, active, onClick }) {
  return <button onClick={onClick} className={`py-3 ${active ? "text-sky-700" : "text-slate-500"}`}>{React.cloneElement(icon, { className: "mx-auto mb-1 h-5 w-5" })}{label}</button>;
}
function Row({ label, value }) {
  return <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 font-bold">{value || "-"}</p></div>;
}
function Block({ title, text }) {
  return <div className="mt-4 rounded-2xl border border-slate-200 p-4"><h4 className="mb-2 font-black">{title}</h4><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{text || "입력 없음"}</p></div>;
}
function ReportPreview({ report, hideActions }) {
  return <article className="print-card rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
    <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
      <div><p className="text-xs font-bold text-sky-700">KCT CO., Ltd / kct@kctro.com / 051-326-7119</p><h2 className="mt-1 text-2xl font-black tracking-[0.35em]">작 업 일 보</h2></div>
      {!hideActions && <button onClick={() => window.print()} className="no-print rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white"><Printer className="inline h-4 w-4" /></button>}
    </div>
    <div className="grid gap-3 sm:grid-cols-4">
      <Row label="일자" value={report.date} />
      <Row label="기관" value={report.agency} />
      <Row label="함정/현장" value={report.vessel} />
      <Row label="상태" value={report.status} />
      <Row label="분류" value={report.category} />
      <Row label="장비" value={report.equipment} />
      <Row label="모델" value={report.model} />
      <Row label="담당" value={report.worker || report.writer} />
    </div>
    <Block title="1. 증상 / 요청사항" text={report.symptom} />
    <Block title="2. 조치내용" text={report.action} />
    <Block title="3. 다음 조치 / 방문예정" text={report.nextAction} />
    <Block title="4. 특기사항" text={report.notes} />
    {report.photos?.length > 0 && <div className="mt-4 rounded-2xl border border-slate-200 p-4"><h4 className="mb-3 font-black">5. 현장사진</h4><div className="grid grid-cols-2 gap-3">{report.photos.map((p, i) => <img key={i} src={p} className="h-44 w-full rounded-xl object-cover" />)}</div></div>}
  </article>;
}
