"use client";

import type { Editor } from "tldraw";
import { startCourse, stashCoursePlan } from "@/lib/courses/run";
import { clearFocus } from "@/lib/board/focus";
import { usePlan } from "@/lib/plan/store";
import { uploadHomework } from "@/lib/plan/upload";
import { useSession } from "@/lib/session/store";
import { askTutor, endLive, getEditor, goLive, resetTutorState } from "@/lib/session/tutor";

export type SessionKind = { kind: "course"; courseId: string } | { kind: "homework"; file: File } | { kind: "free" };

/** Wipe the board: every shape (locked ones too), extra pages, images, undo history. */
function resetBoard(editor: Editor) {
  editor.run(
    () => {
      const pages = editor.getPages();
      editor.setCurrentPage(pages[0].id);
      for (const page of pages.slice(1)) editor.deletePage(page.id);
      editor.deleteShapes([...editor.getCurrentPageShapeIds()]);
      editor.deleteAssets(editor.getAssets().map((a) => a.id));
    },
    { ignoreShapeLock: true, history: "ignore" },
  );
  editor.clearHistory();
  editor.setCamera({ x: 0, y: 0, z: 1 });
}

/** Everything a session owns goes; course progress stays. */
function resetSession() {
  const editor = getEditor();
  if (editor) {
    clearFocus(editor);
    resetBoard(editor);
  }
  resetTutorState();
  stashCoursePlan();
  usePlan.getState().set({ plan: null, phase: "idle", phaseDetail: "", error: null });
  useSession.getState().set({ messages: [], caption: "", awaitingStudent: false, error: null });
}

/** Start a live session on a fresh board. */
export async function startSession(session: SessionKind) {
  resetSession();
  await goLive();

  if (session.kind === "course") {
    startCourse(session.courseId, { fresh: true, greet: true });
  } else if (session.kind === "homework") {
    void askTutor(
      "(The student just joined and uploaded their homework, which you're reading right now. Greet them in one short sentence and say you'll have a plan for today in a moment. Don't ask anything yet.)",
      { hidden: true },
    );
    void uploadHomework(session.file);
  } else {
    void askTutor(
      "(The student just joined the stream. Greet them in one short sentence and ask what they're working on today.)",
      { hidden: true },
    );
  }
}

export function endSession() {
  endLive();
  clearFocus(getEditor());
}
