"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { SessionDetail } from "@regen/types";
import type { SheetRow, LastRef } from "../_components/_types";

export function useLoggerActions({
  sessionId,
  currentExIdx,
  session,
  load,
  setEquipmentType,
  sheetRows,
  setSheetRows,
  setLoggerOpen,
  lastRef,
}: {
  sessionId: string;
  currentExIdx: number;
  session: SessionDetail | null;
  load: () => void;
  setEquipmentType: (v: "barra" | "mancuernas" | "maquina" | null) => void;
  sheetRows: SheetRow[];
  setSheetRows: (v: SheetRow[] | ((prev: SheetRow[]) => SheetRow[])) => void;
  setLoggerOpen: (v: boolean) => void;
  lastRef: LastRef | null;
}) {
  const { api } = useAuth();

  const openLogger = useCallback((target: SessionDetail["exercises"][number]) => {
    const savedEquip = target.sets.find((s) => s.notes === "barra" || s.notes === "mancuernas" || s.notes === "maquina");
    if (savedEquip) {
      setEquipmentType(savedEquip.notes as "barra" | "mancuernas" | "maquina");
    } else {
      const lastEquip = lastRef?.notes === "barra" || lastRef?.notes === "mancuernas" || lastRef?.notes === "maquina"
        ? lastRef.notes
        : null;
      if (lastEquip) {
        setEquipmentType(lastEquip as "barra" | "mancuernas" | "maquina");
      } else {
        try {
          const eq = localStorage.getItem(`regen_equip_${sessionId}_${target.id}`);
          setEquipmentType(eq === "barra" || eq === "mancuernas" || eq === "maquina" ? eq : null);
        } catch { setEquipmentType(null); }
      }
    }
    setSheetRows([]);
    setLoggerOpen(true);
  }, [sessionId, lastRef, setEquipmentType, setSheetRows, setLoggerOpen]);

  const deleteSet = useCallback(async (setNumber: number) => {
    const ex = session?.exercises[currentExIdx];
    if (!ex) return;
    const row = sheetRows.find((r) => r.setNumber === setNumber);
    if (!row) return;
    if (row.isSaved) {
      try {
        await api.del(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${setNumber}`);
      } catch (e) { console.error(e); }
    }
    setSheetRows((prev) => prev.filter((r) => r.setNumber !== setNumber));
    load();
  }, [session, currentExIdx, sheetRows, api, sessionId, load, setSheetRows]);

  return { openLogger, deleteSet };
}
