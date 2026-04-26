import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, Camera, Car, Download, FileText, Home, ListChecks, Plus, Printer, Search, Send, Trash2, UserRound, Wallet } from "lucide-react";
import "./style.css";

const STORAGE_KEY = "kct-work-reports-v1";

const initialReports = [
  {
    id: 1,
    date: "2026-04-10",
    site: "고려조선",
    worker: "박재성",
    workTime: "08:00~17:00",
    today: "수산과학조사선 탐구2호\n- ECDIS Remote Display 케이블 복구 및 결선\n- 트롤링장비 Spare part 및 잔여자재 습식연구실 내부 적재보관\n\n완도군행정선\n- 무선국 검사 수검\n- Radar / ECDIS / Anemometer / GPS 컴파스 통신신호 점검",
    tomorrow: "탐구2호\n- 위성TV 수신기 설치결선 및 함내 TV 연동작업\n- 자동전화장치 Bell 및 Lamp 교체\n\n완도군행정선 전남557호\n- 회의실 CBT 및 LAN outlet 설치 및 결선",
    notes: "4월13일 탐구2호 JK조선 FD상가 수리예정, 아침 8시 출항\n완도군행정선 무선국검사 수수료 고지서 우편발송 요청",
    vehicle: "",
    expense: "",
    photos: []
  }
];

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  site: "",
  worker: "",
  workTime: "08:00~17:00",
  today: "",
  tomorrow: "",
  notes: "",
  vehicle: "",
  expense: "",
  photos: []
};

function loadReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialReports;
  } catch {
    return initialReports;
  }
}

function persistReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function lines(text) {
  return String(text || "").split("\n").map((v) => v.trim()).filter(Boolean);
}

