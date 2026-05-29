// 입력 폼 임시 백업 헬퍼 — 네트워크 끊김·세션 만료·실수 새로고침 대비
// 동작: 폼 state를 localStorage에 debounce(500ms) 저장,
// 제출 성공 시 clearDraft 호출로 삭제
//
// 사용:
//   const [form, setForm] = useState(() => restoreDraft(KEY) || DEFAULT);
//   useDraftBackup(KEY, form);
//   // submit 성공 후:  clearDraft(KEY);

import { useEffect, useRef } from "react";

const NS = "20ha:draft:";

export const draftKey = (form, scopeId) => `${NS}${form}${scopeId ? ":" + scopeId : ""}`;

export const restoreDraft = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.v === 1 ? parsed.data : null;
  } catch (_) { return null; }
};

export const clearDraft = (key) => {
  if (!key) return;
  try { localStorage.removeItem(key); } catch (_) {}
};

// state가 바뀔 때마다 debounce 500ms 후 백업
export const useDraftBackup = (key, state, options = {}) => {
  const { debounceMs = 500, enabled = true } = options;
  const firstRef = useRef(true);
  useEffect(() => {
    if (!enabled || !key) return;
    // 첫 렌더(복원 직후)에는 굳이 다시 저장 안 함
    if (firstRef.current) { firstRef.current = false; return; }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ v: 1, ts: Date.now(), data: state }));
      } catch (_) {}
    }, debounceMs);
    return () => clearTimeout(t);
  }, [key, state, enabled, debounceMs]);
};
