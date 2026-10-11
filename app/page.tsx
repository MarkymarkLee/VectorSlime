"use client";

import dynamic from "next/dynamic";
import LeftRail from "@/components/controls/LeftRail";
import ErrorToast from "@/components/controls/ErrorToast";
import Dashboard from "@/components/home/Dashboard";
import SettingsModal from "@/components/settings/SettingsModal";
import TutorCam from "@/components/tutor/TutorCam";

// tldraw and the audio stack are browser-only.
const Whiteboard = dynamic(() => import("@/components/board/Whiteboard"), { ssr: false });

export default function Home() {
  return (
    <main>
      <Whiteboard />
      <LeftRail />
      <TutorCam />
      <ErrorToast />
      <Dashboard />
      <SettingsModal />
    </main>
  );
}