function saveAsText(report) {
  const content = `KCT 작업일보\n\n일자: ${report.date}\n현장: ${report.site}\n작업자: ${report.worker}\n작업시간: ${report.workTime}\n\n[금일 작업내용]\n${report.today}\n\n[익일/차주 작업내용]\n${report.tomorrow}\n\n[차량운행]\n${report.vehicle}\n\n[경비사용]\n${report.expense}\n\n[특기사항]\n${report.notes}`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `KCT_작업일보_${report.date}_${report.site}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [reports, setReportsState] = useState(loadReports);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(reports[0]?.id || null);
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");

  function setReports(next) {
    setReportsState(next);
    persistReports(next);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter((r) => [r.date, r.site, r.worker, r.today, r.tomorrow, r.notes].join(" ").toLowerCase().includes(q));
  }, [reports, query]);

  const selected = reports.find((r) => r.id === selectedId) || reports[0];

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPhotos(files) {
    Array.from(files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setForm((prev) => ({ ...prev, photos: [...prev.photos, reader.result] }));
      reader.readAsDataURL(file);
    });
  }

  function submit() {
    const next = {
      ...form,
      id: Date.now(),
      site: form.site || "현장명 미입력",
      worker: form.worker || "작업자 미입력"
    };
    const updated = [next, ...reports];
    setReports(updated);
    setSelectedId(next.id);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setTab("detail");
  }

  function removeReport(id) {
    const next = reports.filter((r) => r.id !== id);
    setReports(next);
    setSelectedId(next[0]?.id || null);
    setTab(next.length ? "list" : "home");
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="topbar-inner">
          <div>
            <p className="brand">KCT CO., Ltd</p>
            <h1>작업일보 웹사이트</h1>
          </div>
          <button onClick={() => setTab("write")} className="primary-btn"><Plus size={16} />보고 등록</button>
        </div>
      </header>

      <main className="container">
        {tab === "home" && (
          <section className="home-grid">
            <div className="hero card">
              <p className="pill">단톡방 입력 방식 대응</p>
              <h2>현장 채팅 내용을<br />작업일보로 자동 정리</h2>
              <p className="hero-desc">스마트폰에서 작업내용, 사진, 차량운행, 경비를 입력하고 즉시 작업일보로 확인할 수 있는 KCT 전용 웹앱입니다.</p>
              <div className="mini-grid">
                <MiniCard icon={<FileText />} title="일보 작성" desc="현장별 기록" />
                <MiniCard icon={<Camera />} title="사진 첨부" desc="모바일 업로드" />
                <MiniCard icon={<Printer />} title="PDF 저장" desc="인쇄로 저장" />
              </div>
              <div className="button-row">
                <button onClick={() => setTab("write")} className="dark-btn">새 작업일보 작성</button>
                <button onClick={() => setTab("list")} className="outline-btn">기존 작업일보 보기</button>
              </div>
            </div>
            {selected && <ReportPreview report={selected} onPrint={() => window.print()} />}
          </section>
        )}

        {tab === "write" && (
          <section className="write-grid">
            <div className="card form-card">
              <h2>새 작업보고 등록</h2>
              <div className="form-grid">
                <Field label="작업일자"><input type="date" className="input" value={form.date} onChange={(e) => update("date", e.target.value)} /></Field>
                <Field label="작업시간"><input className="input" value={form.workTime} onChange={(e) => update("workTime", e.target.value)} /></Field>
                <Field label="현장명"><input className="input" placeholder="예: 고려조선 / 탐구2호" value={form.site} onChange={(e) => update("site", e.target.value)} /></Field>
                <Field label="작업자"><input className="input" placeholder="예: 박재성" value={form.worker} onChange={(e) => update("worker", e.target.value)} /></Field>
              </div>
              <Field label="금일 작업내용"><textarea className="textarea big" placeholder="단톡방에 올릴 내용처럼 줄바꿈으로 입력" value={form.today} onChange={(e) => update("today", e.target.value)} /></Field>
              <Field label="익일/차주 작업내용"><textarea className="textarea" value={form.tomorrow} onChange={(e) => update("tomorrow", e.target.value)} /></Field>
              <div className="form-grid">
                <Field label="차량운행"><input className="input" placeholder="예: 부산~고려조선 38km" value={form.vehicle} onChange={(e) => update("vehicle", e.target.value)} /></Field>
                <Field label="경비사용"><input className="input" placeholder="예: 자재 35,000원" value={form.expense} onChange={(e) => update("expense", e.target.value)} /></Field>
              </div>
              <Field label="특기사항"><textarea className="textarea" value={form.notes} onChange={(e) => update("notes", e.target.value)} /></Field>
              <Field label="현장사진"><label className="upload-box"><Camera size={20} />사진 선택<input className="hidden" type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} /></label></Field>
              {form.photos.length > 0 && <div className="photo-grid small">{form.photos.map((p, i) => <img key={i} src={p} alt="첨부사진" />)}</div>}
              <button onClick={submit} className="submit-btn"><Send size={18} />작업일보 등록</button>
            </div>
            <div className="side-stack"><ChatGuide /><ReportPreview report={{ ...form, site: form.site || "현장명", worker: form.worker || "작업자" }} hideActions /></div>
          </section>
        )}

        {tab === "list" && (
          <section className="card">
            <div className="list-head">
              <h2>작업일보 목록</h2>
              <div className="search-box"><Search size={16} /><input placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            </div>
            <div className="report-list">
              {filtered.map((r) => <button key={r.id} onClick={() => { setSelectedId(r.id); setTab("detail"); }} className="report-item"><div><b>{r.site}</b><span>{r.date}</span></div><p>{r.worker} · {r.workTime}</p><small>{r.today}</small></button>)}
            </div>
          </section>
        )}

        {tab === "detail" && selected && (
          <section className="detail-grid">
            <ReportPreview report={selected} onPrint={() => window.print()} onDownload={() => saveAsText(selected)} />
            <aside className="card no-print manager">
              <h3>관리</h3>
              <button onClick={() => window.print()} className="dark-btn full"><Printer size={16} />PDF/인쇄</button>
              <button onClick={() => saveAsText(selected)} className="outline-btn full"><Download size={16} />TXT 다운로드</button>
              <button onClick={() => removeReport(selected.id)} className="danger-btn full"><Trash2 size={16} />삭제</button>
            </aside>
          </section>
        )}
      </main>

      <nav className="mobile-nav no-print">
        <NavBtn icon={<Home />} label="홈" active={tab === "home"} onClick={() => setTab("home")} />
        <NavBtn icon={<Plus />} label="등록" active={tab === "write"} onClick={() => setTab("write")} />
        <NavBtn icon={<ListChecks />} label="목록" active={tab === "list"} onClick={() => setTab("list")} />
        <NavBtn icon={<FileText />} label="상세" active={tab === "detail"} onClick={() => setTab("detail")} />
      </nav>
    </div>
  );
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function MiniCard({ icon, title, desc }) { return <div className="mini-card"><div className="mini-icon">{icon}</div><b>{title}</b><p>{desc}</p></div>; }
function NavBtn({ icon, label, active, onClick }) { return <button onClick={onClick} className={active ? "active" : ""}>{icon}<span>{label}</span></button>; }
function Info({ icon, label, value }) { return <div className="info"><p>{icon}{label}</p><b>{value || "-"}</b></div>; }
function TextBlock({ title, text }) { const arr = lines(text); return <div className="text-block"><h4>{title}</h4>{arr.length ? <ul>{arr.map((v, i) => <li key={i}>{v}</li>)}</ul> : <p className="empty">입력 없음</p>}</div>; }
function ReportPreview({ report, onPrint, onDownload, hideActions }) { return <article className="report-card card"><div className="report-title"><div><p>KCT CO., Ltd / kct@kctro.com / 051-326-7119</p><h2>작 업 일 보</h2></div>{!hideActions && <div className="action-row no-print"><button onClick={onPrint} className="dark-icon"><Printer size={16} /></button>{onDownload && <button onClick={onDownload} className="outline-icon"><Download size={16} /></button>}</div>}</div><div className="info-grid"><Info icon={<CalendarDays size={15} />} label="일자" value={report.date} /><Info icon={<Home size={15} />} label="현장" value={report.site} /><Info icon={<UserRound size={15} />} label="작업자" value={report.worker} /><Info icon={<FileText size={15} />} label="시간" value={report.workTime} /></div><TextBlock title="1. 금일 작업내용" text={report.today} /><TextBlock title="2. 익일/차주 작업내용" text={report.tomorrow} /><div className="two-grid"><Info icon={<Car size={15} />} label="차량운행" value={report.vehicle} /><Info icon={<Wallet size={15} />} label="경비사용" value={report.expense} /></div><TextBlock title="3. 특기사항" text={report.notes} />{report.photos?.length > 0 && <div className="text-block"><h4>4. 현장사진</h4><div className="photo-grid">{report.photos.map((p, i) => <img key={i} src={p} alt="현장사진" />)}</div></div>}</article>; }
function ChatGuide() { return <div className="chat-guide card"><h3>단톡방 입력 예시</h3><p>[작업보고]<br />날짜: 2026-04-10<br />현장: 고려조선<br />작업자: 박재성<br />금일: 탐구2호 ECDIS 케이블 복구<br />익일: 위성TV 수신기 설치<br />특기사항: 4월13일 수리 예정</p></div>; }

createRoot(document.getElementById("root")).render(<App />);
